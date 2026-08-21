-- Run once per environment (local, staging, prod) BEFORE the first `prisma migrate deploy`
-- that includes RLS policies. Not a tracked Prisma migration: role/password provisioning
-- is an ops concern that varies per host (some managed Postgres providers restrict
-- CREATE ROLE), so it's kept separate and idempotent.
--
-- Usage: psql "$DATABASE_URL" -v runtime_password='replace-me' -f prisma/rls-setup.sql

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'app_runtime') THEN
    EXECUTE format('CREATE ROLE app_runtime WITH LOGIN PASSWORD %L NOSUPERUSER NOCREATEDB NOCREATEROLE', :'runtime_password');
  END IF;
END
$$;

GRANT CONNECT ON DATABASE souvenirs TO app_runtime;
GRANT USAGE ON SCHEMA public TO app_runtime;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_runtime;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO app_runtime;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO app_runtime;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO app_runtime;
