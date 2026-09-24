ALTER TABLE `mock_tests` ADD `format` enum('full','answer_sheet') DEFAULT 'full' NOT NULL;--> statement-breakpoint
ALTER TABLE `mock_tests` ADD `series` varchar(50);--> statement-breakpoint
ALTER TABLE `mock_tests` ADD `bookNumber` int;--> statement-breakpoint
ALTER TABLE `mock_tests` ADD `testNumber` int;--> statement-breakpoint
CREATE INDEX `mock_tests_series_idx` ON `mock_tests` (`series`,`bookNumber`,`testNumber`);