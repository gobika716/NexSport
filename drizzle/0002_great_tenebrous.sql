CREATE INDEX `idx_elo_user` ON `elo_history` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_elo_recorded` ON `elo_history` (`recorded_at`);--> statement-breakpoint
CREATE INDEX `idx_feedback_user` ON `feedback` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_feedback_room` ON `feedback` (`room_id`);--> statement-breakpoint
CREATE INDEX `idx_matches_room` ON `matches` (`room_id`);--> statement-breakpoint
CREATE INDEX `idx_messages_room` ON `messages` (`room_id`);--> statement-breakpoint
CREATE INDEX `idx_messages_created` ON `messages` (`created_at`);--> statement-breakpoint
CREATE INDEX `idx_metrics_room` ON `player_metrics` (`room_id`);--> statement-breakpoint
CREATE INDEX `idx_metrics_user` ON `player_metrics` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_room_members_room` ON `room_members` (`room_id`);--> statement-breakpoint
CREATE INDEX `idx_room_members_user` ON `room_members` (`user_id`);