ALTER TABLE `courses` ADD `fullDescription` text;--> statement-breakpoint
ALTER TABLE `courses` ADD `curriculum` json;--> statement-breakpoint
ALTER TABLE `courses` ADD `targetAudience` text;--> statement-breakpoint
ALTER TABLE `courses` ADD `instructorName` varchar(255);--> statement-breakpoint
ALTER TABLE `courses` ADD `instructorBio` text;--> statement-breakpoint
ALTER TABLE `courses` ADD `instructorPhoto` text;--> statement-breakpoint
ALTER TABLE `courses` ADD `courseFaq` json;--> statement-breakpoint
ALTER TABLE `courses` ADD `slug` varchar(255);--> statement-breakpoint
ALTER TABLE `payment_settings` ADD `qrCodeUrl` text;