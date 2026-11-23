INSERT OR IGNORE INTO categories (id, name, slug, position, active, image_key)
VALUES ('00000000-0000-4000-8000-000000000201', 'Jeans', 'jeans-dg', 1, 1, NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO categories (id, name, slug, position, active, image_key)
VALUES ('00000000-0000-4000-8000-000000000202', 'Tops', 'tops-dg', 2, 1, NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO categories (id, name, slug, position, active, image_key)
VALUES ('00000000-0000-4000-8000-000000000203', 'Vestidos', 'vestidos-dg', 3, 1, NULL);
--> statement-breakpoint
UPDATE products SET category_id = '00000000-0000-4000-8000-000000000201'
WHERE id = '00000000-0000-4000-8000-000000000101' AND category_id IS NULL;
--> statement-breakpoint
UPDATE products SET category_id = '00000000-0000-4000-8000-000000000202'
WHERE id = '00000000-0000-4000-8000-000000000102' AND category_id IS NULL;
--> statement-breakpoint
UPDATE products SET category_id = '00000000-0000-4000-8000-000000000203'
WHERE id = '00000000-0000-4000-8000-000000000103' AND category_id IS NULL;
