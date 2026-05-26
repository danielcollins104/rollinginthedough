-- Referral System Tables
-- Supports affiliate/referral program with reward tracking

-- Referral codes (one per user, 8-char uppercase alphanumeric)
CREATE TABLE IF NOT EXISTS `referralCodes` (
  `id` int NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `userId` int NOT NULL UNIQUE,
  `code` varchar(16) NOT NULL UNIQUE,
  `createdAt` timestamp DEFAULT NOW() NOT NULL
);

-- Referral relationships (created when referee signs up)
CREATE TABLE IF NOT EXISTS `referrals` (
  `id` int NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `referrerId` int NOT NULL,
  `refereeId` int NOT NULL,
  `codeUsed` varchar(16) NOT NULL,
  `status` enum('signed_up', 'earned_rewards') DEFAULT 'signed_up' NOT NULL,
  `createdAt` timestamp DEFAULT NOW() NOT NULL
);

-- Referral rewards earned by referrer
CREATE TABLE IF NOT EXISTS `referralRewards` (
  `id` int NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `referrerId` int NOT NULL,
  `refereeId` int NOT NULL,
  `referralId` int NOT NULL,
  `rewardType` enum('signup_bonus', 'first_1000_coins', 'first_purchase', 'active_30_days') NOT NULL,
  `coinsAwarded` int NOT NULL,
  `status` enum('pending', 'claimed') DEFAULT 'pending' NOT NULL,
  `createdAt` timestamp DEFAULT NOW() NOT NULL,
  `claimedAt` timestamp
);

-- Track referee milestones for reward triggering
CREATE TABLE IF NOT EXISTS `referralMilestones` (
  `id` int NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `referralId` int NOT NULL UNIQUE,
  `earned1000Coins` int DEFAULT 0 NOT NULL,
  `madeFirstPurchase` int DEFAULT 0 NOT NULL,
  `active30Days` int DEFAULT 0 NOT NULL,
  `createdAt` timestamp DEFAULT NOW() NOT NULL
);