CREATE TYPE "public"."achievement_type" AS ENUM('first_spin', 'first_win', 'first_big_win', 'jackpot', 'streak_7', 'streak_14', 'streak_30', 'streak_100', 'level_5', 'level_10', 'level_25', 'total_spins_100', 'total_spins_1000', 'total_wins_50', 'total_wins_500');--> statement-breakpoint
CREATE TYPE "public"."cashout_status" AS ENUM('pending', 'processing', 'completed', 'failed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."payment_method" AS ENUM('square', 'bitcoin', 'ethereum', 'litecoin', 'usdc');--> statement-breakpoint
CREATE TYPE "public"."purchase_status" AS ENUM('pending', 'completed', 'failed');--> statement-breakpoint
CREATE TYPE "public"."referral_status" AS ENUM('signed_up', 'earned_rewards');--> statement-breakpoint
CREATE TYPE "public"."reward_status" AS ENUM('pending', 'claimed');--> statement-breakpoint
CREATE TYPE "public"."reward_type" AS ENUM('signup_bonus', 'first_1000_coins', 'first_purchase', 'active_30_days');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('user', 'admin');--> statement-breakpoint
CREATE TABLE "achievements" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"achievementType" "achievement_type" NOT NULL,
	"unlockedAt" timestamp DEFAULT now() NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cashOutRequests" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"coinsRequested" integer NOT NULL,
	"amountUsd" integer NOT NULL,
	"paymentMethod" "payment_method" NOT NULL,
	"paymentAddress" varchar(255),
	"status" "cashout_status" DEFAULT 'pending' NOT NULL,
	"stripePayoutId" varchar(255),
	"cryptoTransactionId" varchar(255),
	"failureReason" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"processedAt" timestamp,
	"completedAt" timestamp
);
--> statement-breakpoint
CREATE TABLE "coinPackages" (
	"id" serial PRIMARY KEY NOT NULL,
	"coins" integer NOT NULL,
	"priceUsd" integer NOT NULL,
	"bonus" integer DEFAULT 0 NOT NULL,
	"displayName" varchar(255) NOT NULL,
	"isPopular" integer DEFAULT 0 NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "coinPurchases" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"packageId" integer NOT NULL,
	"paymentId" varchar(255) NOT NULL,
	"coinsAdded" integer NOT NULL,
	"amountUsd" integer NOT NULL,
	"status" "purchase_status" DEFAULT 'pending' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"completedAt" timestamp,
	CONSTRAINT "coinPurchases_paymentId_unique" UNIQUE("paymentId")
);
--> statement-breakpoint
CREATE TABLE "dailyStreaks" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"currentStreak" integer DEFAULT 0 NOT NULL,
	"longestStreak" integer DEFAULT 0 NOT NULL,
	"lastLoginDate" timestamp,
	"totalLoginDays" integer DEFAULT 0 NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "dailyStreaks_userId_unique" UNIQUE("userId")
);
--> statement-breakpoint
CREATE TABLE "playerStats" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"coins" integer DEFAULT 1000 NOT NULL,
	"goldCoins" integer DEFAULT 10000 NOT NULL,
	"greenCoins" integer DEFAULT 0 NOT NULL,
	"level" integer DEFAULT 1 NOT NULL,
	"xp" integer DEFAULT 0 NOT NULL,
	"totalSpins" integer DEFAULT 0 NOT NULL,
	"totalWins" integer DEFAULT 0 NOT NULL,
	"jackpotPool" integer DEFAULT 5000 NOT NULL,
	"lastDailyBonus" timestamp,
	"lastGoldBonusDay" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "playerStats_userId_unique" UNIQUE("userId")
);
--> statement-breakpoint
CREATE TABLE "referralCodes" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"code" varchar(16) NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "referralCodes_userId_unique" UNIQUE("userId"),
	CONSTRAINT "referralCodes_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "referralMilestones" (
	"id" serial PRIMARY KEY NOT NULL,
	"referralId" integer NOT NULL,
	"earned1000Coins" integer DEFAULT 0 NOT NULL,
	"madeFirstPurchase" integer DEFAULT 0 NOT NULL,
	"active30Days" integer DEFAULT 0 NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "referralMilestones_referralId_unique" UNIQUE("referralId")
);
--> statement-breakpoint
CREATE TABLE "referralRewards" (
	"id" serial PRIMARY KEY NOT NULL,
	"referrerId" integer NOT NULL,
	"refereeId" integer NOT NULL,
	"referralId" integer NOT NULL,
	"rewardType" "reward_type" NOT NULL,
	"coinsAwarded" integer NOT NULL,
	"status" "reward_status" DEFAULT 'pending' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"claimedAt" timestamp
);
--> statement-breakpoint
CREATE TABLE "referrals" (
	"id" serial PRIMARY KEY NOT NULL,
	"referrerId" integer NOT NULL,
	"refereeId" integer NOT NULL,
	"codeUsed" varchar(16) NOT NULL,
	"status" "referral_status" DEFAULT 'signed_up' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"openId" varchar(64),
	"name" text,
	"email" varchar(320),
	"passwordHash" text,
	"loginMethod" varchar(64) NOT NULL,
	"role" "role" DEFAULT 'user' NOT NULL,
	"failedLoginAttempts" integer DEFAULT 0 NOT NULL,
	"lastFailedLogin" timestamp,
	"sessionToken" varchar(255),
	"sessionExpiresAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"lastSignedIn" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_openId_unique" UNIQUE("openId"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
