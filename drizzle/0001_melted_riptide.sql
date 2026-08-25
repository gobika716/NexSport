CREATE TABLE `elo_history` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`sport` text NOT NULL,
	`elo` integer NOT NULL,
	`recorded_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `matches` (
	`id` text PRIMARY KEY NOT NULL,
	`room_id` text,
	`sport` text NOT NULL,
	`venue` text NOT NULL,
	`date` text NOT NULL,
	`opponent` text NOT NULL,
	`score` text NOT NULL,
	`result` text NOT NULL,
	`elo_after` integer NOT NULL,
	`elo_change` integer NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`room_id`) REFERENCES `rooms`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `player_metrics` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`room_id` text NOT NULL,
	`heart_rate` integer DEFAULT 0 NOT NULL,
	`steps` integer DEFAULT 0 NOT NULL,
	`calories` real DEFAULT 0 NOT NULL,
	`distance_m` real DEFAULT 0 NOT NULL,
	`speed` real DEFAULT 0 NOT NULL,
	`recorded_at` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`room_id`) REFERENCES `rooms`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
ALTER TABLE `rooms` ADD `lat` real;--> statement-breakpoint
ALTER TABLE `rooms` ADD `lng` real;--> statement-breakpoint
ALTER TABLE `users` ADD `bio` text;--> statement-breakpoint
ALTER TABLE `users` ADD `fair_play` real DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `reliability` real DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `streak` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `matches_played` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `hours_on_court` integer DEFAULT 0 NOT NULL;