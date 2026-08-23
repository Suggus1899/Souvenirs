-- Defense in depth: enforce positive money/duration values at the DB level,
-- in case a caller bypasses the DTO validation layer.

ALTER TABLE "services" ADD CONSTRAINT "services_basePrice_positive" CHECK ("basePrice" > 0);
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_durationMinutes_positive" CHECK ("durationMinutes" > 0);
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_totalAmount_positive" CHECK ("totalAmount" > 0);
ALTER TABLE "payments" ADD CONSTRAINT "payments_amount_positive" CHECK ("amount" > 0);
