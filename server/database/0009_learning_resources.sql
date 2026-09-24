CREATE TABLE `learning_resources` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`batchId` int,
	`fileUrl` text NOT NULL,
	`fileName` varchar(255),
	`mimeType` varchar(120),
	`fileSize` int,
	`isActive` boolean NOT NULL DEFAULT true,
	`sortOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `learning_resources_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `learning_resources_batch_idx` ON `learning_resources` (`batchId`);
