/**
 * Cash-Out System
 * Handles player withdrawals and conversions from virtual coins to real money
 */

import { eq, and } from "drizzle-orm";
import { getDb } from "./db";
import { cashOutRequests, playerStats } from "../drizzle/schema";

// Conversion rate: 100 coins = $1 USD
export const COINS_PER_DOLLAR = 100;
export const MINIMUM_CASHOUT_CENTS = 500; // $5 minimum
export const MAXIMUM_CASHOUT_CENTS = 50000; // $500 maximum per request

export interface CashOutRequest {
  id: number;
  userId: number;
  coinsRequested: number;
  amountUsd: number;
  paymentMethod: "square" | "bitcoin" | "ethereum" | "litecoin" | "usdc";
  paymentAddress: string | null;
  status: "pending" | "processing" | "completed" | "failed" | "cancelled";
  stripePayoutId: string | null; // legacy column name, used for Square payout ID
  cryptoTransactionId: string | null;
  failureReason: string | null;
  createdAt: Date;
  processedAt: Date | null;
  completedAt: Date | null;
}

/**
 * Validate cash-out request
 */
export function validateCashOutRequest(
  playerCoins: number,
  requestedCoins: number,
  amountUsd: number
): { valid: boolean; error?: string } {
  // Check if player has enough coins
  if (playerCoins < requestedCoins) {
    return { valid: false, error: "Insufficient coins for cash-out" };
  }

  // Check minimum amount
  if (amountUsd < MINIMUM_CASHOUT_CENTS) {
    return {
      valid: false,
      error: `Minimum cash-out is $${(MINIMUM_CASHOUT_CENTS / 100).toFixed(2)}`,
    };
  }

  // Check maximum amount
  if (amountUsd > MAXIMUM_CASHOUT_CENTS) {
    return {
      valid: false,
      error: `Maximum cash-out is $${(MAXIMUM_CASHOUT_CENTS / 100).toFixed(2)} per request`,
    };
  }

  // Verify coin-to-USD conversion
  const expectedCoins = Math.floor((amountUsd / 100) * COINS_PER_DOLLAR);
  if (Math.abs(requestedCoins - expectedCoins) > 10) {
    return { valid: false, error: "Invalid coin-to-USD conversion" };
  }

  return { valid: true };
}

/**
 * Create a cash-out request
 */
export async function createCashOutRequest(
  userId: number,
  coinsRequested: number,
  amountUsd: number,
  paymentMethod: "square" | "bitcoin" | "ethereum" | "litecoin" | "usdc",
  paymentAddress?: string
): Promise<CashOutRequest | null> {
  const db = await getDb();
  if (!db) return null;

  try {
    // Get player stats to verify they have enough coins
    const playerRecord = await db
      .select()
      .from(playerStats)
      .where(eq(playerStats.userId, userId))
      .limit(1);

    if (!playerRecord.length) {
      return null;
    }

    const player = playerRecord[0];

    // Validate request
    const validation = validateCashOutRequest(
      player.coins,
      coinsRequested,
      amountUsd
    );
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    // Create cash-out request
    await db.insert(cashOutRequests).values({
      userId,
      coinsRequested,
      amountUsd,
      paymentMethod,
      paymentAddress: paymentAddress || null,
      status: "pending",
    });

    // Deduct coins from player immediately
    await db
      .update(playerStats)
      .set({ coins: player.coins - coinsRequested })
      .where(eq(playerStats.userId, userId));

    // Fetch and return the created request (get most recent)
    const created = await db
      .select()
      .from(cashOutRequests)
      .where(eq(cashOutRequests.userId, userId))
      .limit(1);

    return created[0] || null;
  } catch (error) {
    console.error("[CashOut] Failed to create request:", error);
    return null;
  }
}

/**
 * Get cash-out request by ID
 */
export async function getCashOutRequest(
  requestId: number
): Promise<CashOutRequest | null> {
  const db = await getDb();
  if (!db) return null;

  try {
    const result = await db
      .select()
      .from(cashOutRequests)
      .where(eq(cashOutRequests.id, requestId))
      .limit(1);

    return result[0] || null;
  } catch (error) {
    console.error("[CashOut] Failed to get request:", error);
    return null;
  }
}

/**
 * Get all cash-out requests for a user
 */
export async function getUserCashOutRequests(
  userId: number
): Promise<CashOutRequest[]> {
  const db = await getDb();
  if (!db) return [];

  try {
    return await db
      .select()
      .from(cashOutRequests)
      .where(eq(cashOutRequests.userId, userId));
  } catch (error) {
    console.error("[CashOut] Failed to get user requests:", error);
    return [];
  }
}

/**
 * Update cash-out request status
 */
export async function updateCashOutStatus(
  requestId: number,
  status: "pending" | "processing" | "completed" | "failed" | "cancelled",
  metadata?: {
    squarePayoutId?: string;
    cryptoTransactionId?: string;
    failureReason?: string;
  }
): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  try {
    const updateData: any = {
      status,
      processedAt: new Date(),
    };

    if (status === "completed") {
      updateData.completedAt = new Date();
    }

    if (metadata?.squarePayoutId) {
      updateData.stripePayoutId = metadata.squarePayoutId; // column kept for compat
    }

    if (metadata?.cryptoTransactionId) {
      updateData.cryptoTransactionId = metadata.cryptoTransactionId;
    }

    if (metadata?.failureReason) {
      updateData.failureReason = metadata.failureReason;
    }

    await db
      .update(cashOutRequests)
      .set(updateData)
      .where(eq(cashOutRequests.id, requestId));

    return true;
  } catch (error) {
    console.error("[CashOut] Failed to update status:", error);
    return false;
  }
}

/**
 * Cancel cash-out request and refund coins
 */
export async function cancelCashOutRequest(
  requestId: number
): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  try {
    // Get the request
    const request = await getCashOutRequest(requestId);
    if (!request || request.status !== "pending") {
      return false;
    }

    // Update status
    await updateCashOutStatus(requestId, "cancelled");

    // Refund coins to player
    const playerRecord = await db
      .select()
      .from(playerStats)
      .where(eq(playerStats.userId, request.userId))
      .limit(1);

    if (playerRecord.length) {
      const player = playerRecord[0];
      await db
        .update(playerStats)
        .set({ coins: player.coins + request.coinsRequested })
        .where(eq(playerStats.userId, request.userId));
    }

    return true;
  } catch (error) {
    console.error("[CashOut] Failed to cancel request:", error);
    return false;
  }
}

/**
 * Get cash-out statistics for a user
 */
export async function getUserCashOutStats(userId: number) {
  const db = await getDb();
  if (!db) return null;

  try {
    const requests = await db
      .select()
      .from(cashOutRequests)
      .where(eq(cashOutRequests.userId, userId));

    const completed = requests.filter((r) => r.status === "completed");
    const totalWithdrawn = completed.reduce((sum, r) => sum + r.amountUsd, 0);
    const pending = requests.filter((r) => r.status === "pending").length;

    return {
      totalRequests: requests.length,
      completedRequests: completed.length,
      totalWithdrawn,
      pendingRequests: pending,
      averageWithdrawal:
        completed.length > 0 ? Math.round(totalWithdrawn / completed.length) : 0,
    };
  } catch (error) {
    console.error("[CashOut] Failed to get stats:", error);
    return null;
  }
}
