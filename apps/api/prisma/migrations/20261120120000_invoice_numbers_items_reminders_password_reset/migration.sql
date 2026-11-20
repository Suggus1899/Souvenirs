-- Invoice numbers, line items, public payment tokens, configurable reminders and
-- password-reset / invitation tokens.

-- CreateEnum
CREATE TYPE "ReminderRecipient" AS ENUM ('OWNER', 'CLIENT');

-- Invoices: add columns nullable first, backfill existing rows, then enforce NOT NULL.
ALTER TABLE "invoices" ADD COLUMN "notes" TEXT,
ADD COLUMN "number" INTEGER,
ADD COLUMN "publicToken" TEXT,
ADD COLUMN "sentAt" TIMESTAMP(3);

UPDATE "invoices" i SET "number" = numbered.rn
FROM (
  SELECT "id", ROW_NUMBER() OVER (PARTITION BY "tenantId" ORDER BY "createdAt", "id") AS rn
  FROM "invoices"
) numbered
WHERE i."id" = numbered."id";

-- 64 hex chars from two random UUIDs (gen_random_uuid is built in since PG 13).
UPDATE "invoices"
SET "publicToken" = replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '');

UPDATE "invoices" SET "sentAt" = "createdAt" WHERE "status" <> 'DRAFT';

ALTER TABLE "invoices" ALTER COLUMN "number" SET NOT NULL,
ALTER COLUMN "publicToken" SET NOT NULL;

ALTER TABLE "invoices" ADD CONSTRAINT "invoices_number_positive" CHECK ("number" > 0);

-- Reminders
ALTER TABLE "reminders" ADD COLUMN "recipient" "ReminderRecipient" NOT NULL DEFAULT 'OWNER',
ADD COLUMN "recipientEmail" TEXT;

-- Tenants: reminder preferences
ALTER TABLE "tenants" ADD COLUMN "clientRemindersEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "reminderOffsetsDays" INTEGER[] NOT NULL DEFAULT ARRAY[-3, 0, 3]::INTEGER[];

-- CreateTable
CREATE TABLE "invoice_items" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPrice" DECIMAL(10,2) NOT NULL,
    "position" INTEGER NOT NULL,

    CONSTRAINT "invoice_items_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "invoice_items_quantity_positive" CHECK ("quantity" > 0),
    CONSTRAINT "invoice_items_unitPrice_positive" CHECK ("unitPrice" > 0)
);

-- CreateTable
CREATE TABLE "password_reset_tokens" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_reset_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "invoice_items_invoiceId_idx" ON "invoice_items"("invoiceId");
CREATE UNIQUE INDEX "password_reset_tokens_tokenHash_key" ON "password_reset_tokens"("tokenHash");
CREATE INDEX "password_reset_tokens_userId_idx" ON "password_reset_tokens"("userId");
CREATE UNIQUE INDEX "invoices_publicToken_key" ON "invoices"("publicToken");
CREATE UNIQUE INDEX "invoices_tenantId_number_key" ON "invoices"("tenantId", "number");

-- AddForeignKey
ALTER TABLE "invoice_items" ADD CONSTRAINT "invoice_items_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "invoice_items" ADD CONSTRAINT "invoice_items_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Row Level Security
GRANT SELECT, INSERT, UPDATE, DELETE ON "invoice_items" TO app_runtime;
ALTER TABLE "invoice_items" ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "invoice_items"
  USING ("tenantId" = current_setting('app.tenant_id', true));

-- Reset tokens are only ever touched by the owner connection (pre-auth flows). RLS with no
-- policy denies the app_runtime role every row, so a bug in tenant-scoped code can't leak them.
ALTER TABLE "password_reset_tokens" ENABLE ROW LEVEL SECURITY;
