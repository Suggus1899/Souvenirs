/*
  Warnings:

  - Added the required column `tenantId` to the `push_tokens` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "push_tokens" ADD COLUMN     "tenantId" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "push_tokens_tenantId_idx" ON "push_tokens"("tenantId");

-- AddForeignKey
ALTER TABLE "push_tokens" ADD CONSTRAINT "push_tokens_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Row Level Security
-- The "app_runtime" role must already exist (see prisma/rls-setup.sql, run once per
-- environment). RLS policies never apply to the table owner, so all runtime app
-- queries must connect as app_runtime (DATABASE_URL_RUNTIME), never as the owner.

GRANT SELECT, INSERT, UPDATE, DELETE ON
  "tenants", "users", "clients", "services", "bookings",
  "invoices", "payments", "reminders", "push_tokens"
TO app_runtime;

ALTER TABLE "tenants" ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "tenants"
  USING ("id" = current_setting('app.tenant_id', true));

ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "users"
  USING ("tenantId" = current_setting('app.tenant_id', true));

ALTER TABLE "clients" ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "clients"
  USING ("tenantId" = current_setting('app.tenant_id', true));

ALTER TABLE "services" ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "services"
  USING ("tenantId" = current_setting('app.tenant_id', true));

ALTER TABLE "bookings" ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "bookings"
  USING ("tenantId" = current_setting('app.tenant_id', true));

ALTER TABLE "invoices" ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "invoices"
  USING ("tenantId" = current_setting('app.tenant_id', true));

ALTER TABLE "payments" ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "payments"
  USING ("tenantId" = current_setting('app.tenant_id', true));

ALTER TABLE "reminders" ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "reminders"
  USING ("tenantId" = current_setting('app.tenant_id', true));

ALTER TABLE "push_tokens" ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "push_tokens"
  USING ("tenantId" = current_setting('app.tenant_id', true));
