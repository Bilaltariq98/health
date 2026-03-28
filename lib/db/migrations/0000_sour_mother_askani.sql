CREATE TABLE `events` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`properties` text,
	`occurred_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `meals` (
	`id` text PRIMARY KEY NOT NULL,
	`date` text NOT NULL,
	`name` text NOT NULL,
	`meal_type` text,
	`calories` integer,
	`protein_g` real,
	`carbs_g` real,
	`fat_g` real,
	`recipe_url` text,
	`is_favourite` integer DEFAULT false,
	`logged_at` text NOT NULL,
	`notes` text
);
--> statement-breakpoint
CREATE TABLE `measurements` (
	`id` text PRIMARY KEY NOT NULL,
	`date` text NOT NULL,
	`weight_kg` real,
	`notes` text,
	`measured_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`date` text NOT NULL,
	`day_type` text NOT NULL,
	`intent` text NOT NULL,
	`programme_version` text NOT NULL,
	`started_at` text NOT NULL,
	`completed_at` text,
	`duration_seconds` integer,
	`notes` text
);
--> statement-breakpoint
CREATE TABLE `sets` (
	`id` text PRIMARY KEY NOT NULL,
	`session_id` text NOT NULL,
	`exercise_id` text NOT NULL,
	`exercise_name` text NOT NULL,
	`movement_pattern` text NOT NULL,
	`muscle_group_primary` text NOT NULL,
	`set_number` integer NOT NULL,
	`reps` integer,
	`weight_kg` real,
	`distance_metres` real,
	`duration_seconds` integer,
	`side` text,
	`rpe` integer,
	`completed_at` text NOT NULL,
	`notes` text,
	FOREIGN KEY (`session_id`) REFERENCES `sessions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `water` (
	`id` text PRIMARY KEY NOT NULL,
	`date` text NOT NULL,
	`glasses` integer DEFAULT 0 NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `water_date_unique` ON `water` (`date`);