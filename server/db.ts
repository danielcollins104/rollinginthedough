import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { InsertUser, users, coinPackages, coinPurchases, playerStats, InsertCoinPurchase, InsertPlayerStats, dailyStreaks, achievements, DailyStreak, InsertDailyStreak, Achievement, InsertAchievement } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId && !user.email) {
    throw new Error("User openId or email is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
      loginMethod: user.loginMethod || "manus",
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onConflictDoUpdate({
      target: users.openId,
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// Coin package queries
export async function getCoinPackages() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(coinPackages).orderBy(coinPackages.coins);
}

// Player stats queries
export async function getOrCreatePlayerStats(userId: number) {
  const db = await getDb();
  if (!db) return null;
  
  const existing = await db.select().from(playerStats).where(eq(playerStats.userId, userId)).limit(1);
  if (existing.length > 0) {
    return existing[0];
  }
  
  // Create new player stats
  const newStats: InsertPlayerStats = {
    userId,
    coins: 1000,
    level: 1,
    xp: 0,
    totalSpins: 0,
    totalWins: 0,
    jackpotPool: 5000,
  };
  
  await db.insert(playerStats).values(newStats);
  return db.select().from(playerStats).where(eq(playerStats.userId, userId)).limit(1).then(r => r[0]);
}

export async function updatePlayerCoins(userId: number, coinsToAdd: number) {
  const db = await getDb();
  if (!db) return null;
  
  const current = await db.select().from(playerStats).where(eq(playerStats.userId, userId)).limit(1);
  if (current.length === 0) return null;
  
  const newCoins = Math.max(0, current[0].coins + coinsToAdd);
  await db.update(playerStats).set({ coins: newCoins }).where(eq(playerStats.userId, userId));
  
  return newCoins;
}

export async function updateGreenCoins(userId: number, coinsToAdd: number) {
  const db = await getDb();
  if (!db) return null;
  
  const current = await db.select().from(playerStats).where(eq(playerStats.userId, userId)).limit(1);
  if (current.length === 0) return null;
  
  const newGreenCoins = Math.max(0, current[0].greenCoins + coinsToAdd);
  await db.update(playerStats).set({ greenCoins: newGreenCoins }).where(eq(playerStats.userId, userId));
  
  return newGreenCoins;
}

// Coin purchase queries
export async function createCoinPurchase(purchase: InsertCoinPurchase) {
  const db = await getDb();
  if (!db) return null;
  
  await db.insert(coinPurchases).values(purchase);
  // Fetch the inserted record to get the ID
  const inserted = await db.select().from(coinPurchases).where(eq(coinPurchases.paymentId, purchase.paymentId)).limit(1);
  return inserted[0] || null;
}

export async function updateCoinPurchaseStatus(paymentId: string, status: 'pending' | 'completed' | 'failed', coinsAdded?: number) {
  const db = await getDb();
  if (!db) return null;
  
  const updates: any = { status };
  if (status === 'completed') {
    updates.completedAt = new Date();
  }
  
  await db.update(coinPurchases).set(updates).where(eq(coinPurchases.paymentId, paymentId));
  
  // If payment completed, add coins to user
  if (status === 'completed' && coinsAdded) {
    const purchase = await db.select().from(coinPurchases).where(eq(coinPurchases.paymentId, paymentId)).limit(1);
    if (purchase.length > 0) {
      await updateGreenCoins(purchase[0].userId, coinsAdded);
    }
  }
  
  return true;
}

export async function getCoinPurchaseByPaymentId(paymentId: string) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.select().from(coinPurchases).where(eq(coinPurchases.paymentId, paymentId)).limit(1);
  return result.length > 0 ? result[0] : null;
}

// Daily Streak queries
export async function getOrCreateDailyStreak(userId: number): Promise<DailyStreak | null> {
  const db = await getDb();
  if (!db) return null;
  
  const existing = await db.select().from(dailyStreaks).where(eq(dailyStreaks.userId, userId)).limit(1);
  if (existing.length > 0) {
    return existing[0];
  }
  
  // Create new streak record
  const newStreak: InsertDailyStreak = {
    userId,
    currentStreak: 0,
    longestStreak: 0,
    lastLoginDate: new Date(),
    totalLoginDays: 0,
  };
  
  await db.insert(dailyStreaks).values(newStreak);
  return db.select().from(dailyStreaks).where(eq(dailyStreaks.userId, userId)).limit(1).then(r => r[0]);
}

export async function updateDailyStreak(userId: number): Promise<DailyStreak | null> {
  const db = await getDb();
  if (!db) return null;
  
  const streak = await getOrCreateDailyStreak(userId);
  if (!streak) return null;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const lastLogin = streak.lastLoginDate ? new Date(streak.lastLoginDate) : null;
  if (lastLogin) {
    lastLogin.setHours(0, 0, 0, 0);
  }
  
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  let newCurrentStreak = streak.currentStreak || 0;
  let newTotalDays = streak.totalLoginDays || 0;
  
  // Check if user logged in today already
  if (lastLogin && lastLogin.getTime() === today.getTime()) {
    // Already logged in today, don't increment
    return streak;
  }
  
  // Check if this is a consecutive day
  if (lastLogin && lastLogin.getTime() === yesterday.getTime()) {
    newCurrentStreak = (streak.currentStreak || 0) + 1;
  } else {
    // Streak broken or first login
    newCurrentStreak = 1;
  }
  
  newTotalDays = (streak.totalLoginDays || 0) + 1;
  const newLongestStreak = Math.max(streak.longestStreak || 0, newCurrentStreak);
  
  await db.update(dailyStreaks).set({
    currentStreak: newCurrentStreak,
    longestStreak: newLongestStreak,
    totalLoginDays: newTotalDays,
    lastLoginDate: today,
  }).where(eq(dailyStreaks.userId, userId));
  
  return db.select().from(dailyStreaks).where(eq(dailyStreaks.userId, userId)).limit(1).then(r => r[0]);
}

// Achievement queries
export async function unlockAchievement(userId: number, achievementType: string): Promise<Achievement | null> {
  const db = await getDb();
  if (!db) return null;
  
  // Check if already unlocked
  const existing = await db.select().from(achievements).where(
    eq(achievements.userId, userId)
  ).limit(1);
  
  if (existing.length > 0) {
    return existing[0];
  }
  
  // Create new achievement
  const newAchievement: InsertAchievement = {
    userId,
    achievementType: achievementType as any,
  };
  
  await db.insert(achievements).values(newAchievement);
  return db.select().from(achievements).where(
    eq(achievements.userId, userId)
  ).limit(1).then(r => r[0]);
}

export async function getPlayerAchievements(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(achievements).where(eq(achievements.userId, userId));
}

// Email/password authentication queries
export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserBySessionToken(sessionToken: string) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(users).where(eq(users.sessionToken, sessionToken)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createUser(userData: {
  email: string;
  passwordHash: string;
  name: string;
  loginMethod: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(users).values({
    email: userData.email,
    passwordHash: userData.passwordHash,
    name: userData.name,
    loginMethod: userData.loginMethod,
    lastSignedIn: new Date(),
  });

  return getUserByEmail(userData.email);
}

export async function updateLoginAttempts(userId: number, attempts: number) {
  const db = await getDb();
  if (!db) return;

  await db.update(users).set({
    failedLoginAttempts: attempts,
    lastFailedLogin: attempts > 0 ? new Date() : null,
  }).where(eq(users.id, userId));
}

export async function updateUserSession(userId: number, sessionToken: string, expiresAt: Date) {
  const db = await getDb();
  if (!db) return;

  await db.update(users).set({
    sessionToken,
    sessionExpiresAt: expiresAt,
    lastSignedIn: new Date(),
  }).where(eq(users.id, userId));
}

export async function clearUserSession(userId: number) {
  const db = await getDb();
  if (!db) return;

  await db.update(users).set({
    sessionToken: null,
    sessionExpiresAt: null,
  }).where(eq(users.id, userId));
}
