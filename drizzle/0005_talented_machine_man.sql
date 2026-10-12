CREATE TABLE `custom_recipes` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_id` text NOT NULL,
	`title` text NOT NULL,
	`min_age_months` integer NOT NULL,
	`time_minutes` integer NOT NULL,
	`ingredients_json` text NOT NULL,
	`preparation` text NOT NULL,
	`allergens_json` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
