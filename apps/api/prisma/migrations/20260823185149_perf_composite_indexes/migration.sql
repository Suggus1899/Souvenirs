-- Replace single-column tenant indexes with composite (tenantId, orderByColumn)
-- indexes matching each module's default findAll ORDER BY.

DROP INDEX "clients_tenantId_idx";
CREATE INDEX "clients_tenantId_createdAt_idx" ON "clients"("tenantId", "createdAt");

DROP INDEX "bookings_tenantId_idx";
DROP INDEX "bookings_scheduledAt_idx";
CREATE INDEX "bookings_tenantId_scheduledAt_idx" ON "bookings"("tenantId", "scheduledAt");

DROP INDEX "invoices_tenantId_idx";
CREATE INDEX "invoices_tenantId_createdAt_idx" ON "invoices"("tenantId", "createdAt");

DROP INDEX "payments_tenantId_idx";
CREATE INDEX "payments_tenantId_paidAt_idx" ON "payments"("tenantId", "paidAt");

-- Reorder reminders index to match the findDuePending filter (status first, then remindAt range).
DROP INDEX "reminders_remindAt_status_idx";
CREATE INDEX "reminders_status_remindAt_idx" ON "reminders"("status", "remindAt");
