# Timeline Betas 2026

App React que lee los eventos desde **`public/seed.json`**.

## Desarrollo

```bash
nvm use
npm install
npm run dev
```

Si ves carpetas `server/` o `api/` viejas en el disco:

```bash
npm run clean:legacy
```

Abrí http://localhost:5173

## Datos

| Archivo | Uso |
|---------|-----|
| `public/seed.json` | Datos iniciales (editá este archivo y recargá) |

- Los eventos se cargan desde `public/seed.json`.
- Los cambios del admin duran hasta recargar la página (sesión en memoria).
- Para editar datos permanentes, modificá `public/seed.json` y hacé redeploy.

## Deploy (Vercel)

Solo frontend estático (Vite). **No hay backend ni entrypoint de servidor.**

En el proyecto de Vercel → **Settings → General**:

| Campo | Valor correcto |
|-------|----------------|
| **Root Directory** | vacío / `.` (**no** `server`) |
| **Framework Preset** | Vite |
| **Build Command** | `npm run build` |
| **Output Directory** | `dist` |

Si Root Directory es `server`, el build falla con *"No entrypoint found"*.

Variables de entorno: ninguna obligatoria.

Antes del deploy, en tu repo no deberían existir `server/` ni `api/`:

```bash
npm run clean:legacy
git add -A && git commit -m "chore: solo frontend estático" && git push
```

## Usuarios

| Rol | Usuario | Contraseña |
|-----|---------|------------|
| Solo lectura | `dev.public` | `dev.public2026` |
| Admin (CRUD) | `jon.pereyra` | `jon2026` |
