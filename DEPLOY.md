# Deploy - App Noticias

## 1. MongoDB Atlas (base de datos gratis)

1. Crear cuenta en https://www.mongodb.com/atlas
2. Crear cluster **M0 Free** (elige AWS, cualquier región)
3. En Database Access → crear usuario (guardar user + password)
4. En Network Access → Add IP → `0.0.0.0/0` (Allow from anywhere)
5. En Databases → Connect → Drivers → copiar connection string
   - Se ve así: `mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/app-noticias?retryWrites=true&w=majority`

## 2. Render (backend gratis)

1. Crear cuenta en https://render.com (con GitHub)
2. Dashboard → New → Web Service
3. Conectar tu repositorio de GitHub
4. Configurar:
   - **Name**: `app-noticias`
   - **Root Directory**: (vacío, usar raíz)
   - **Build Command**: `cd app && npm install && npx expo export --platform web --output-dir dist`
   - **Start Command**: `npm install && node server.js`
   - **Plan**: Free
5. Agregar variable de entorno:
   - `MONGODB_URI` = tu connection string de MongoDB Atlas
6. Deploy → esperar a que termine (primera vez tarda ~5 min)

Render te da una URL como `https://app-noticias.onrender.com`

## 3. cron-job.org (fetch cada 6h gratis)

1. Crear cuenta en https://cron-job.org
2. New Cron Job:
   - **URL**: `https://app-noticias.onrender.com/api/cron`
   - **Schedule**: `Every 6 hours`
   - Guardar

## 4. Expo Go (app en el celular)

```bash
cd app
npx expo publish
```

Esto publica la app en Expo. Después:
- Abrir Expo Go en el celular
- Iniciar sesión con la misma cuenta de Expo
- La app aparece en la lista "Published projects"

O compartir el link que muestra `expo publish`.

## 5. Configurar la API URL en el celular

Antes de publicar, editar `app/api.js` y cambiar:

```js
const BASE_URL = 'http://localhost:3000';
```

por:

```js
const BASE_URL = 'https://app-noticias.onrender.com';
```

Luego correr `npx expo publish` de nuevo.

## Comandos útiles

```bash
# Local (necesita MongoDB corriendo)
cd app-noticias
npm install
node server.js

# Web build local
cd app
npx expo export --platform web --output-dir dist

# Publicar en Expo
cd app
npx expo publish
```
