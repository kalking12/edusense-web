CREATE TABLE `sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionId` varchar(255) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `sessions_id` PRIMARY KEY(`id`),
	CONSTRAINT `sessions_sessionId_unique` UNIQUE(`sessionId`)
);
--> statement-breakpoint
ALTER TABLE `ocr_documents` DROP COLUMN `userId`;--> statement-breakpoint
ALTER TABLE `ocr_documents` DROP COLUMN `summary`;--> statement-breakpoint
ALTER TABLE `ocr_documents` DROP COLUMN `confidence`;