import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }).unique(),
  passwordHash: text("passwordHash"),
  loginMethod: varchar("loginMethod", { length: 64 }).notNull(),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  failedLoginAttempts: int("failedLoginAttempts").default(0).notNull(),
  lastFailedLogin: timestamp("lastFailedLogin"),
  sessionToken: varchar("sessionToken", { length: 255 }),
  sessionExpiresAt: timestamp("sessionExpiresAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// Coin packages available for purchase
export const coinPackages = mysqlTable("coinPackages", {
  id: int("id").autoincrement().primaryKey(),
  coins: int("coins").notNull(),
  priceUsd: int("priceUsd").notNull(), // in cents (e.g., 499 = $4.99)
  bonus: int("bonus").default(0).notNull(), // bonus coins
  displayName: varchar("displayName", { length: 255 }).notNull(),
  isPopular: int("isPopular").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CoinPackage = typeof coinPackages.$inferSelect;
export type InsertCoinPackage = typeof coinPackages.$inferInsert;

// Coin purchase transactions
export const coinPurchases = mysqlTable("coinPurchases", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  packageId: int("packageId").notNull(),
  paymentId: varchar("paymentId", { length: 255 }).notNull().unique(), // Square payment ID
  coinsAdded: int("coinsAdded").notNull(),
  amountUsd: int("amountUsd").notNull(), // in cents
  status: mysqlEnum("status", ["pending", "completed", "failed"]).default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  completedAt: timestamp("completedAt"),
});

export type CoinPurchase = typeof coinPurchases.$inferSelect;
export type InsertCoinPurchase = typeof coinPurchases.$inferInsert;

// Player game state (coins, level, stats)
export const playerStats = mysqlTable("playerStats", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  // Legacy coins column - kept for backward compatibility
  coins: int("coins").default(1000).notNull(),
  // Gold Coins - free play currency (no real cash value)
  goldCoins: int("goldCoins").default(10000).notNull(),
  // Green Coins - premium currency that can be cashed out
  greenCoins: int("greenCoins").default(0).notNull(),
  level: int("level").default(1).notNull(),
  xp: int("xp").default(0).notNull(),
  totalSpins: int("totalSpins").default(0).notNull(),
  totalWins: int("totalWins").default(0).notNull(),
  jackpotPool: int("jackpotPool").default(5000).notNull(),
  lastDailyBonus: timestamp("lastDailyBonus"),
  lastGoldBonusDay: timestamp("lastGoldBonusDay"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PlayerStats = typeof playerStats.$inferSelect;
export type InsertPlayerStats = typeof playerStats.$inferInsert;
// Cash-out requests (player withdrawals)
export const cashOutRequests = mysqlTable("cashOutRequests", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  coinsRequested: int("coinsRequested").notNull(),
  amountUsd: int("amountUsd").notNull(), // in cents
  paymentMethod: mysqlEnum("paymentMethod", ["square", "bitcoin", "ethereum", "litecoin", "usdc"]).notNull(),
  paymentAddress: varchar("paymentAddress", { length: 255 }), // payment address or Square ID
  status: mysqlEnum("status", ["pending", "processing", "completed", "failed", "cancelled"]).default("pending").notNull(),
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
export const dailyStreaks = mysqlTable("dailyStreaks", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  currentStreak: int("currentStreak").default(0).notNull(), // consecutive days
  longestStreak: int("longestStreak").default(0).notNull(), // all-time record
  lastLoginDate: timestamp("lastLoginDate"),
  totalLoginDays: int("totalLoginDays").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type DailyStreak = typeof dailyStreaks.$inferSelect;
export type InsertDailyStreak = typeof dailyStreaks.$inferInsert;

// Player achievements and badges
export const achievements = mysqlTable("achievements", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  achievementType: mysqlEnum("achievementType", [
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
  ]).notNull(),
  unlockedAt: timestamp("unlockedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Achievement = typeof achievements.$inferSelect;
export type InsertAchievement = typeof achievements.$inferInsert;

// ============================================
// REFERRAL SYSTEM
// ============================================

// Referral codes (one per user)
export const referralCodes = mysqlTable("referralCodes", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  code: varchar("code", { length: 16 }).notNull().unique(), // 8-char uppercase alphanumeric
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ReferralCode = typeof referralCodes.$inferSelect;
export type InsertReferralCode = typeof referralCodes.$inferInsert;

// Referral relationships
// Created when referee signs up with a referral code
export const referrals = mysqlTable("referrals", {
  id: int("id").autoincrement().primaryKey(),
  referrerId: int("referrerId").notNull(), // user who shared the code
  refereeId: int("refereeId").notNull(),    // new user who signed up
  codeUsed: varchar("codeUsed", { length: 16 }).notNull(), // the referral code they used
  status: mysqlEnum("status", ["signed_up", "earned_rewards"]).default("signed_up").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Referral = typeof referrals.$inferSelect;
export type InsertReferral = typeof referrals.$inferInsert;

// Referral rewards earned by referrer (pending or claimed)
export const referralRewards = mysqlTable("referralRewards", {
  id: int("id").autoincrement().primaryKey(),
  referrerId: int("referrerId").notNull(),
  refereeId: int("refereeId").notNull(),
  referralId: int("referralId").notNull(),
  rewardType: mysqlEnum("rewardType", [
    "signup_bonus",        // 100 coins when referee signs up
    "first_1000_coins",    // 200 coins when referee earns 1000
    "first_purchase",      // 10% of purchase as coins
    "active_30_days",     // 500 coins when referee active 30 days
  ]).notNull(),
  coinsAwarded: int("coinsAwarded").notNull(),
  status: mysqlEnum("status", ["pending", "claimed"]).default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  claimedAt: timestamp("claimedAt"),
});

export type ReferralReward = typeof referralRewards.$inferSelect;
export type InsertReferralReward = typeof referralRewards.$inferInsert;

// Track referee milestones for reward triggering
export const referralMilestones = mysqlTable("referralMilestones", {
  id: int("id").autoincrement().primaryKey(),
  referralId: int("referralId").notNull().unique(),
  earned1000Coins: int("earned1000Coins").default(0).notNull(), // timestamp when earned 1000 coins
  madeFirstPurchase: int("madeFirstPurchase").default(0).notNull(), // timestamp when made first purchase
  active30Days: int("active30Days").default(0).notNull(), // timestamp when active 30 days
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ReferralMilestone = typeof referralMilestones.$inferSelect;
export type InsertReferralMilestone = typeof referralMilestones.$inferInsert;
