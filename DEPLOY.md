# Deploy — VPS + pm2

## Prerequisitos en el VPS
- Node 20+, pnpm, PostgreSQL 16, pm2 (`npm i -g pm2`), Nginx, certbot (para TLS).

## Primer deploy

```bash
git clone <repo-url> souvenirs && cd souvenirs
pnpm install
```

Crear `apps/api/.env` (ver `apps/api/.env.example`) con valores reales:
`DATABASE_URL`, `DATABASE_URL_RUNTIME`, `JWT_SECRET`, `JWT_EXPIRES_IN_SECONDS`, `STRIPE_SECRET_KEY`,
`STRIPE_WEBHOOK_SECRET`, `WEB_APP_URL` (URL pública del web, ej. `https://app.souvenirs.dev`),
`RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `CORS_ORIGIN` (dominio del web).

Crear `apps/web/.env.local` con `API_URL` apuntando a la URL pública de la API
(ej. `https://api.souvenirs.dev`).

Crear `apps/mobile/.env` con `EXPO_PUBLIC_API_URL` apuntando a la misma URL pública de la API
(no se deployea al VPS — se publica en las stores o vía EAS).

**Antes de la primera migración**, correr una única vez el setup de Row Level Security
(crea el rol `app_runtime` sin privilegios de owner, usado por `DATABASE_URL_RUNTIME`):

```bash
psql "$DATABASE_URL" -v runtime_password='<password-fuerte-para-app_runtime>' \
  -f apps/api/prisma/rls-setup.sql
```

```bash
# Migraciones — NUNCA usar prisma:migrate (migrate dev) en producción
pnpm --filter api prisma:deploy

# Build
pnpm --filter api build
pnpm --filter web build

# Arrancar con pm2
pm2 start ecosystem.config.js
pm2 save
pm2 startup   # seguir la instrucción que imprime para persistir tras reinicios
```

## Nginx (reverse proxy + TLS)

```nginx
server {
    server_name api.souvenirs.dev;
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}

server {
    server_name app.souvenirs.dev;
    location / {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

Luego: `certbot --nginx -d api.souvenirs.dev -d app.souvenirs.dev`.

## Stripe

En el dashboard de Stripe, configurar el webhook endpoint a
`https://api.souvenirs.dev/webhooks/stripe` (eventos `checkout.session.completed`,
`account.updated`) y copiar el signing secret a `STRIPE_WEBHOOK_SECRET`.

## Deploys siguientes

```bash
git pull
pnpm install
pnpm --filter api prisma:deploy
pnpm --filter api build
pnpm --filter web build
pm2 restart ecosystem.config.js
```

## Smoke test post-deploy

```bash
curl -i https://api.souvenirs.dev/auth/login -X POST \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"wrong"}'
# Esperado: 401 (confirma que la API responde y valida credenciales)

curl -i https://app.souvenirs.dev/login
# Esperado: 200, HTML del login
```

Verificar el webhook de Stripe: en el dashboard de Stripe, "Send test webhook" contra el
endpoint configurado y confirmar 200 en los logs (`pm2 logs souvenirs-api`).
