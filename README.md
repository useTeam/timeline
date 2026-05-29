# Timeline Betas 2026

Timeline de hitos del desafío Betas. Los datos viven en **MongoDB**; el front solo consume la API.

## Estructura y flujo de datos

```
server/data/seed.json  →  npm run db:seed  →  MongoDB Atlas
MongoDB Atlas          →  API /api/events  →  React timeline
```

- **seed.json**: solo para cargar la DB la primera vez (comando manual).
- **En producción y en dev**: el timeline lee **MongoDB**, no el archivo JSON.

```
api/                  → funciones Vercel (/api/health, /api/events)
server/               → Express local (:3001) + modelos Mongoose
  data/seed.json
src/                  → React + Vite
```

## Desarrollo local

```bash
nvm use
cp server/.env.example server/.env   # MONGODB_URI
npm install                          # instala raíz + server/
npm run db:seed                      # carga seed.json → MongoDB (una vez)
npm run dev                          # API :3001 + Vite :5173
```

## Cargar / recargar la base de datos

```bash
npm run db:seed
```

- Lee `server/data/seed.json` (antes `db.json` en la raíz).
- Si ya hay eventos en MongoDB, no hace nada.
- Para **reemplazar** todo:

```bash
npm run db:seed -- --force
```

Requiere `MONGODB_URI` en `server/.env`.

## Usuarios

| Rol | Usuario | Contraseña |
|-----|---------|------------|
| Solo lectura | `dev.public` | `dev.public2026` |
| Admin (CRUD) | `jon.pereyra` | `jon2026` |

## Deploy en Vercel

Un solo proyecto, **Root Directory** = raíz del repo.

| Variable | Valor |
|----------|--------|
| `MONGODB_URI` | URI de Atlas |

Tras el deploy, cargá la DB desde tu PC:

```bash
MONGODB_URI="mongodb+srv://..." npm run db:seed
```

Comprobar:

- `/api/health` → `{"ok":true}`
- `/api/events` → JSON
- `/` → app React
