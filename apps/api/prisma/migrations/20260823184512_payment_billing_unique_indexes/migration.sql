-- CreateIndex
CREATE UNIQUE INDEX "tenants_stripeAccountId_key" ON "tenants"("stripeAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "tenants_stripeCustomerId_key" ON "tenants"("stripeCustomerId");

-- CreateIndex
CREATE UNIQUE INDEX "payments_stripePaymentIntentId_key" ON "payments"("stripePaymentIntentId");
