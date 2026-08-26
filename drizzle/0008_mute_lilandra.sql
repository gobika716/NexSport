CREATE TABLE `venues` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`area` text NOT NULL,
	`address` text NOT NULL,
	`city` text DEFAULT 'Erode' NOT NULL,
	`lat` real,
	`lng` real,
	`confidence` text DEFAULT 'medium' NOT NULL,
	`source` text,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_venues_city` ON `venues` (`city`);--> statement-breakpoint
CREATE INDEX `idx_venues_active` ON `venues` (`is_active`);--> statement-breakpoint
ALTER TABLE `rooms` ADD `venue_id` text REFERENCES venues(id);--> statement-breakpoint
ALTER TABLE `rooms` ADD `venue_lat` real;--> statement-breakpoint
ALTER TABLE `rooms` ADD `venue_lng` real;