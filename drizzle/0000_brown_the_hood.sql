CREATE TABLE `feedback` (
	`id` text PRIMARY KEY NOT NULL,
	`room_id` text NOT NULL,
	`user_id` text,
	`sport` text NOT NULL,
	`venue` text NOT NULL,
	`date` text NOT NULL,
	`skill` text NOT NULL,
	`fairness` integer NOT NULL,
	`teammates` integer NOT NULL,
	`performance` integer NOT NULL,
	`result` text NOT NULL,
	`comment` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`room_id`) REFERENCES `rooms`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `messages` (
	`id` text PRIMARY KEY NOT NULL,
	`room_id` text NOT NULL,
	`author` text NOT NULL,
	`initials` text NOT NULL,
	`text` text NOT NULL,
	`time` text NOT NULL,
	`user_id` text,
	`is_me` integer DEFAULT false NOT NULL,
	`system` integer DEFAULT false NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`room_id`) REFERENCES `rooms`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `room_members` (
	`id` text PRIMARY KEY NOT NULL,
	`room_id` text NOT NULL,
	`user_id` text,
	`name` text NOT NULL,
	`skill` text NOT NULL,
	`joined_at` text NOT NULL,
	FOREIGN KEY (`room_id`) REFERENCES `rooms`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `rooms` (
	`id` text PRIMARY KEY NOT NULL,
	`sport` text NOT NULL,
	`venue` text NOT NULL,
	`city` text NOT NULL,
	`distance_km` real DEFAULT 0 NOT NULL,
	`time` text NOT NULL,
	`slots` integer NOT NULL,
	`filled` integer DEFAULT 1 NOT NULL,
	`avg_elo` integer DEFAULT 1200 NOT NULL,
	`skill` text NOT NULL,
	`host` text NOT NULL,
	`host_user_id` text,
	`status` text DEFAULT 'open' NOT NULL,
	`description` text,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`password_hash` text NOT NULL,
	`city` text,
	`elo` integer DEFAULT 1200 NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);