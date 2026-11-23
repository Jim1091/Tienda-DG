INSERT INTO products (id,name,slug,description,category_id,price_cents,compare_at_cents,stock,sizes,image_key,featured,status,created_at,updated_at)
SELECT '00000000-0000-4000-8000-000000000101','Jean de costuras curvas','jean-costuras-curvas-dg','Jean azul de costuras curvas. Talla M.',NULL,2800,NULL,5,'["M"]','static/jean-curvo-estudio.webp',1,'active','2026-11-17T00:00:00.000Z','2026-11-17T00:00:00.000Z'
WHERE NOT EXISTS (SELECT 1 FROM products WHERE slug='jean-costuras-curvas-dg');
--> statement-breakpoint
INSERT INTO products (id,name,slug,description,category_id,price_cents,compare_at_cents,stock,sizes,image_key,featured,status,created_at,updated_at)
SELECT '00000000-0000-4000-8000-000000000102','Top vino sin tirantes','top-vino-sin-tirantes-dg','Top color vino sin tirantes. Talla M.',NULL,1000,NULL,5,'["M"]','static/top-vino-estudio.webp',1,'active','2026-11-17T00:00:00.000Z','2026-11-17T00:00:00.000Z'
WHERE NOT EXISTS (SELECT 1 FROM products WHERE slug='top-vino-sin-tirantes-dg');
--> statement-breakpoint
INSERT INTO products (id,name,slug,description,category_id,price_cents,compare_at_cents,stock,sizes,image_key,featured,status,created_at,updated_at)
SELECT '00000000-0000-4000-8000-000000000103','Vestido camisero a rayas','vestido-camisero-rayas-dg','Vestido camisero de rayas rosadas y blancas. Talla M.',NULL,1000,NULL,5,'["M"]','static/vestido-rayas-estudio.webp',1,'active','2026-11-17T00:00:00.000Z','2026-11-17T00:00:00.000Z'
WHERE NOT EXISTS (SELECT 1 FROM products WHERE slug='vestido-camisero-rayas-dg');
