-- CreateEnum
CREATE TYPE "ExchangeRateSource" AS ENUM ('BCV', 'PARALELO');

-- CreateTable
CREATE TABLE "exchange_rates" (
    "id" TEXT NOT NULL,
    "source" "ExchangeRateSource" NOT NULL,
    "rate" DECIMAL(12,4) NOT NULL,
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "exchange_rates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "exchange_rates_source_key" ON "exchange_rates"("source");
