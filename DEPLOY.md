# Deploy - App Noticias

Backend: Express (Node.js) + MongoDB Atlas + build web de Expo.
No se usa Railway (trial agotado en 2026). Hoster: **Render** (free, sin tarjeta).

## 1. MongoDB Atlas (base de datos gratis)

1. Cuenta en https://www.mongodb.com/atlas
2. Cluster **M0 Free**
3. Database Access → usuario + password
4. Network Access → `0.0.0.0/0`
5. Databases → Connect → Drivers → connection string:
   `mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/app-noticias?retryWrites=true&w=majority`

> Si vienes de Railway y tienes el connection string en las variables del proyecto
> de Railway, puedes recuperarlo con:
> `railway variables --json` (antes de que el proyecto expire).

## 2. Render (backend + web, gratis)

1. Cuenta en https://render.com (con GitHub)
2. Dashboard → New → Web Service → conectar el repo `maxsaez18-eng/Noticiascoe`
3. Configurar (ya está en `render.yaml`, pero verificar en el dashboard):
   - **Name**: `noticias-coe` (la URL final será `https://<name>.onrender.com`)
   - **Build Command**: `cd app && npm install && npx expo export --platform web --output-dir dist`
   - **Start Command**: `npm install && node server.js`
   - **Plan**: Free
4. Agregar variables de entorno:
   - `MONGODB_URI` = connection string de Atlas
   - `JWT_SECRET` = cadena larga secreta
   - `ADMIN_PASSWORD` = (opcional; si no se define queda `admin123`)
5. Deploy → esperar build (~5 min la primera vez)

Render da una URL del tipo `https://noticias-coe.onrender.com`.

> Ojo: al migrar desde Railway, el build apunta a `app/app.json` → `extra.apiUrl`.
> Actualizar esa URL antes de cada build del frontend.

## 3. Mantener despierto (cron-job.org, gratis)

Render free duerme el servicio tras ~15 min sin tráfico (~1 min de cold start).
Se evita con un ping:

1. Cuenta en https://cron-job.org
2. New Cron Job:
   - **URL**: `https://<tu-app>.onrender.com/api/stats`
   - **Schedule**: cada `10` minutos
3. Guardar y activar

Con el servicio despierto, el fetch interno del backend (`setInterval` cada 6h)
corre solo. El endpoint `POST /api/cron` sigue disponible si algún día se
quiere forzar la carga externamente.

## 4. Configurar la URL de la API en la app

La app lee la URL desde `app/app.json` → `extra.apiUrl` (usado por `app/api.js`).
Antes de publicar un build (web o APK), dejar:

```json
"extra": { "apiUrl": "https://noticias-coe.onrender.com", ... }
```

- **Web**: lo re-construye Render en cada deploy (`expo export`)
- **Android (EAS)**: la URL queda embebida al hacer `eas build`

## Comandos útiles

```bash
# Local (necesita MongoDB corriendo o MONGODB_URI)
npm install
node server.js

# Web build local
cd app && npx expo export --platform web --output-dir dist
```