# DG Moda

Adaptación académica de una tienda de ropa. El sitio de referencia es [Venova Moda](https://venovamoda.com/); se analizaron su navegación, catálogo, categorías, selección de talla, carrito, consulta de pedidos y acceso a WhatsApp. DG usa identidad gráfica, textos y datos de ejemplo propios.

## Probar localmente

Desde `DG-tienda`:

```powershell
python -m http.server 8000 --directory dist
```

Abre `http://localhost:8000`.

Para probar el recorrido: abre un producto con `+`, elige una talla, agrégalo al carrito, pulsa **Continuar pedido**, completa el formulario con un correo de prueba y guarda el número generado. Consúltalo en **Rastrear pedido** con el mismo correo. También existe el ejemplo `DG-DEMO-001` / `demo@dg.com`.

## Alcance de la demostración

- El catálogo, los precios y las fotos son ilustrativos. Las fotografías son de [Unsplash](https://unsplash.com/) y se guardaron localmente.
- El carrito y los pedidos se guardan en `localStorage` del navegador. El rastreo solo encuentra pedidos creados en ese mismo navegador, más el ejemplo incluido. No hay servidor, inventario real ni cuenta de usuario.
- No se cobran pagos ni se solicitan datos de tarjeta. “Transferencia” y “contra entrega” son elecciones de ejemplo, sin procesamiento.
- En `dist/app.js`, configura `WHATSAPP_NUMBER` con el número de DG en formato internacional (solo dígitos) para abrir un chat directo. Mientras esté vacío, el botón abre WhatsApp con el mensaje preparado y deja elegir destinatario.
- Para una tienda real harían falta backend, inventario, pagos certificados, gestión de pedidos y protección de datos.

## Archivos

- `dist/index.html`: estructura y contenido.
- `dist/styles.css`: identidad visual y diseño adaptable a móvil.
- `dist/app.js`: catálogo, filtros, carrito, compra y rastreo de demostración.
- `dist/images/`: fotografías locales usadas en la página.
