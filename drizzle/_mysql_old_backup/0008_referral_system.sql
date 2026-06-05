-- Referral System Tables (PostgreSQL)
-- Supports affiliate/referral program with reward tracking

-- Referral codes (one per user, 8-char uppercase alphanumeric)
CREATE TABLE IF NOT EXISTS "referralCodes" (
  "id" SERIAL PRIMARY KEY,
  "userId" INTEGER NOT NULL UNIQUE,
  "code" VARCHAR(16) NOT NULL UNIQUE,
  "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Referral relationships (created when referee signs up)
CREATE TABLE IF NOT EXISTS "referrals" (
  "id" SERIAL PRIMARY KEY,
  "referrerId" INTEGER NOT NULL,
  "refereeId" INTEGER NOT NULL,
  "codeUsed" VARCHAR(16) NOT NULL,
  "status" VARCHAR(20) DEFAULT 'signed_up' NOT NULL,
  "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Referral rewards earned by referrer
CREATE TABLE IF NOT EXISTS "referralRewards" (
  "id" SERIAL PRIMARY KEY,
  "referrerId" INTEGER NOT NULL,
  "refereeId" INTEGER NOT NULL,
  "referralId" INTEGER NOT NULL,
  "rewardType" VARCHAR(30) NOT NULL,
  "coinsAwarded" INTEGER NOT NULL,
  "status" VARCHAR(20) DEFAULT 'pending' NOT NULL,
  "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL,
  "claimedAt" TIMESTAMP
);

-- Track referee milestones for reward triggering
CREATE TABLE IF NOT EXISTS "referralMilestones" (
  "id" SERIAL PRIMARY KEY,
  "referralId" INTEGER NOT NULL UNIQUE,
  "earned1000Coins" INTEGER DEFAULT 0 NOT NULL,
  "madeFirstPurchase" INTEGER DEFAULT 0 NOT NULL,
  "active30Days" INTEGER DEFAULT 0 NOT NULL,
  "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL
);
