# UniNetwork — Despliegue en Cloudflare

## Arquitectura

```
Cloudflare Pages
├── frontend/dist/              ← React SPA (Vite)
└── functions/api/[[route]].js  ← API backend (Hono + D1)
```

---

## Configuración en Cloudflare Pages (Dashboard)

> ⚠️ **IMPORTANTE**: El repo tiene subcarpeta `uninetwork/`. Debes configurar:

| Campo | Valor |
|-------|-------|
| **Root directory** | `uninetwork` |
| **Build command** | `npm run build` |
| **Build output directory** | `frontend/dist` |

Esto hace que todos los comandos corran desde dentro de `uninetwork/`, donde están `wrangler.toml`, `schema.sql`, etc.

---

## Paso a paso inicial (una sola vez)

### 1. La BD D1 ya fue creada
El ID es: `58c3061d-d9c7-4dc5-9f0d-68cd681f2fd9` (ya en `wrangler.toml`)

### 2. Aplicar schema y seed (desde tu PC local)

Abre una terminal **dentro de** `uninetwork/`:

```bash
# Aplicar schema de tablas
npx wrangler d1 execute uninetwork-db --file=./schema.sql --remote

# Insertar datos iniciales
npx wrangler d1 execute uninetwork-db --file=./seed.sql --remote
```

> Necesitas estar autenticado: `npx wrangler login`

### 3. Variable de entorno JWT_SECRET (opcional pero recomendado)

En Cloudflare Pages → Settings → Environment Variables:
```
JWT_SECRET = un_valor_largo_y_secreto_aleatorio
```

### 4. Próximos deploys

Con la configuración correcta en el dashboard, cada push al repo hará:
```bash
npm run build   # solo esto — rápido y sin errores
```

---

## Desarrollo local

```bash
# Terminal 1 — API + frontend estático con Wrangler (puerto 8788)
npx wrangler pages dev frontend/dist --compatibility-flag=nodejs_compat

# Terminal 2 — Vite dev server con hot reload (puerto 5173, proxy a :8788)
cd frontend && npm run dev
```

Para BD local primero aplica el schema:
```bash
npx wrangler d1 execute uninetwork-db --file=./schema.sql
npx wrangler d1 execute uninetwork-db --file=./seed.sql
```

---

## Scripts disponibles

```bash
npm run build           # Build del frontend (usado por Pages)
npm run deploy          # Build + deploy manual a Pages
npm run db:migrate      # Aplicar schema a D1 remoto
npm run db:migrate:local # Aplicar schema a D1 local
npm run db:seed         # Insertar seed data en D1 remoto
npm run db:seed:local   # Insertar seed data en D1 local
```

---

## Notas

- **Autenticación**: usa PBKDF2 + HMAC-JWT (Web Crypto API nativa). Los usuarios demo del seed necesitan ser registrados de nuevo desde la app.
- **Imágenes**: se guardan como Base64 en D1 (funciona para avatares pequeños).
- **D1 gratis**: 5GB storage, 5M lecturas/día, 100K escrituras/día.
