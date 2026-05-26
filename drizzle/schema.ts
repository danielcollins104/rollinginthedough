import { pgEnum, pgTable, serial, text, timestamp, varchar, integer } from "drizzle-orm/pg-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */

export const roleEnum = pgEnum("role", ["user", "admin"]);
export const purchaseStatusEnum = pgEnum("purchase_status", ["pending", "completed", "failed"]);
export const paymentMethodEnum = pgEnum("payment_method", ["square", "bitcoin", "ethereum", "litecoin", "usdc"]);
export const cashoutStatusEnum = pgEnum("cashout_status", ["pending", "processing", "completed", "failed", "cancelled"]);
export const achievementTypeEnum = pgEnum("achievement_type", [
  "first_spin",
  "first_win",
  "first_big_win",
  "jackpot",
  "streak_7",
  "streak_14",
  "streak_30",
  "streak_100",
  "level_5",
  "level_10",
  "level_25",
  "total_spins_100",
  "total_spins_1000",
  "total_wins_50",
  "total_wins_500",
]);
export const referralStatusEnum = pgEnum("referral_status", ["signed_up", "earned_rewards"]);
export const rewardTypeEnum = pgEnum("reward_type", [
  "signup_bonus",
  "first_1000_coins",
  "first_purchase",
  "active_30_days",
]);
export const rewardStatusEnum = pgEnum("reward_status", ["pending", "claimed"]);

export const users = pgTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: serial("id").primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }).unique(),
  passwordHash: text("passwordHash"),
  loginMethod: varchar("loginMethod", { length: 64 }).notNull(),
  role: roleEnum("role").default("user").notNull(),
  failedLoginAttempts: integer("failedLoginAttempts").default(0).notNull(),
  lastFailedLogin: timestamp("lastFailedLogin"),
  sessionToken: varchar("sessionToken", { length: 255 }),
  sessionExpiresAt: timestamp("sessionExpiresAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// Coin packages available for purchase
export const coinPackages = pgTable("coinPackages", {
  id: serial("id").primaryKey(),
  coins: integer("coins").notNull(),
  priceUsd: integer("priceUsd").notNull(), // in cents (e.g., 499 = $4.99)
  bonus: integer("bonus").default(0).notNull(), // bonus coins
  displayName: varchar("displayName", { length: 255 }).notNull(),
  isPopular: integer("isPopular").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CoinPackage = typeof coinPackages.$inferSelect;
export type InsertCoinPackage = typeof coinPackages.$inferInsert;

// Coin purchase transactions
export const coinPurchases = pgTable("coinPurchases", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  packageId: integer("packageId").notNull(),
  paymentId: varchar("paymentId", { length: 255 }).notNull().unique(), // Square payment ID
  coinsAdded: integer("coinsAdded").notNull(),
  amountUsd: integer("amountUsd").notNull(), // in cents
  status: purchaseStatusEnum("status").default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  completedAt: timestamp("completedAt"),
});

export type CoinPurchase = typeof coinPurchases.$inferSelect;
export type InsertCoinPurchase = typeof coinPurchases.$inferInsert;

// Player game state (coins, level, stats)
export const playerStats = pgTable("playerStats", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull().unique(),
  // Legacy coins column - kept for backward compatibility
  coins: integer("coins").default(1000).notNull(),
  // Gold Coins - free play currency (no real cash value)
  goldCoins: integer("goldCoins").default(10000).notNull(),
  // Green Coins - premium currency that can be cashed out
  greenCoins: integer("greenCoins").default(0).notNull(),
  level: integer("level").default(1).notNull(),
  xp: integer("xp").default(0).notNull(),
  totalSpins: integer("totalSpins").default(0).notNull(),
  totalWins: integer("totalWins").default(0).notNull(),
  jackpotPool: integer("jackpotPool").default(5000).notNull(),
  lastDailyBonus: timestamp("lastDailyBonus"),
  lastGoldBonusDay: timestamp("lastGoldBonusDay"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type PlayerStats = typeof playerStats.$inferSelect;
export type InsertPlayerStats = typeof playerStats.$inferInsert;
// Cash-out requests (player withdrawals)
export const cashOutRequests = pgTable("cashOutRequests", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  coinsRequested: integer("coinsRequested").notNull(),
  amountUsd: integer("amountUsd").notNull(), // in cents
  paymentMethod: paymentMethodEnum("paymentMethod").notNull(),
  paymentAddress: varchar("paymentAddress", { length: 255 }), // payment address or Square ID
  status: cashoutStatusEnum("status").default("pending").notNull(),
  stripePayoutId: varchar("stripePayoutId", { length: 255 }), // legacy name, now stores Square payout ID
  cryptoTransactionId: varchar("cryptoTransactionId", { length: 255 }),
  failureReason: text("failureReason"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  processedAt: timestamp("processedAt"),
  completedAt: timestamp("completedAt"),
});

export type CashOutRequest = typeof cashOutRequests.$inferSelect;
export type InsertCashOutRequest = typeof cashOutRequests.$inferInsert;

// Daily login streaks and loyalty tracking
export const dailyStreaks = pgTable("dailyStreaks", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull().unique(),
  currentStreak: integer("currentStreak").default(0).notNull(), // consecutive days
  longestStreak: integer("longestStreak").default(0).notNull(), // all-time record
  lastLoginDate: timestamp("lastLoginDate"),
  totalLoginDays: integer("totalLoginDays").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type DailyStreak = typeof dailyStreaks.$inferSelect;
export type InsertDailyStreak = typeof dailyStreaks.$inferInsert;

// Player achievements and badges
export const achievements = pgTable("achievements", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  achievementType: achievementTypeEnum("achievementType").notNull(),
  unlockedAt: timestamp("unlockedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Achievement = typeof achievements.$inferSelect;
export type InsertAchievement = typeof achievements.$inferInsert;

// ============================================
// REFERRAL SYSTEM
// ============================================

// Referral codes (one per user)
export const referralCodes = pgTable("referralCodes", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull().unique(),
  code: varchar("code", { length: 16 }).notNull().unique(), // 8-char uppercase alphanumeric
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ReferralCode = typeof referralCodes.$inferSelect;
export type InsertReferralCode = typeof referralCodes.$inferInsert;

// Referral relationships
// Created when referee signs up with a referral code
export const referrals = pgTable("referrals", {
  id: serial("id").primaryKey(),
  referrerId: integer("referrerId").notNull(), // user who shared the code
  refereeId: integer("refereeId").notNull(),    // new user who signed up
  codeUsed: varchar("codeUsed", { length: 16 }).notNull(), // the referral code they used
  status: referralStatusEnum("status").default("signed_up").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Referral = typeof referrals.$inferSelect;
export type InsertReferral = typeof referrals.$inferInsert;

// Referral rewards earned by referrer (pending or claimed)
export const referralRewards = pgTable("referralRewards", {
  id: serial("id").primaryKey(),
  referrerId: integer("referrerId").notNull(),
  refereeId: integer("refereeId").notNull(),
  referralId: integer("referralId").notNull(),
  rewardType: rewardTypeEnum("rewardType").notNull(),
  coinsAwarded: integer("coinsAwarded").notNull(),
  status: rewardStatusEnum("status").default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  claimedAt: timestamp("claimedAt"),
});

export type ReferralReward = typeof referralRewards.$inferSelect;
export type InsertReferralReward = typeof referralRewards.$inferInsert;

// Track referee milestones for reward triggering
export const referralMilestones = pgTable("referralMilestones", {
  id: serial("id").primaryKey(),
  referralId: integer("referralId").notNull().unique(),
  earned1000Coins: integer("earned1000Coins").default(0).notNull(), // timestamp when earned 1000 coins
  madeFirstPurchase: integer("madeFirstPurchase").default(0).notNull(), // timestamp when made first purchase
  active30Days: integer("active30Days").default(0).notNull(), // timestamp when active 30 days
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ReferralMilestone = typeof referralMilestones.$inferSelect;
export type InsertReferralMilestone = typeof referralMilestones.$inferInsert;
