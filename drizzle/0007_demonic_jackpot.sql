ALTER TABLE `player_assessments` ADD `certificate_status` text;--> statement-breakpoint
ALTER TABLE `player_assessments` ADD `verified_at` text;--> statement-breakpoint
ALTER TABLE `users` ADD `skill_level` text;--> statement-breakpoint
ALTER TABLE `users` ADD `profile_photo` text;--> statement-breakpoint
ALTER TABLE `users` ADD `certificate_status` text;--> statement-breakpoint
ALTER TABLE `users` ADD `account_status` text DEFAULT 'active' NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `is_admin` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `rooms` DROP COLUMN `creator_lat`;--> statement-breakpoint
ALTER TABLE `rooms` DROP COLUMN `creator_lng`;--> statement-breakpoint
ALTER TABLE `rooms` DROP COLUMN `spot_lat`;--> statement-breakpoint
ALTER TABLE `rooms` DROP COLUMN `spot_lng`;--> statement-breakpoint
ALTER TABLE `rooms` DROP COLUMN `spot_address`;