CREATE TABLE `leave_plans` (
	`child_id` text PRIMARY KEY NOT NULL,
	`owner_id` text NOT NULL,
	`periods_json` text NOT NULL,
	`holidays_json` text NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`child_id`) REFERENCES `children`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
ALTER TABLE `children` ADD `last_period_date` text;--> statement-breakpoint
ALTER TABLE `children` ADD `expected_birth_date` text;--> statement-breakpoint
ALTER TABLE `children` ADD `actual_birth_date` text;
