CREATE TABLE `coinPackages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`coins` int NOT NULL,
	`priceUsd` int NOT NULL,
	`bonus` int NOT NULL DEFAULT 0,
	`displayName` varchar(255) NOT NULL,
	`isPopular` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `coinPackages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `coinPurchases` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`packageId` int NOT NULL,
	`stripePaymentIntentId` varchar(255) NOT NULL,
	`coinsAdded` int NOT NULL,
	`amountUsd` int NOT NULL,
	`status` enum('pending','completed','failed') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`completedAt` timestamp,
	CONSTRAINT `coinPurchases_id` PRIMARY KEY(`id`),
	CONSTRAINT `coinPurchases_stripePaymentIntentId_unique` UNIQUE(`stripePaymentIntentId`)
);
--> statement-breakpoint
CREATE TABLE `playerStats` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`coins` int NOT NULL DEFAULT 1000,
	`level` int NOT NULL DEFAULT 1,
	`xp` int NOT NULL DEFAULT 0,
	`totalSpins` int NOT NULL DEFAULT 0,
	`totalWins` int NOT NULL DEFAULT 0,
	`jackpotPool` int NOT NULL DEFAULT 5000,
	`lastDailyBonus` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `playerStats_id` PRIMARY KEY(`id`),
	CONSTRAINT `playerStats_userId_unique` UNIQUE(`userId`)
);
