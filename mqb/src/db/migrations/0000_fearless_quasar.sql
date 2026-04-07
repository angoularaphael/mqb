CREATE TABLE `absences` (
	`id` text PRIMARY KEY DEFAULT (uuid()) NOT NULL,
	`student_id` text NOT NULL,
	`course_id` text NOT NULL,
	`count` integer DEFAULT 0,
	`justified` integer DEFAULT 0,
	`reason` text,
	`created_at` integer DEFAULT (unixepoch()),
	FOREIGN KEY (`student_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`course_id`) REFERENCES `courses`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `activity_logs` (
	`id` text PRIMARY KEY DEFAULT (uuid()) NOT NULL,
	`user_id` text NOT NULL,
	`action` text NOT NULL,
	`description` text,
	`created_at` integer DEFAULT (unixepoch()),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `attendance` (
	`id` text PRIMARY KEY DEFAULT (uuid()) NOT NULL,
	`student_id` text NOT NULL,
	`schedule_id` text NOT NULL,
	`status` text DEFAULT 'present' NOT NULL,
	`marked_at` integer DEFAULT (unixepoch()),
	`marked_by` text,
	FOREIGN KEY (`student_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`schedule_id`) REFERENCES `schedules`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`marked_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `broadcast_recipients` (
	`id` text PRIMARY KEY DEFAULT (uuid()) NOT NULL,
	`message_id` text NOT NULL,
	`recipient_id` text NOT NULL,
	`is_read` integer DEFAULT 0,
	`email_sent` integer DEFAULT 0,
	FOREIGN KEY (`message_id`) REFERENCES `messages`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`recipient_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `constraints` (
	`id` text PRIMARY KEY DEFAULT (uuid()) NOT NULL,
	`teacher_id` text NOT NULL,
	`day_of_week` integer NOT NULL,
	`start_time` text NOT NULL,
	`end_time` text NOT NULL,
	`is_available` integer DEFAULT 1,
	`created_at` integer DEFAULT (unixepoch()),
	FOREIGN KEY (`teacher_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `courses` (
	`id` text PRIMARY KEY DEFAULT (uuid()) NOT NULL,
	`code` text NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`teacher_id` text NOT NULL,
	`group_id` text NOT NULL,
	`hours_total` real DEFAULT 30,
	`created_at` integer DEFAULT (unixepoch()),
	FOREIGN KEY (`teacher_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`group_id`) REFERENCES `groups`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `documents` (
	`id` text PRIMARY KEY DEFAULT (uuid()) NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`file_path` text NOT NULL,
	`file_type` text,
	`uploaded_by` text NOT NULL,
	`course_id` text,
	`visibility` text DEFAULT 'private',
	`created_at` integer DEFAULT (unixepoch()),
	FOREIGN KEY (`uploaded_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`course_id`) REFERENCES `courses`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `emargement_sessions` (
	`id` text PRIMARY KEY DEFAULT (uuid()) NOT NULL,
	`schedule_id` text NOT NULL,
	`teacher_id` text NOT NULL,
	`status` text DEFAULT 'open' NOT NULL,
	`created_at` integer DEFAULT (unixepoch()),
	`closed_at` integer,
	FOREIGN KEY (`schedule_id`) REFERENCES `schedules`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`teacher_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `emargement_signatures` (
	`id` text PRIMARY KEY DEFAULT (uuid()) NOT NULL,
	`session_id` text NOT NULL,
	`student_id` text NOT NULL,
	`signed_at` integer DEFAULT (unixepoch()),
	FOREIGN KEY (`session_id`) REFERENCES `emargement_sessions`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`student_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `grades` (
	`id` text PRIMARY KEY DEFAULT (uuid()) NOT NULL,
	`student_id` text NOT NULL,
	`course_id` text NOT NULL,
	`score` real NOT NULL,
	`feedback` text,
	`created_at` integer DEFAULT (unixepoch()),
	`updated_at` integer DEFAULT (unixepoch()),
	FOREIGN KEY (`student_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`course_id`) REFERENCES `courses`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `group_members` (
	`id` text PRIMARY KEY DEFAULT (uuid()) NOT NULL,
	`group_id` text NOT NULL,
	`user_id` text NOT NULL,
	`joined_at` integer DEFAULT (unixepoch()),
	FOREIGN KEY (`group_id`) REFERENCES `groups`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `groups` (
	`id` text PRIMARY KEY DEFAULT (uuid()) NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`capacity` integer DEFAULT 30,
	`created_at` integer DEFAULT (unixepoch())
);
--> statement-breakpoint
CREATE TABLE `messages` (
	`id` text PRIMARY KEY DEFAULT (uuid()) NOT NULL,
	`sender_id` text NOT NULL,
	`recipient_id` text,
	`group_id` text,
	`title` text,
	`content` text NOT NULL,
	`type` text DEFAULT 'direct',
	`is_read` integer DEFAULT 0,
	`created_at` integer DEFAULT (unixepoch()),
	FOREIGN KEY (`sender_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`recipient_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`group_id`) REFERENCES `groups`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `password_reset_tokens` (
	`id` text PRIMARY KEY DEFAULT (uuid()) NOT NULL,
	`user_id` text NOT NULL,
	`code` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch()),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `requests` (
	`id` text PRIMARY KEY DEFAULT (uuid()) NOT NULL,
	`student_id` text NOT NULL,
	`type` text NOT NULL,
	`subject` text NOT NULL,
	`description` text NOT NULL,
	`status` text DEFAULT 'pending',
	`response` text,
	`responded_by` text,
	`created_at` integer DEFAULT (unixepoch()),
	`updated_at` integer DEFAULT (unixepoch()),
	FOREIGN KEY (`student_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`responded_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `rooms` (
	`id` text PRIMARY KEY DEFAULT (uuid()) NOT NULL,
	`name` text NOT NULL,
	`capacity` integer DEFAULT 30,
	`type` text DEFAULT 'classroom',
	`created_at` integer DEFAULT (unixepoch())
);
--> statement-breakpoint
CREATE TABLE `schedules` (
	`id` text PRIMARY KEY DEFAULT (uuid()) NOT NULL,
	`course_id` text NOT NULL,
	`room_id` text NOT NULL,
	`day_of_week` integer NOT NULL,
	`start_time` text NOT NULL,
	`end_time` text NOT NULL,
	`start_date` text NOT NULL,
	`end_date` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()),
	FOREIGN KEY (`course_id`) REFERENCES `courses`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`room_id`) REFERENCES `rooms`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `settings` (
	`id` text PRIMARY KEY DEFAULT (uuid()) NOT NULL,
	`key` text NOT NULL,
	`value` text,
	`updated_at` integer DEFAULT (unixepoch())
);
--> statement-breakpoint
CREATE TABLE `user_sessions` (
	`id` text PRIMARY KEY DEFAULT (uuid()) NOT NULL,
	`user_id` text NOT NULL,
	`token` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch()),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `user_settings` (
	`id` text PRIMARY KEY DEFAULT (uuid()) NOT NULL,
	`user_id` text NOT NULL,
	`theme` text DEFAULT 'dark',
	`font_size` integer DEFAULT 16,
	`language` text DEFAULT 'fr',
	`email_notifications` integer DEFAULT 1,
	`updated_at` integer DEFAULT (unixepoch()),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY DEFAULT (uuid()) NOT NULL,
	`email` text NOT NULL,
	`password_hash` text NOT NULL,
	`first_name` text NOT NULL,
	`last_name` text NOT NULL,
	`role` text DEFAULT 'student' NOT NULL,
	`avatar_url` text,
	`is_active` integer DEFAULT 1,
	`created_at` integer DEFAULT (unixepoch()),
	`updated_at` integer DEFAULT (unixepoch())
);
--> statement-breakpoint
CREATE TABLE `wifi_codes` (
	`id` text PRIMARY KEY DEFAULT (uuid()) NOT NULL,
	`code` text NOT NULL,
	`network_name` text DEFAULT 'MQB-Guest',
	`created_at` integer DEFAULT (unixepoch()),
	`expires_at` integer NOT NULL,
	`is_active` integer DEFAULT 1
);
--> statement-breakpoint
CREATE UNIQUE INDEX `courses_code_unique` ON `courses` (`code`);--> statement-breakpoint
CREATE UNIQUE INDEX `emargement_signatures_session_id_student_id_unique` ON `emargement_signatures` (`session_id`,`student_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `group_members_group_id_user_id_unique` ON `group_members` (`group_id`,`user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `settings_key_unique` ON `settings` (`key`);--> statement-breakpoint
CREATE UNIQUE INDEX `user_sessions_token_unique` ON `user_sessions` (`token`);--> statement-breakpoint
CREATE UNIQUE INDEX `user_settings_user_id_unique` ON `user_settings` (`user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
CREATE UNIQUE INDEX `wifi_codes_code_unique` ON `wifi_codes` (`code`);