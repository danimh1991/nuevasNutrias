CREATE TABLE `feeding_equivalences` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_id` text NOT NULL,
	`title` text NOT NULL,
	`milk_ml` real NOT NULL,
	`product_amount` real NOT NULL,
	`product_unit` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
