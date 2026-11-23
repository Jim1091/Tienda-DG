UPDATE products
SET description = 'Para esos días en los que sales sin plan y vuelves con una historia.'
WHERE id = '00000000-0000-4000-8000-000000000101'
  AND description = 'Jean azul de costuras curvas. Talla M.';
--> statement-breakpoint
UPDATE products
SET description = 'Para ese atardecer que quieres recordar.'
WHERE id = '00000000-0000-4000-8000-000000000102'
  AND description = 'Top color vino sin tirantes. Talla M.';
--> statement-breakpoint
UPDATE products
SET description = 'Una escapada frente al mar, incluso si tu plan empieza en la ciudad.'
WHERE id = '00000000-0000-4000-8000-000000000103'
  AND description = 'Vestido camisero de rayas rosadas y blancas. Talla M.';
--> statement-breakpoint
UPDATE settings
SET value = json_set(value, '$.heroTitle', 'Vístete para lo que viene.')
WHERE key = 'store' AND json_extract(value, '$.heroTitle') = 'La elegancia empieza contigo.';
--> statement-breakpoint
UPDATE settings
SET value = json_set(value, '$.heroText', 'Un paseo sin plan, un atardecer frente al mar, una historia que empieza contigo. Elige la prenda que te acompañe.')
WHERE key = 'store' AND json_extract(value, '$.heroText') = 'Piezas elegidas para vestir cada momento con confianza. Descubre la colección DG.';
