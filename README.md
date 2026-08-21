# Souvenirs

SaaS multi-tenant de gestión de clientes, reservas, facturas y pagos para fotógrafos.
Recuerda automáticamente los pagos pendientes por push y email.

## Estructura del monorepo

```
apps/
  api/      NestJS + Prisma + PostgreSQL — backend
  web/      Next.js (App Router) — panel del fotógrafo
  mobile/   Expo (React Native) — app móvil
packages/
  shared/   Tipos TypeScript compartidos entre web y mobile
```

## Stack

- **Backend**: NestJS, Prisma, PostgreSQL, JWT, Stripe Connect, Resend, Expo push notifications.
- **Web**: Next.js App Router, Tailwind v4, shadcn/ui, next-themes.
- **Mobile**: Expo Router, React Native Paper, react-native-heroicons.
- **Monorepo**: pnpm workspaces.

## Requisitos

Node 20+, pnpm, PostgreSQL 16 corriendo localmente.

## Levantar en desarrollo

```bash
pnpm install
```

### API

```bash
cd apps/api
cp .env.example .env   # completar con tus valores
pnpm prisma:deploy      # o prisma:migrate en desarrollo
pnpm start:dev           # http://localhost:3000
```

### Web

```bash
cd apps/web
cp .env.example .env.local
pnpm dev                 # http://localhost:3001
```

### Mobile

```bash
cd apps/mobile
cp .env.example .env
pnpm start
```

## Tests

```bash
cd apps/api
pnpm test        # unit
pnpm test:e2e     # end-to-end
```

## Deploy

Ver [DEPLOY.md](DEPLOY.md) (VPS + pm2, Nginx, Stripe webhooks).

## Documentación por app

- [apps/api](apps/api) — módulos: auth, clients, services, bookings, invoices, payments, stripe, reminders, notifications, webhooks.
- [apps/web](apps/web) — panel del fotógrafo, autenticación vía cookie httpOnly + proxy BFF.
- [apps/mobile](apps/mobile) — login, reservas próximas, facturas pendientes, notificaciones push.
