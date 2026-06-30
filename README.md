# Eudes Soler - Página web contable

Sitio estático en HTML, CSS y JavaScript. Se puede abrir directamente desde `index.html` o servirse con un servidor local.

## Verlo con un enlace local

Desde esta carpeta:

```bash
python3 -m http.server 8080
```

Luego abre:

```text
http://localhost:8080
```

Ese enlace funciona en este computador. Para compartirlo con otras personas fuera de tu red, hay que publicarlo en un hosting como GitHub Pages, Netlify, Vercel o un servidor propio.

## Configuración de WhatsApp

El número de WhatsApp está en `script.js`:

```js
const WHATSAPP_PHONE = "573115362222";
```

Reemplaza ese valor por el número real en formato internacional, sin `+`, espacios ni guiones.

Ejemplo para Colombia:

```js
const WHATSAPP_PHONE = "573115362222";
```

## Archivos

- `index.html`: estructura del sitio.
- `styles.css`: diseño responsive.
- `script.js`: filtros, recomendador y redirecciones a WhatsApp.
- `assets/eudes-soler-hero-v4.png`: imagen principal generada para la marca, sin personas y con banderas de Colombia y Cundinamarca.
- `site.webmanifest`: configuración básica para instalación/acceso desde móviles.
