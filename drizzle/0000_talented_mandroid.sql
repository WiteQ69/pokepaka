CREATE TABLE `app_meta` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `products` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`name` text NOT NULL,
	`price_cents` integer NOT NULL,
	`category_slug` text NOT NULL,
	`language` text NOT NULL,
	`images` text NOT NULL,
	`description` text NOT NULL,
	`stock` integer DEFAULT 0 NOT NULL,
	`sku` text DEFAULT '' NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`is_live` integer DEFAULT 0 NOT NULL,
	`featured` integer DEFAULT 0 NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `products_slug_unique` ON `products` (`slug`);--> statement-breakpoint
CREATE INDEX `products_category_status` ON `products` (`category_slug`,`status`);