CREATE TABLE `alert` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`description` text NOT NULL,
	`time_range_text` text NOT NULL,
	`daily_start_time` text NOT NULL,
	`daily_end_time` text NOT NULL,
	`starts_at` text NOT NULL,
	`ends_at` text
);
--> statement-breakpoint
CREATE TABLE `alert_direction` (
	`id` text PRIMARY KEY NOT NULL,
	`alert_id` text NOT NULL,
	`direction_id` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `alert_direction_direction_id_idx` ON `alert_direction` (`direction_id`);--> statement-breakpoint
CREATE TABLE `direction` (
	`id` text PRIMARY KEY NOT NULL,
	`route_id` text NOT NULL,
	`destination` text NOT NULL,
	`sequence` integer NOT NULL,
	`path` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `direction_route_id_idx` ON `direction` (`route_id`);--> statement-breakpoint
CREATE TABLE `direction_stop` (
	`id` text PRIMARY KEY NOT NULL,
	`direction_id` text NOT NULL,
	`stop_id` text NOT NULL,
	`sequence` integer NOT NULL,
	`is_timepoint` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `direction_stop_direction_id_idx` ON `direction_stop` (`direction_id`,`sequence`);--> statement-breakpoint
CREATE TABLE `route` (
	`id` text PRIMARY KEY NOT NULL,
	`short_name` text NOT NULL,
	`long_name` text NOT NULL,
	`light_color` text NOT NULL,
	`dark_color` text NOT NULL,
	`active` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `stop` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`lat` real NOT NULL,
	`lon` real NOT NULL,
	`amenities` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `sync_ack` (
	`key` text PRIMARY KEY NOT NULL,
	`ack` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `timetable` (
	`id` text PRIMARY KEY NOT NULL,
	`stop_id` text NOT NULL,
	`direction_id` text NOT NULL,
	`service_date` text NOT NULL,
	`departures` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `timetable_slot_idx` ON `timetable` (`stop_id`,`direction_id`,`service_date`);