ALTER TABLE `coinPurchases` RENAME COLUMN `stripePaymentIntentId` TO `paymentId`;--> statement-breakpoint
ALTER TABLE `coinPurchases` DROP INDEX `coinPurchases_stripePaymentIntentId_unique`;--> statement-breakpoint
ALTER TABLE `cashOutRequests` MODIFY COLUMN `paymentMethod` enum('square','bitcoin','ethereum','litecoin','usdc') NOT NULL;--> statement-breakpoint
ALTER TABLE `coinPurchases` ADD CONSTRAINT `coinPurchases_paymentId_unique` UNIQUE(`paymentId`);