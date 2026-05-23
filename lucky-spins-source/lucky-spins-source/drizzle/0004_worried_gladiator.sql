CREATE TABLE `achievements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`achievementType` enum('first_spin','first_win','first_big_win','jackpot','streak_7','streak_14','streak_30','streak_100','level_5','level_10','level_25','total_spins_100','total_spins_1000','total_wins_50','total_wins_500') NOT NULL,
	`unlockedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `achievements_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `dailyStreaks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`currentStreak` int NOT NULL DEFAULT 0,
	`longestStreak` int NOT NULL DEFAULT 0,
	`lastLoginDate` timestamp,
	`totalLoginDays` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `dailyStreaks_id` PRIMARY KEY(`id`),
	CONSTRAINT `dailyStreaks_userId_unique` UNIQUE(`userId`)
);
