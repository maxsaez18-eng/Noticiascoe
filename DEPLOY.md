# Deploy - App Noticias

Backend: Express (Node.js) + MongoDB Atlas + build web de Expo.
Hoster actual: **Hugging Face Spaces** (Docker, gratis, sin tarjeta de crédito).

> Nota: Railway (trial agotado), Render y Koyeb (exigen tarjeta en 2026) no sirven gratis.

## 1. MongoDB Atlas (base de datos gratis)

1. Cuenta en https://www.mongodb.com/atlas
2. Cluster **M0 Free**
3. Database Access → usuario + password
4. Network Access → `0.0.0.0/0`
5. Databases → Connect → Drivers → connection string:
   `mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/app-noticias?retryWrites=true&w=majority`

> Si vienes de Railway, recupera el string con:
> `railway variables --json` (antes de que el proyecto expire).

## 2. Hugging Face Spaces (backend + web, gratis)

El repo ya trae `Dockerfile` + build web commiteado en `app/dist` (no hace falta
compilar en el host).

1. Cuenta en https://huggingface.co (solo email, **sin tarjeta**).
2. Nuevo Space:
   - **Space name**: `noticiascoe`
   - **License**: MIT
   - **SDK**: `Docker`
   - **Hardware**: `CPU basic` (free)
3. En el Space, Settings → **Synchronize with GitHub**:
   - Repo: `maxsaez18-eng/Noticiascoe`, rama `master`, subdirectorio: (vacío/raíz).
   - Cada push a GitHub redeploya automáticamente.
4. Settings → **Variables and secrets**:
   - `MONGODB_URI` (secreta) = connection string de Atlas
   - `JWT_SECRET` = cadena larga secreta
   - `ADMIN_PASSWORD` = (opcional; si no, queda `admin123`)
5. Esperar el build. La app queda en:
   `https://balocuun-noticiascoe.hf.space`

Prueba rápida: `https://balocuun-noticiascoe.hf.space/api/stats`

## 3. Mantener despierto (GitHub Actions)

Los Spaces free se duermen tras ~48h sin tráfico. El repo trae
`.github/workflows/keepalive.yml` que ya hace ping cada 30 min a
`https://balocuun-noticiascoe.hf.space` (`/api/stats` y `/api/cron`); corre solo
según el cron, sin configuración adicional en GitHub.

> Con el servicio despierto, el fetch interno del backend (`setInterval` cada 6h)
> corre solo. El ping a `/api/cron` además lanza una pasada completa de fetch.

## 4. Configurar la URL de la API en la app

La app lee `app/app.json` → `extra.apiUrl` (usado por `app/api.js`).

- **Web**: si `apiUrl` está vacío, la web usa automáticamente el mismo origen
  (funciona igual en cualquier host). Es la opción recomendada.
- **Android (EAS)**: hay que fijar `extra.apiUrl` a la URL de HF (ej.
  `https://<tu-usuario>-noticiascoe.hf.space`) antes de `eas build`, porque ahí
  no hay "mismo origen".
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