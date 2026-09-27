ALTER TABLE `mock_attempts` ADD `mode` enum('exam','practice') DEFAULT 'exam' NOT NULL;
--> statement-breakpoint
UPDATE `mock_attempts` a JOIN `mock_tests` t ON t.`id` = a.`testId` SET a.`mode` = t.`mode`;
