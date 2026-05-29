# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

## App

- **Login**: `/login` (público)
- **Timeline**: `/timeline` (privado; requiere sesión)

## Desarrollo (monorepo)

```bash
nvm use                            # lee .nvmrc → Node 20.19+
cp server/.env.example server/.env   # configurar MONGODB_URI
npm install
npm run dev                          # API en :3001 + Vite en :5173
```

La API Express vive en `server/`. Al arrancar, si la colección está vacía, importa los eventos desde `db.json` a MongoDB.

```bash
npm run seed --prefix server            # seed manual
```

## Deploy en Vercel (dos proyectos)

El monorepo tiene **frontend** (raíz) y **backend** (`server/`). Son **dos deploys distintos** en Vercel:

### 1. API (backend) — ya lo tenés

| Campo | Valor |
|-------|--------|
| Proyecto | p. ej. `timeline-server` |
| **Root Directory** | `server` |
| Variables | `MONGODB_URI` |

URL: `https://timeline-server-ten.vercel.app` → solo API (`/events`, `/health`).

### 2. Web (frontend) — proyecto nuevo

Creá **otro** proyecto en Vercel conectado al mismo repo:

| Campo | Valor |
|-------|--------|
| Proyecto | p. ej. `timeline` o `timeline-web` |
| **Root Directory** | vacío / `.` (raíz del repo, **no** `server`) |
| Framework | Vite (auto) |
| Variables | `VITE_API_URL=https://timeline-server-ten.vercel.app` |

URL: `https://timeline-xxx.vercel.app` → React (login, timeline).

> Si Root Directory apunta a `server`, el navegador muestra el backend. Eso es correcto para el proyecto API; el front va en un segundo proyecto sin `server` como raíz.

Seed en producción (una vez):

```bash
MONGODB_URI="mongodb+srv://..." npm run seed --prefix server
```

## Usuarios

- **Público (solo lectura)**: `dev.public` / `dev.public2026`
- **Admin (CRUD completo)**: `jon.pereyra` / `jon2026`

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
