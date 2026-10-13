CREATE TABLE `custom_allergens` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_id` text NOT NULL,
	`name` text NOT NULL,
	`hint` text NOT NULL,
	`emoji` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `hidden_allergens` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_id` text NOT NULL,
	`allergen_id` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `hidden_allergens_owner_allergen` ON `hidden_allergens` (`owner_id`,`allergen_id`);