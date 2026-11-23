# Daniela y Garu (DG)

Para publicar esta tienda con GitHub y Cloudflare Workers, sigue [DEPLOY-CLOUDFLARE.md](DEPLOY-CLOUDFLARE.md).

## Servicio «Buscamos por ti»

El servicio está oculto por defecto. Desde **Administración → Configuración** se puede activar con «Mostrar Buscamos por ti en la tienda». Mientras está oculto, la portada y sus enlaces desaparecen y la API rechaza solicitudes nuevas; el seguimiento de solicitudes existentes sigue disponible.

En la portada, el cliente puede enviar una foto de referencia, talla, ciudad y datos de contacto. Recibe un código y puede seguir la solicitud con su correo. La foto se guarda en R2 y solo el panel privado puede verla. En **Administración → Buscamos por ti**, DG revisa la foto, busca opciones manualmente y registra por separado el precio de la prenda y del envío. La cotización aparece al cliente antes de que acepte la compra por WhatsApp. No hay búsqueda automática de proveedores ni cobro en línea.

La migración `drizzle/0002_dusty_scalphunter.sql` crea la tabla de solicitudes. Para pruebas locales se ejecuta después de `0000` y `0001`. El sitio está configurado con acceso público; el panel sigue limitado a la identidad administradora. Revisa solicitudes nuevas desde el panel y contacta al cliente cuando publiques una cotización.

Tienda de ropa adaptable a móvil, con catálogo administrable, pedidos por WhatsApp o transferencia y rastreo por código y teléfono. La migración `0003_dg_real_garments.sql` incorpora jean, top vino y vestido a rayas con talla M y cinco unidades cada uno. La migración `0004_dg_real_categories.sql` añade los filtros Jeans, Tops y Vestidos.

Las tres prendas se publican en el catálogo de D1 con los precios y existencias confirmados y se pueden añadir al carrito. Sus imágenes de presentación están en `public/products/`; los fondos de viaje fueron editados con IA y conviene cotejar los detalles con la prenda física. Las fotos de estudio anteriores están en `frontend/assets/previous-backgrounds/`. Si la migración aún no se aplicó, la portada muestra esas prendas solo para consulta por WhatsApp. El panel permite subir una foto propia por categoría.

La sección **Ofertas** aparece solo cuando hay un producto activo con stock, precio actual y un **precio anterior mayor**. El porcentaje se calcula a partir de esos precios.

## Arquitectura

- **Frontend:** React y Vinext en `frontend/storefront/`, con las páginas de entrada de Next en `app/` y estilos en `app/*.css`.
- **Backend:** API HTTP en `app/api/[...path]/route.ts`; validación y reglas en `backend/domain/`; casos de uso en `backend/application/`; acceso a D1/R2 e imágenes en `backend/infrastructure/`.
- **Datos:** Cloudflare D1 para categorías, productos, pedidos y configuración; R2 para fotos. El esquema está en `backend/infrastructure/db/` y las migraciones versionadas en `drizzle/`.
- **Acceso:** el panel `/admin` y las rutas `/api/admin/*` requieren la identidad de la propietaria del sitio; `DG_ADMIN_EMAIL` se configura como variable privada del alojamiento. Las escrituras exigen además origen del sitio y cabecera `x-dg-admin`.
- **Pedidos:** no se cobra en la web. Cada pedido comienza pendiente. El administrador verifica el pago y confirma; la confirmación descuenta stock de forma transaccional mediante triggers de D1. Cancelar antes del envío restituye el stock.

La estructura separa reglas de dominio, almacenamiento y presentación. Para una aplicación nativa futura se puede envolver la PWA o reutilizar la API sin duplicar el catálogo.

Las fotos de las tres prendas reales están en `public/products/` y se reutilizan en la portada, el catálogo y las secciones visuales.

## Administrar la tienda

En local, ejecuta `npm run dev -- --port 5174` si el puerto 5173 está ocupado y abre `http://127.0.0.1:5174/admin`. El modo de desarrollo ofrece el inicio de sesión de prueba `seedy@sites.test`; no es una cuenta de producción. En **Productos** puedes añadir prendas, precio, talla, stock y foto. En **Configuración** puedes cambiar el texto principal, el enlace de TikTok, el horario de lives y activar «Buscamos por ti». Allí se editan los días y las horas que aparecen junto a «Horario» en el lado editorial de la portada.

En el sitio publicado, `/admin` exige iniciar sesión con la cuenta de ChatGPT cuyo correo coincida con `DG_ADMIN_EMAIL`. No hay contraseña local ni registro de usuarios en la aplicación.

El cliente puede rastrear un pedido con su código y teléfono de WhatsApp. En `/cuenta` puede consultar, sin registrarse, el historial de pedidos asociados a ese teléfono al demostrar que conoce el código de uno de ellos. Se muestran estado, fecha, prendas y total; no se devuelve dirección ni teléfono en la respuesta. La tienda no envía correos ni SMS para esta consulta. El correo es opcional en la API de pedidos y no se solicita en el checkout.

## Probar localmente

Requiere Node 22 o superior.

```powershell
npm ci
npm run db:generate # solo cuando cambie backend/infrastructure/db/schema.ts
npm run build
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_sweet_leo.sql
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0001_clever_titanium_man.sql
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0002_dusty_scalphunter.sql
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0003_dg_real_garments.sql
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0004_dg_real_categories.sql
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0005_dg_product_stories.sql
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js dev --config dist/server/wrangler.json --local --persist-to .wrangler/state --ip 127.0.0.1 --var DG_ADMIN_EMAIL:seedy@sites.test
```

La tienda local abre en `http://127.0.0.1:8787`. En otra terminal, `node scripts/smoke-store.mjs` y `node scripts/smoke-sourcing.mjs` comprueba autorización, catálogo, pedidos, rastreo, stock y fotos. El script crea datos **solo en la base local**. Para volver a compilar, detén el servidor de Wrangler primero.

## Publicación y operación

El manifiesto `.openai/hosting.json` conecta D1 y R2 al mismo Site. Sites aplica la migración antes de publicar el Worker. Mantén `DG_ADMIN_EMAIL` como secreto del entorno, no en Git. El sitio ya es público. Antes de promocionarlo, carga productos reales, confirma los datos de transferencia, prueba en móvil y acuerda entregas, devoluciones y tratamiento de datos.

La tienda permite cargar tallas y stock total por producto. Si DG necesita stock independiente por talla o integración con pasarela de pagos, esas funciones requieren una evolución del modelo y pruebas adicionales.
