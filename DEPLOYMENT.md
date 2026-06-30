# Publicación y WhatsApp

## Publicar la web

La web está lista para publicarse como sitio estático. Opciones recomendadas:

1. GitHub Pages: gratis, ideal si el repositorio estará en GitHub.
2. Vercel: recomendado si también se quiere activar el webhook `/api/whatsapp/webhook`.
3. Netlify: válido para la web estática; el bot requiere una función serverless equivalente.

Para tener web pública + bot de WhatsApp en un solo lugar, usa Vercel.

## Variables necesarias para el bot de WhatsApp

Configura estas variables en el hosting:

```text
WHATSAPP_VERIFY_TOKEN=un_token_inventado_por_ti
WHATSAPP_ACCESS_TOKEN=token_de_meta_whatsapp_cloud_api
WHATSAPP_PHONE_NUMBER_ID=id_del_numero_en_meta
WHATSAPP_GRAPH_VERSION=v20.0
ADMIN_WHATSAPP_NUMBER=573115362222
```

Para guardar el estado de conversación de forma estable, configura también Upstash Redis:

```text
UPSTASH_REDIS_REST_URL=url_rest_de_upstash
UPSTASH_REDIS_REST_TOKEN=token_rest_de_upstash
```

Sin Redis, el bot usa memoria temporal. Eso sirve para pruebas, pero no es confiable en producción.

## URL del webhook

Después de desplegar en Vercel, registra esta URL en Meta:

```text
https://TU-DOMINIO.vercel.app/api/whatsapp/webhook
```

Usa el mismo valor de `WHATSAPP_VERIFY_TOKEN` cuando Meta pida verificar el webhook.

## Qué permite cada opción de WhatsApp

WhatsApp Business App:

- Mensaje de bienvenida.
- Mensaje de ausencia.
- Respuestas rápidas manuales.
- No permite un bot dinámico completo con lógica propia.

WhatsApp Business Platform / Cloud API:

- Webhook para recibir mensajes.
- Respuestas automáticas por pasos.
- Integración con base de datos.
- Envío de resúmenes al asesor.
- Requiere cuenta de Meta Business, número conectado y token de acceso.

## Flujo del bot incluido

El webhook conversa con el cliente así:

1. Tipo de cliente.
2. Servicio que necesita.
3. Estado, volumen o alcance.
4. Urgencia.
5. Nombre.
6. Ciudad.
7. Detalle adicional.
8. Confirmación y resumen.

El cliente puede escribir `reiniciar`, `inicio`, `hola` o `menú` para empezar de nuevo.
