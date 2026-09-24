CREATE TABLE `mock_answers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`attemptId` int NOT NULL,
	`questionId` int NOT NULL,
	`response` text,
	`audioUrl` text,
	`isCorrect` boolean,
	`feedback` text,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `mock_answers_id` PRIMARY KEY(`id`),
	CONSTRAINT `mock_answers_attempt_question_uq` UNIQUE(`attemptId`,`questionId`)
);
--> statement-breakpoint
CREATE TABLE `mock_attempts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`testId` int NOT NULL,
	`userId` int NOT NULL,
	`status` enum('in_progress','submitted','graded') NOT NULL DEFAULT 'in_progress',
	`startedAt` timestamp NOT NULL DEFAULT (now()),
	`deadlineAt` timestamp,
	`submittedAt` timestamp,
	`rawScore` int,
	`maxScore` int,
	`band` varchar(8),
	`criteria` json,
	`feedback` text,
	`gradedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `mock_attempts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `mock_questions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`testId` int NOT NULL,
	`sectionId` int NOT NULL,
	`type` enum('mcq','tfng','ynng','short_answer','writing','speaking') NOT NULL,
	`prompt` text NOT NULL,
	`options` json,
	`answers` json,
	`explanation` text,
	`points` int NOT NULL DEFAULT 1,
	`minWords` int,
	`prepSeconds` int,
	`responseSeconds` int,
	`sortOrder` int NOT NULL DEFAULT 0,
	CONSTRAINT `mock_questions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `mock_sections` (
	`id` int AUTO_INCREMENT NOT NULL,
	`testId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`instructions` text,
	`content` text,
	`imageUrl` text,
	`audioUrl` text,
	`sortOrder` int NOT NULL DEFAULT 0,
	CONSTRAINT `mock_sections_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `mock_tests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`module` enum('reading','listening','writing','speaking') NOT NULL,
	`variant` enum('academic','general') NOT NULL DEFAULT 'academic',
	`mode` enum('exam','practice') NOT NULL DEFAULT 'exam',
	`durationMinutes` int,
	`maxAttempts` int,
	`isPublished` boolean NOT NULL DEFAULT false,
	`sortOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `mock_tests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `mock_attempts_user_idx` ON `mock_attempts` (`userId`);--> statement-breakpoint
CREATE INDEX `mock_attempts_test_idx` ON `mock_attempts` (`testId`);--> statement-breakpoint
CREATE INDEX `mock_questions_test_idx` ON `mock_questions` (`testId`);--> statement-breakpoint
CREATE INDEX `mock_sections_test_idx` ON `mock_sections` (`testId`);