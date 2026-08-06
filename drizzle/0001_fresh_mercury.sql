CREATE TABLE `ocr_documents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`imageUrl` text NOT NULL,
	`imageKey` varchar(255) NOT NULL,
	`rawOcrText` longtext NOT NULL,
	`processedText` longtext,
	`summary` longtext,
	`confidence` int,
	`fileName` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `ocr_documents_id` PRIMARY KEY(`id`)
);
