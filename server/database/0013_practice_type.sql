ALTER TABLE `mock_tests` ADD `practiceType` varchar(60);
--> statement-breakpoint
CREATE INDEX `mock_tests_practice_type_idx` ON `mock_tests` (`practiceType`);
