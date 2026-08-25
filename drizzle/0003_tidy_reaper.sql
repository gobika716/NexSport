CREATE TABLE `player_assessments` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`selected_game` text NOT NULL,
	`experience_level` text NOT NULL,
	`years_of_experience` text NOT NULL,
	`playing_frequency` text NOT NULL,
	`tournament_experience` text NOT NULL,
	`preferred_role` text,
	`preferred_event` text,
	`playing_style` text,
	`strengths` text NOT NULL,
	`improvement_areas` text NOT NULL,
	`matches_per_month` text NOT NULL,
	`answers` text NOT NULL,
	`initial_skill_score` integer NOT NULL,
	`initial_skill_confidence` text NOT NULL,
	`verification_type` text NOT NULL,
	`certificate_path` text,
	`video_path` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_assessments_user` ON `player_assessments` (`user_id`);