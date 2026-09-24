CREATE TABLE `batches` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`courseId` int,
	`startDate` varchar(50),
	`maxCapacity` int DEFAULT 30,
	`currentCount` int DEFAULT 0,
	`isOpen` boolean DEFAULT true,
	`isActive` boolean DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `batches_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `enrollments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`studentName` varchar(255) NOT NULL,
	`studentMobile` varchar(20) NOT NULL,
	`studentEmail` varchar(320),
	`courseId` int NOT NULL,
	`batchId` int,
	`paymentMethod` varchar(100) NOT NULL,
	`paymentAccountNumber` varchar(50) NOT NULL,
	`transactionId` varchar(100) NOT NULL,
	`paymentAmount` varchar(50) NOT NULL,
	`paymentScreenshotUrl` text,
	`enrollmentStatus` enum('pending','verified','rejected','refunded') NOT NULL DEFAULT 'pending',
	`studentId` varchar(50),
	`adminNotes` text,
	`rejectionReason` text,
	`verifiedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `enrollments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `payment_settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`methodName` varchar(100) NOT NULL,
	`accountType` varchar(50),
	`accountNumber` varchar(50) NOT NULL,
	`accountHolder` varchar(255),
	`instructions` text,
	`iconUrl` text,
	`sortOrder` int DEFAULT 0,
	`isActive` boolean DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `payment_settings_id` PRIMARY KEY(`id`)
);
