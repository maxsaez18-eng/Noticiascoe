# Deploy - App Noticias

Backend: Express (Node.js) + MongoDB Atlas + build web de Expo.
Hoster actual: **Suga** (contenedores Node siempre encendidos, gratis, **sin tarjeta**).

> Nota: Railway (trial agotado), Render, Koyeb y Hugging Face Spaces (Docker) exigen tarjeta o PRO en 2026.

## 1. MongoDB Atlas (base de datos gratis)

1. Cuenta en https://www.mongodb.com/atlas
2. Cluster **M0 Free**
3. Database Access → usuario + password
4. Network Access → `0.0.0.0/0`
5. Databases → Connect → Drivers → connection string:
   `mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/app-noticias?retryWrites=true&w=majority`

> Si vienes de Railway, recupera el string con:
> `railway variables --json` (antes de que el proyecto expire).

## 2. Suga (backend + web, gratis y siempre encendido)

El repo ya trae `Dockerfile` (escucha en el puerto `8080`) y el build web commiteado en `app/dist`, así que Suga solo tiene que construir el contenedor.

1. Cuenta en https://dashboard.suga.app/signup (solo email, **sin tarjeta**).
   Al crear la organización, elige la región más cercana a tus usuarios.
2. **New project** → **Connect GitHub** → instala la Suga GitHub App y dale acceso a `maxsaez18-eng/Noticiascoe`.
3. Al importar, configura:
   - **Branch**: `master`
   - **Build method**: `Dockerfile` (ya está en la raíz)
   - **Root directory**: (vacío)
4. Crea el proyecto. En el canvas, click en el servicio → pestaña **Config**:
   - **Public Networking** → **Generated URL** → **Add** → target port **8080**.
   - **Environment variables** (marcar las secretas como *Sensitive*):
     - `MONGODB_URI` = connection string de Atlas
     - `JWT_SECRET` = cadena larga secreta
     - `ADMIN_PASSWORD` = (opcional; si no, queda `admin123`)
   - **Resources**: CPU `0.1` / Memory `256 MiB` (máximo del tier free; la app cabe).
5. **Apply** para desplegar. El build tarda unos minutos.
6. La app queda en una URL del tipo:
   `https://<service-id>-production-<region>.suga.run`

Prueba rápida: `https://<service-id>-production-<region>.suga.run/api/stats`

## 3. Uptime / keepalive

Suga mantiene el servicio **siempre encendido** (no duerme, sin cold starts), así que
no necesitas pings. El fetch interno del backend (`setInterval` cada 6h) corre solo.
Opcionalmente, `.github/workflows/keepalive.yml` puede pasar de monitor con un cron
cada 30 min sobre `/api/stats` y `/api/cron` (completar la URL real y descomentar)
para recibir aviso por email si el servicio cae.

## 4. Configurar la URL de la API en la app

La app lee `app/app.json` → `extra.apiUrl` (usado por `app/api.js`).

- **Web**: si `apiUrl` está vacío, la web usa automáticamente el mismo origen
  (funciona igual en cualquier host). Es la opción recomendada.
- **Android (EAS)**: hay que fijar `extra.apiUrl` a la URL real de Suga (ej.
  `https://xxxx-production-abc.us-central1.suga.run`) antes de `eas build`,
  porque ahí no hay "mismo origen".
- También rellenar el `intentFilters` de Android (scheme/host) si se quiere deep
  link hacia la URL del backend.

## Comandos útiles

```bash
# Local (necesita MongoDB corriendo o MONGODB_URI)
npm install
node server.js

# Web build local
cd app && npx expo export --platform web --output-dir dist
```