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

Un proyecto, root = raíz. Solo hace falta el build de Vite (`npm run build`).

## Usuarios

| Rol | Usuario | Contraseña |
|-----|---------|------------|
| Solo lectura | `dev.public` | `dev.public2026` |
| Admin (CRUD) | `jon.pereyra` | `jon2026` |
