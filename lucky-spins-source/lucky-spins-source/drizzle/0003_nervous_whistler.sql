ALTER TABLE `playerStats` MODIFY COLUMN `updatedAt` timestamp NOT NULL ON UPDATE CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `playerStats` ADD `goldCoins` int DEFAULT 10000 NOT NULL;--> statement-breakpoint
ALTER TABLE `playerStats` ADD `greenCoins` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `playerStats` ADD `lastGoldBonusDay` timestamp;