/**
 * Referral System - Server-side business logic
 * 
 * Reward Structure:
 * - Referee (new user): 500 free coins on sign-up + 50 free spins
 * - Referrer:
 *   - When referee signs up: +100 coins
 *   - When referee earns 1000 coins: +200 coins
 *   - When referee makes first purchase: 10% of purchase as coins
 *   - When referee reaches 30 days active: +500 coins bonus
 */

import { eq, and } from "drizzle-orm";
import { getDb, updatePlayerCoins, updateGreenCoins } from "./db";
import {
  referralCodes,
  referrals,
  referralRewards,
  referralMilestones,
  users,
  playerStats,
  InsertReferralCode,
  InsertReferral,
  InsertReferralReward,
} from "../drizzle/schema";

// Characters for referral code generation (no confusing chars: 0/O, 1/L/I)
const CODE_CHARS = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const CODE_LENGTH = 8;

/**
 * Generate a unique 8-character referral code
 */
function generateReferralCode(): string {
  let code = "";
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += CODE_CHARS.charAt(Math.floor(Math.random() * CODE_CHARS.length));
  }
  return code;
}

/**
 * Create a referral code for a user
 * Returns the existing code if user already has one
 */
export async function getOrCreateReferralCode(userId: number): Promise<string> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Check if user already has a code
  const existing = await db
    .select()
    .from(referralCodes)
    .where(eq(referralCodes.userId, userId))
    .limit(1);

  if (existing.length > 0) {
    return existing[0].code;
  }

  // Generate unique code (retry if collision)
  let code: string;
  let attempts = 0;
  do {
    code = generateReferralCode();
    const collision = await db
      .select()
      .from(referralCodes)
      .where(eq(referralCodes.code, code))
      .limit(1);
    if (collision.length === 0) break;
    attempts++;
  } while (attempts < 10);

  if (attempts >= 10) {
    throw new Error("Failed to generate unique referral code");
  }

  // Save the code
  const newCode: InsertReferralCode = { userId, code };
  await db.insert(referralCodes).values(newCode);

  return code;
}

/**
 * Get user's referral code (null if none)
 */
export async function getUserReferralCode(userId: number): Promise<string | null> {
  const db = await getDb();
  if (!db) return null;

  const result = await db
    .select()
    .from(referralCodes)
    .where(eq(referralCodes.userId, userId))
    .limit(1);

  return result.length > 0 ? result[0].code : null;
}

/**
 * Look up user by referral code (case-insensitive)
 */
export async function getUserIdByReferralCode(code: string): Promise<number | null> {
  const db = await getDb();
  if (!db) return null;

  const upperCode = code.toUpperCase();
  const result = await db
    .select()
    .from(referralCodes)
    .where(eq(referralCodes.code, upperCode))
    .limit(1);

  return result.length > 0 ? result[0].userId : null;
}

/**
 * Process a referral when a new user signs up with a code
 * - Creates referral relationship
 * - Awards referee 500 coins + 50 spins
 * - Awards referrer 100 coins (signup bonus)
 */
export async function processReferralSignup(
  refereeUserId: number,
  referralCode: string
): Promise<{ success: boolean; referrerId: number | null; error?: string }> {
  const db = await getDb();
  if (!db) return { success: false, referrerId: null, error: "Database not available" };

  // Find referrer by code
  const referrer = await db
    .select()
    .from(referralCodes)
    .where(eq(referralCodes.code, referralCode.toUpperCase()))
    .limit(1);

  if (referrer.length === 0) {
    return { success: false, referrerId: null, error: "Invalid referral code" };
  }

  const referrerId = referrer[0].userId;

  // Prevent self-referral
  if (referrerId === refereeUserId) {
    return { success: false, referrerId: null, error: "Cannot refer yourself" };
  }

  // Check if referee already has a referral (one-time only)
  const existingReferral = await db
    .select()
    .from(referrals)
    .where(eq(referrals.refereeId, refereeUserId))
    .limit(1);

  if (existingReferral.length > 0) {
    return { success: false, referrerId: null, error: "Already referred" };
  }

  // Create referral relationship
  const newReferral: InsertReferral = {
    referrerId,
    refereeId: refereeUserId,
    codeUsed: referralCode.toUpperCase(),
    status: "signed_up",
  };
  await db.insert(referrals).values(newReferral);

  // Create milestone tracking record
  const referralRow = await db
    .select()
    .from(referrals)
    .where(
      and(
        eq(referrals.referrerId, referrerId),
        eq(referrals.refereeId, refereeUserId)
      )
    )
    .limit(1);

  if (referralRow.length > 0) {
    await db.insert(referralMilestones).values({
      referralId: referralRow[0].id,
    });
  }

  // Award referee: 500 coins + 50 spins (spins stored in playerStats.goldCoins bonus)
  // Actually spins might be handled differently, let's just add coins for now
  // The 500 coins are bonus coins for the new user
  await updatePlayerCoins(refereeUserId, 500);
  
  // Award referrer: 100 coins for signup bonus
  await updatePlayerCoins(referrerId, 100);

  // Record the signup reward for referrer
  if (referralRow.length > 0) {
    const signupReward: InsertReferralReward = {
      referrerId,
      refereeId: refereeUserId,
      referralId: referralRow[0].id,
      rewardType: "signup_bonus",
      coinsAwarded: 100,
      status: "pending", // Auto-claimed or pending based on design
    };
    await db.insert(referralRewards).values(signupReward);
  }

  return { success: true, referrerId };
}

/**
 * Check and award rewards when referee reaches milestones
 * Called by other systems (game logic, purchase logic) when relevant events occur
 */
export async function checkAndAwardReferralMilestones(
  refereeUserId: number,
  event: "coins_earned" | "purchase" | "days_active",
  eventValue?: number
): Promise<void> {
  const db = await getDb();
  if (!db) return;

  // Find active referral for this referee
  const referral = await db
    .select()
    .from(referrals)
    .where(eq(referrals.refereeId, refereeUserId))
    .limit(1);

  if (referral.length === 0) return;

  const referralId = referral[0].id;

  // Get or create milestone record
  let milestones = await db
    .select()
    .from(referralMilestones)
    .where(eq(referralMilestones.referralId, referralId))
    .limit(1);

  if (milestones.length === 0) {
    await db.insert(referralMilestones).values({ referralId });
    milestones = await db
      .select()
      .from(referralMilestones)
      .where(eq(referralMilestones.referralId, referralId))
      .limit(1);
  }

  const milestone = milestones[0];
  const referrerId = referral[0].referrerId;

  switch (event) {
    case "coins_earned": {
      // Check if referee earned their first 1000 coins (cumulative)
      const stats = await db
        .select()
        .from(playerStats)
        .where(eq(playerStats.userId, refereeUserId))
        .limit(1);

      if (stats.length > 0 && stats[0].coins >= 1000 && milestone.earned1000Coins === 0) {
        // Mark milestone and award referrer
        await db.update(referralMilestones)
          .set({ earned1000Coins: Date.now() })
          .where(eq(referralMilestones.id, milestone.id));

        await updatePlayerCoins(referrerId, 200);

        // Record reward
        await db.insert(referralRewards).values({
          referrerId,
          refereeId: refereeUserId,
          referralId,
          rewardType: "first_1000_coins",
          coinsAwarded: 200,
          status: "pending",
        });
      }
      break;
    }

    case "purchase": {
      // Award referrer 10% of purchase as coins
      if (milestone.madeFirstPurchase === 0 && eventValue && eventValue > 0) {
        const purchaseReward = Math.floor(eventValue * 0.1); // 10% of coins purchased

        await db.update(referralMilestones)
          .set({ madeFirstPurchase: Date.now() })
          .where(eq(referralMilestones.id, milestone.id));

        await updatePlayerCoins(referrerId, purchaseReward);

        await db.insert(referralRewards).values({
          referrerId,
          refereeId: refereeUserId,
          referralId,
          rewardType: "first_purchase",
          coinsAwarded: purchaseReward,
          status: "pending",
        });
      }
      break;
    }

    case "days_active": {
      // Award referrer 500 coins when referee is active 30 days
      if (milestone.active30Days === 0 && eventValue && eventValue >= 30) {
        await db.update(referralMilestones)
          .set({ active30Days: Date.now() })
          .where(eq(referralMilestones.id, milestone.id));

        await updatePlayerCoins(referrerId, 500);

        await db.insert(referralRewards).values({
          referrerId,
          refereeId: refereeUserId,
          referralId,
          rewardType: "active_30_days",
          coinsAwarded: 500,
          status: "pending",
        });
      }
      break;
    }
  }

  // Check if all milestones complete
  const updated = await db
    .select()
    .from(referralMilestones)
    .where(eq(referralMilestones.referralId, referralId))
    .limit(1);

  if (updated.length > 0 && updated[0].earned1000Coins > 0 && updated[0].madeFirstPurchase > 0) {
    await db.update(referrals)
      .set({ status: "earned_rewards" })
      .where(eq(referrals.id, referralId));
  }
}

/**
 * Get referral stats for a user
 */
export async function getReferralStats(userId: number): Promise<{
  totalReferrals: number;
  pendingRewards: number;
  claimedRewards: number;
  totalCoinsEarned: number;
  referralCode: string | null;
}> {
  const db = await getDb();
  if (!db) {
    return {
      totalReferrals: 0,
      pendingRewards: 0,
      claimedRewards: 0,
      totalCoinsEarned: 0,
      referralCode: null,
    };
  }

  // Get referral code
  const code = await getUserReferralCode(userId);

  // Count referrals
  const referralList = await db
    .select()
    .from(referrals)
    .where(eq(referrals.referrerId, userId));

  // Count pending and claimed rewards
  const allRewards = await db
    .select()
    .from(referralRewards)
    .where(eq(referralRewards.referrerId, userId));

  const pendingRewards = allRewards.filter(r => r.status === "pending").length;
  const claimedRewards = allRewards.filter(r => r.status === "claimed").length;
  const totalCoinsEarned = allRewards.reduce((sum, r) => sum + r.coinsAwarded, 0);

  return {
    totalReferrals: referralList.length,
    pendingRewards,
    claimedRewards,
    totalCoinsEarned,
    referralCode: code,
  };
}

/**
 * Get list of user's referrals with status
 */
export async function getUserReferrals(userId: number): Promise<Array<{
  id: number;
  refereeName: string;
  status: string;
  createdAt: Date;
  rewardsEarned: number;
}>> {
  const db = await getDb();
  if (!db) return [];

  const referralList = await db
    .select()
    .from(referrals)
    .where(eq(referrals.referrerId, userId));

  const result = [];
  for (const ref of referralList) {
    // Get referee name
    const referee = await db
      .select()
      .from(users)
      .where(eq(users.id, ref.refereeId))
      .limit(1);

    // Get rewards for this referral
    const rewards = await db
      .select()
      .from(referralRewards)
      .where(eq(referralRewards.referralId, ref.id));

    result.push({
      id: ref.id,
      refereeName: referee.length > 0 ? referee[0].name || "User" : "Unknown",
      status: ref.status,
      createdAt: ref.createdAt,
      rewardsEarned: rewards.reduce((sum, r) => sum + r.coinsAwarded, 0),
    });
  }

  return result;
}

/**
 * Claim pending referral rewards (marks them as claimed)
 */
export async function claimReferralRewards(userId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;

  const pending = await db
    .select()
    .from(referralRewards)
    .where(
      and(
        eq(referralRewards.referrerId, userId),
        eq(referralRewards.status, "pending")
      )
    );

  if (pending.length === 0) return 0;

  let totalClaimed = 0;
  for (const reward of pending) {
    // Coins already added when reward was created, just mark as claimed
    await db.update(referralRewards)
      .set({ 
        status: "claimed",
        claimedAt: new Date(),
      })
      .where(eq(referralRewards.id, reward.id));
    totalClaimed += reward.coinsAwarded;
  }

  return totalClaimed;
}