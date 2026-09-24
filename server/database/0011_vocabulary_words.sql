CREATE TABLE `vocabulary_words` (
	`id` int AUTO_INCREMENT NOT NULL,
	`word` varchar(120) NOT NULL,
	`partOfSpeech` varchar(50) NOT NULL,
	`meaning` text NOT NULL,
	`example` text NOT NULL,
	`topic` varchar(100) NOT NULL,
	`isActive` boolean NOT NULL DEFAULT true,
	`sortOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `vocabulary_words_id` PRIMARY KEY(`id`),
	CONSTRAINT `vocabulary_words_word_unique` UNIQUE(`word`)
);
