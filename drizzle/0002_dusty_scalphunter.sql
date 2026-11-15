CREATE TABLE `sourcing_requests` (
	`id` text PRIMARY KEY NOT NULL,
	`code` text NOT NULL,
	`customer_name` text NOT NULL,
	`customer_email` text NOT NULL,
	`customer_phone` text NOT NULL,
	`city` text NOT NULL,
	`size` text DEFAULT '' NOT NULL,
	`description` text NOT NULL,
	`budget_cents` integer,
	`image_key` text NOT NULL,
	`status` text DEFAULT 'new' NOT NULL,
	`item_price_cents` integer,
	`delivery_cents` integer,
	`quote_notes` text DEFAULT '' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `sourcing_requests_code_unique` ON `sourcing_requests` (`code`);