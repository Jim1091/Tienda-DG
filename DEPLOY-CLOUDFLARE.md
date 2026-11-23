# Publicar DG-tienda con GitHub y Cloudflare Workers

Esta tienda usa Vinext, rutas de servidor, D1 y R2. El destino es **Cloudflare Workers** con la URL gratuita `https://dg-tienda.<tu-subdominio>.workers.dev`. Cada push a `main` puede publicar una nueva versión mediante Workers Builds. El Site de ChatGPT existente sigue siendo independiente.

## Lo que ya está preparado en el código

- `npm run build:cloudflare` genera el Worker y sus recursos estáticos con `wrangler.cloudflare.jsonc`.
- `npm run deploy:cloudflare` publica el resultado compilado. Úsalo como *Deploy command* en Workers Builds.
- Los bindings `DB` y `BUCKET` están declarados para que Wrangler los aprovisione en el primer despliegue. La base creada se llama `dg-tienda-db`; consulta el nombre real del bucket R2 en el panel de Cloudflare.
- `npm run db:migrate:cloudflare` aplica, con seguimiento de versiones, los SQL de `drizzle/` a la base remota. Ejecútalo **una vez después del primer despliegue** y de nuevo cuando se añadan migraciones. No apliques el esquema inicial a una base existente sin revisar sus tablas y respaldarla.
- El acceso al panel exige un JWT válido de Cloudflare Access, el `AUD` de la aplicación y el correo configurado en `DG_ADMIN_EMAIL`. El Worker descarta los encabezados de identidad que pueda enviar el visitante.
- `.node-version` fija Node 22 para la compilación. `.dev.vars` y los artefactos compilados están fuera de Git.

## Pasos en tus cuentas

1. **GitHub:** crea un repositorio **privado y vacío** llamado `dg-tienda` en la cuenta donde quieras mantener el código. No selecciones README ni `.gitignore` al crearlo. En la carpeta `DG-tienda`, revisa `git status --short` y el commit local preparado; agrega la URL remota y envía `main`:

   ```powershell
   cd 'C:\Users\jl-eu\OneDrive\Documentos\ProyectoÑiñita\DG-tienda'
   git remote add origin https://github.com/TU_USUARIO/dg-tienda.git
   git push -u origin main
   ```

   Si GitHub pide autenticación, usa tu inicio de sesión de GitHub. No pegues un token en el repositorio ni en el chat.

2. **Cloudflare:** entra en **Workers & Pages → Create application → GitHub**, autoriza ese repositorio y selecciona la rama de producción `main`. Pon al Worker el nombre exacto `dg-tienda`. La raíz del proyecto es `/` porque `DG-tienda` es el repositorio Git. Configura:

   | Campo | Valor |
   | --- | --- |
   | Build command | `npm run build:cloudflare` |
   | Deploy command | `npm run deploy:cloudflare` |
   | Production branch | `main` |

   Selecciona **Save and Deploy**. Si Cloudflare ofrece una configuración automática de Next.js, conserva el comando de build y el comando de deploy indicados arriba; esta aplicación ya trae su configuración de Vinext. Comprueba en **Deployments** que el primer build termine correctamente.

3. **Datos:** en **Workers & Pages → dg-tienda → Bindings**, confirma que aparecen `DB` (D1) y `BUCKET` (R2). Si la cuenta aún no habilitó R2, completa ese paso en Cloudflare. Para aplicar el esquema remoto, inicia sesión una vez desde tu terminal y ejecuta:

   ```powershell
   npx wrangler login
   npm run db:migrate:cloudflare
   ```

   Revisa el nombre de la base que muestra Wrangler y confirma que es la nueva `dg-tienda-db` antes de aceptar la migración. Después comprueba que `/api/catalog` devuelve `200`. Un Git push no migra automáticamente los datos ni las fotos del Site antiguo.

4. **Administración:** en **Zero Trust → Access → Applications**, crea **una aplicación Self-hosted** para el hostname `dg-tienda.<tu-subdominio>.workers.dev`. Protege estas rutas en esa misma aplicación: `/admin`, `/admin/*`, `/api/admin` y `/api/admin/*`. Crea una política **Allow** para el correo exacto de la administradora. Puedes usar el método de inicio de sesión con código por correo que ofrece Access.

   Copia de esa aplicación el **Application Audience (AUD) Tag**. En **Workers & Pages → dg-tienda → Settings → Variables and Secrets**, configura **variables de ejecución** (no variables de build):

   | Nombre | Valor |
   | --- | --- |
   | `DG_ADMIN_EMAIL` | Correo autorizado para el panel. Guárdalo como secreto. |
   | `DG_ACCESS_TEAM_DOMAIN` | `https://TU-EQUIPO.cloudflareaccess.com` |
   | `DG_ACCESS_AUD` | AUD Tag de la aplicación Access. |

   El código ya fija `DG_AUTH_PROVIDER=cloudflare_access`. Espera a que las variables estén activas. Abre `/admin` para iniciar sesión; comprueba que otra cuenta y una petición sin sesión reciben `403`. La página pública `/` debe seguir abierta para los clientes.

5. **Verifica la tienda publicada:** abre el catálogo, añade una prenda al carrito, crea un pedido de prueba, comprueba el rastreo y entra al panel para gestionar el pedido. Prueba la carga de una foto pequeña y su URL `/api/media/...`. Confirma WhatsApp, precios, datos de transferencia y stock antes de compartir la URL.

6. **Actualizaciones posteriores:** en este mismo repositorio, cada cambio aprobado se envía con `git add`, `git commit` y `git push origin main`. Cloudflare hará el build y el despliegue. Si un cambio incluye un nuevo SQL en `drizzle/`, aplica también `npm run db:migrate:cloudflare` en el momento planificado para ese cambio. Consulta **Deployments** para ver errores o volver a una versión anterior.

## Verificación local

```powershell
npm ci
npm run test:cloudflare-auth
npx tsc --noEmit
npm run build:cloudflare
```

Para probar el Worker local antes de subirlo, usa una base de pruebas separada. `npm run lint` todavía informa errores de interfaz preexistentes; no forma parte del comando de publicación.

## Datos del Site actual

El Site `dg-moda-estudio` está activo, pero la cuenta conectada en esta sesión no tiene permiso para leer su D1. Las migraciones crean las prendas de ejemplo y sus imágenes estáticas, pero **no trasladan** pedidos, cambios hechos desde el panel ni fotos subidas a R2. Antes de usar la nueva URL como tienda principal, exporta o revisa esos datos desde la cuenta propietaria del Site y decide si deben copiarse. Mantén el Site antiguo disponible hasta comprobar la nueva tienda.
