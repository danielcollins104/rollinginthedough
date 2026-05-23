CREATE TABLE `cashOutRequests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`coinsRequested` int NOT NULL,
	`amountUsd` int NOT NULL,
	`paymentMethod` enum('stripe','bitcoin','ethereum','litecoin','usdc') NOT NULL,
	`paymentAddress` varchar(255),
	`status` enum('pending','processing','completed','failed','cancelled') NOT NULL DEFAULT 'pending',
	`stripePayoutId` varchar(255),
	`cryptoTransactionId` varchar(255),
	`failureReason` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`processedAt` timestamp,
	`completedAt` timestamp,
	CONSTRAINT `cashOutRequests_id` PRIMARY KEY(`id`)
);
