ALTER TABLE `route` ADD `is_loop` integer DEFAULT true NOT NULL;--> statement-breakpoint
DELETE FROM `sync_ack`;
