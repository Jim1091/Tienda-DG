CREATE TABLE `categories` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`position` integer DEFAULT 0 NOT NULL,
	`active` integer DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `categories_slug_unique` ON `categories` (`slug`);--> statement-breakpoint
CREATE TABLE `order_items` (
	`id` text PRIMARY KEY NOT NULL,
	`order_id` text NOT NULL,
	`product_id` text NOT NULL,
	`name` text NOT NULL,
	`size` text NOT NULL,
	`unit_price_cents` integer NOT NULL,
	`quantity` integer NOT NULL,
	FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `orders` (
	`id` text PRIMARY KEY NOT NULL,
	`code` text NOT NULL,
	`customer_name` text NOT NULL,
	`customer_email` text NOT NULL,
	`customer_phone` text NOT NULL,
	`delivery_details` text NOT NULL,
	`payment_method` text NOT NULL,
	`payment_status` text DEFAULT 'pending' NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`total_cents` integer NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `orders_code_unique` ON `orders` (`code`);--> statement-breakpoint
CREATE TABLE `products` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`category_id` text,
	`price_cents` integer NOT NULL,
	`compare_at_cents` integer,
	`stock` integer DEFAULT 0 NOT NULL,
	`sizes` text DEFAULT '[]' NOT NULL,
	`image_key` text,
	`featured` integer DEFAULT false NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `products_slug_unique` ON `products` (`slug`);--> statement-breakpoint
CREATE TABLE `settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL
);
--> statement-breakpoint
CREATE TRIGGER `prevent_negative_stock` BEFORE UPDATE OF `stock` ON `products`
WHEN NEW.stock < 0 BEGIN SELECT RAISE(ABORT, 'insufficient_stock'); END;
--> statement-breakpoint
CREATE TRIGGER `confirm_order_stock` AFTER UPDATE OF `status` ON `orders`
WHEN OLD.status = 'pending' AND NEW.status = 'confirmed'
BEGIN
  UPDATE products SET stock = stock -
    (SELECT SUM(quantity) FROM order_items WHERE order_id = NEW.id AND product_id = products.id)
  WHERE id IN (SELECT product_id FROM order_items WHERE order_id = NEW.id);
END;
--> statement-breakpoint
CREATE TRIGGER `cancel_order_stock` AFTER UPDATE OF `status` ON `orders`
WHEN OLD.status IN ('confirmed','packed') AND NEW.status = 'cancelled'
BEGIN
  UPDATE products SET stock = stock +
    (SELECT SUM(quantity) FROM order_items WHERE order_id = NEW.id AND product_id = products.id)
  WHERE id IN (SELECT product_id FROM order_items WHERE order_id = NEW.id);
END;
