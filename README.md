# DG Moda Estudio

Tienda de ropa adaptable a móvil, con catálogo administrable, pedidos por WhatsApp o transferencia y rastreo por código y correo. El catálogo se entrega vacío para que la administradora cargue los productos reales.

Mientras el catálogo está vacío, la portada muestra fotografías ilustrativas en categorías y tarjetas de colección. Llevan etiquetas de ejemplo, no tienen precio ni botón de compra y no se guardan como productos. Desaparecen automáticamente de la colección cuando se publican productos reales. El panel permite subir una foto propia por categoría.

## Arquitectura

- **Interfaz:** React, Vinext y una PWA instalable en el teléfono.
- **API:** rutas en `app/api/[...path]/route.ts`, con validación en `lib/store-domain.ts` y acceso a D1/R2 en `lib/store-repository.ts`.
- **Datos:** Cloudflare D1 para categorías, productos, pedidos y configuración; R2 para fotos. La migración versionada está en `drizzle/`.
- **Acceso:** el panel `/admin` y las rutas `/api/admin/*` requieren la identidad de la propietaria del sitio; `DG_ADMIN_EMAIL` se configura como variable privada del alojamiento. Las escrituras exigen además origen del sitio y cabecera `x-dg-admin`.
- **Pedidos:** no se cobra en la web. Cada pedido comienza pendiente. El administrador verifica el pago y confirma; la confirmación descuenta stock de forma transaccional mediante triggers de D1. Cancelar antes del envío restituye el stock.

La estructura separa reglas de dominio, almacenamiento y presentación. Para una aplicación nativa futura se puede envolver la PWA o reutilizar la API sin duplicar el catálogo.

## Probar localmente

Requiere Node 22 o superior.

```powershell
npm ci
npm run db:generate # solo cuando cambie db/schema.ts
npm run build
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_sweet_leo.sql
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0001_clever_titanium_man.sql
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js dev --config dist/server/wrangler.json --local --persist-to .wrangler/state --ip 127.0.0.1 --var DG_ADMIN_EMAIL:seedy@sites.test
```

La tienda local abre en `http://127.0.0.1:8787`. En otra terminal, `node scripts/smoke-store.mjs` comprueba autorización, catálogo, pedidos, rastreo, stock y fotos. El script crea datos **solo en la base local**. Para volver a compilar, detén el servidor de Wrangler primero.

## Publicación y operación

El manifiesto `.openai/hosting.json` conecta D1 y R2 al mismo Site. Sites aplica la migración antes de publicar el Worker. Mantén `DG_ADMIN_EMAIL` como secreto del entorno, no en Git. El sitio se mantiene privado durante la preparación; antes de abrirlo al público, carga productos reales, confirma los datos de transferencia, prueba en móvil y acuerda entregas, devoluciones y tratamiento de datos.

La tienda permite cargar tallas y stock total por producto. Si DG necesita stock independiente por talla o integración con pasarela de pagos, esas funciones requieren una evolución del modelo y pruebas adicionales.
