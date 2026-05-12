# UniNetwork — Despliegue en Cloudflare

## Arquitectura

```
Cloudflare Pages
├── frontend/dist/          ← React SPA (Vite)
└── functions/api/[[route]].js  ← API backend (Hono + D1)
```

- **Frontend**: React + Vite → Cloudflare Pages (CDN global)
- **Backend**: Hono.js → Cloudflare Pages Functions (serverless Edge)
- **Base de datos**: Cloudflare D1 (SQLite serverless, mismo datacenter)
- **Sin servidor**: 100% serverless, sin costos fijos

---

## Requisitos previos

```bash
# 1. Instalar Wrangler globalmente (opcional, ya está en devDependencies)
npm install -g wrangler

# 2. Autenticarse con tu cuenta de Cloudflare
npx wrangler login
```

---

## Despliegue paso a paso

### Paso 1 — Crear la base de datos D1

```bash
npx wrangler d1 create uninetwork-db
```

Copia el `database_id` que aparece en el output y pégalo en `wrangler.toml`:

```toml
[[d1_databases]]
binding = "DB"
database_name = "uninetwork-db"
database_id = "PEGA_AQUI_EL_ID"   # ← reemplazar
```

### Paso 2 — Aplicar el schema a D1

```bash
# Producción (remoto)
npx wrangler d1 execute uninetwork-db --file=./schema.sql --remote

# Local (para desarrollo)
npx wrangler d1 execute uninetwork-db --file=./schema.sql
```

### Paso 3 — Insertar datos semilla

```bash
# Producción
npx wrangler d1 execute uninetwork-db --file=./seed.sql --remote

# Local
npx wrangler d1 execute uninetwork-db --file=./seed.sql
```

> **Nota:** Los usuarios demo tienen contraseña `demo1234` pero los hashes en `seed.sql`
> son de bcrypt (del backend viejo). Al registrarte desde la app se usará el nuevo hash PBKDF2.
> Para tener usuarios demo funcionales, regístralos manualmente desde la app una vez desplegada,
> o usa las credenciales de los usuarios que registres.

### Paso 4 — (Opcional) Variable de entorno JWT_SECRET

En el dashboard de Cloudflare → Pages → tu proyecto → Settings → Environment Variables:

```
JWT_SECRET = un_secreto_largo_y_aleatorio_aqui
```

### Paso 5 — Build y deploy

```bash
# Build del frontend
npm run build

# Deploy a Cloudflare Pages
npx wrangler pages deploy frontend/dist
```

El primer deploy te pedirá el nombre del proyecto (usa `uninetwork`).

---

## Desarrollo local

```bash
# Terminal 1: servidor de Pages Functions local (puerto 8788)
npx wrangler pages dev frontend/dist --compatibility-flag=nodejs_compat

# Terminal 2: Vite dev server (puerto 5173, con proxy a :8788)
cd frontend && npm run dev
```

Visita http://localhost:5173

---

## Scripts disponibles (desde la raíz)

| Script | Descripción |
|--------|-------------|
| `npm run build` | Build del frontend |
| `npm run deploy` | Build + deploy a Cloudflare Pages |
| `npm run db:create` | Crear base de datos D1 |
| `npm run db:migrate` | Aplicar schema (remoto) |
| `npm run db:migrate:local` | Aplicar schema (local) |
| `npm run db:seed` | Insertar datos semilla (remoto) |
| `npm run db:seed:local` | Insertar datos semilla (local) |

---

## Notas importantes

### Cambio en autenticación
El backend original usaba `bcryptjs` y `jsonwebtoken` (incompatibles con Workers Edge Runtime).  
La nueva versión usa:
- **Hashing**: PBKDF2-SHA256 via Web Crypto API (nativo del browser/Workers)
- **JWT**: HMAC-SHA256 via Web Crypto API

Los hashes de contraseñas **no son retrocompatibles**. Los usuarios registrados con el backend viejo necesitarán registrarse de nuevo, o hacer un reset de contraseña.

### Imágenes (Base64)
Las imágenes de perfil y posts se almacenan como strings Base64 en D1. Funciona para avatares pequeños pero puede ser lento para imágenes grandes (>100KB). Para imágenes en posts se recomienda usar URLs externas.

### Límites de D1 (plan gratuito)
- 5 GB de almacenamiento
- 5 millones de lecturas/día
- 100.000 escrituras/día

Más que suficiente para una aplicación educativa en fase inicial.
