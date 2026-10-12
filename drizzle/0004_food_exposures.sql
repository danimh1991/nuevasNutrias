CREATE TABLE `food_exposures` (
	`id` text PRIMARY KEY NOT NULL,
	`child_id` text NOT NULL,
	`owner_id` text NOT NULL,
	`allergen_id` text NOT NULL,
	`day_index` integer NOT NULL,
	`exposed_at` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`child_id`) REFERENCES `children`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `food_exposures_child_allergen_day` ON `food_exposures` (`child_id`,`allergen_id`,`day_index`);
