CREATE TABLE `mock_test_sets` (
  `id` int AUTO_INCREMENT NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text,
  `variant` enum('academic','general') NOT NULL DEFAULT 'academic',
  `series` varchar(50),
  `bookNumber` int,
  `testNumber` int,
  `sortOrder` int NOT NULL DEFAULT 0,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `mock_test_sets_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `mock_tests` ADD `setId` int;
--> statement-breakpoint
CREATE INDEX `mock_tests_set_idx` ON `mock_tests` (`setId`);
