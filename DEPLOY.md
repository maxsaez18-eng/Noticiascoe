# Deploy - App Noticias

Backend: Express (Node.js) + MongoDB Atlas + build web de Expo.
Hoster actual: **Koyeb** (free, sin tarjeta de crédito).

> Nota: Railway (trial agotado) y Render (exige tarjeta en 2026) no sirven gratis.

## 1. MongoDB Atlas (base de datos gratis)

1. Cuenta en https://www.mongodb.com/atlas
2. Cluster **M0 Free**
3. Database Access → usuario + password
4. Network Access → `0.0.0.0/0`
5. Databases → Connect → Drivers → connection string:
   `mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/app-noticias?retryWrites=true&w=majority`

> Si vienes de Railway, recupera el string con:
> `railway variables --json` (antes de que el proyecto expire).

## 2. Koyeb (backend + web, gratis)

1. Cuenta en https://koyeb.com (sin tarjeta en el plan free)
2. Dashboard → **Create App** → conecta GitHub y selecciona `maxsaez18-eng/Noticiascoe`
3. Configurar:
   - **Build Command**:
     `npm install && cd app && npm install && npx expo export --platform web --output-dir dist`
   - **Run Command**: `node server.js` (también valida el `Procfile` del repo)
   - **Instance**: free (`nano`, 512 MB)
   - **Región**: cualquiera (US/EU)
4. Variables de entorno:
   - `MONGODB_URI` = connection string de Atlas
   - `JWT_SECRET` = cadena larga secreta
   - `ADMIN_PASSWORD` = (opcional; si no, queda `admin123`)
5. Deploy. La app queda en una URL `https://<app>.koyeb.app`

## 3. Mantener despierto (cron-job.org, gratis)

Koyeb free escala a cero tras ~1h sin tráfico (cold start 1-5 s). Se mantiene
vivo con un ping:

1. Cuenta en https://cron-job.org
2. New Cron Job:
   - **URL**: `https://<tu-app>.koyeb.app/api/stats`
   - **Schedule**: cada `30` minutos
3. Guardar y activar

Con el servicio despierto, el fetch interno del backend (`setInterval` cada 6h)
corre solo.

## 4. Configurar la URL de la API en la app

La app lee `app/app.json` → `extra.apiUrl` (usado por `app/api.js`).

- **Web**: si `apiUrl` está vacío, la web usa automáticamente el mismo origen
  (funciona igual en cualquier host). Es la opción recomendada.
- **Android (EAS)**: hay que fijar `extra.apiUrl` a la URL de Koyeb (ej.
  `https://<app>.koyeb.app`) antes de `eas build`, porque ahí no hay "mismo
  origen".
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