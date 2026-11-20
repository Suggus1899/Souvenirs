# Souvenirs API

Backend NestJS + Prisma + PostgreSQL del SaaS Souvenirs. Multi-tenant: cada estudio
(tenant) solo ve sus datos, garantizado en dos capas (filtro `tenantId` en cada query y
Row Level Security en Postgres).

## Arranque local

```bash
docker compose up -d          # desde la raíz: Postgres 16 + rol app_runtime
cp .env.example .env          # los valores por defecto ya apuntan al compose
pnpm prisma:deploy
pnpm start:dev                # http://localhost:3000 — docs en http://localhost:3000/docs
```

Sin Docker: crea la base y ejecuta una vez
`psql "$DATABASE_URL" -v runtime_password=runtime -f prisma/rls-setup.sql` antes de migrar.

## Tests

```bash
pnpm test        # unitarios (sin base de datos)
pnpm test:e2e    # e2e contra la base de .env (incluye los tests de RLS)
```

## Arquitectura

```
controller  →  service (reglas de negocio)  →  repository (Prisma)
                                                ├─ TenantPrismaService: rol app_runtime + SET LOCAL app.tenant_id (RLS)
                                                └─ PrismaService: rol owner, solo para tareas de sistema
                                                   (crons, webhooks, login) donde aún no hay tenant
```

| Módulo | Responsabilidad |
|---|---|
| `auth` | Registro, login, recuperación de contraseña, JWT, guard de roles |
| `tenants` | Datos y preferencias del estudio, Stripe Connect, suscripción Pro |
| `users` | Equipo (invitaciones, asistentes), push tokens |
| `clients`, `services`, `bookings` | CRUD del negocio (listados con `?take&skip` y filtros) |
| `invoices` | Facturas con número correlativo e ítems, envío, cron de vencidas, CSV |
| `payments` | Pagos manuales y de Stripe (idempotentes por payment intent) |
| `reminders` | Recordatorios push/email programados, despachados por cron |
| `public` | Endpoints sin login para la página de pago del cliente (token no adivinable) |
| `dashboard` | Métricas agregadas del panel |
| `exchange-rate` | Tasa USD/VES (BCV y paralelo), refrescada por cron |
| `webhooks` | Webhook de Stripe (pagos, onboarding, suscripciones) |
| `health` | `GET /health` para monitoreo |

### Crons y múltiples instancias

Los crons corren dentro del proceso. Son seguros con varias instancias: el de vencidas es
un `UPDATE` idempotente, y cada recordatorio se "reclama" con un `UPDATE ... WHERE status =
'PENDING'` atómico antes de enviarse, así que solo una instancia lo envía.

## Variables de entorno

Ver `.env.example`. `JWT_EXPIRES_IN_SECONDS` se expresa en segundos.
