import type { Invoice, PaymentMethod } from "@souvenirs/shared";

export const INVOICE_STATUS_LABEL: Record<Invoice["status"], string> = {
  DRAFT: "Borrador",
  SENT: "Enviada",
  PARTIAL: "Parcial",
  PAID: "Pagada",
  OVERDUE: "Vencida",
  CANCELLED: "Cancelada",
};

export const PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> = {
  CASH: "Efectivo (USD)",
  CASH_VES: "Efectivo (Bs)",
  TRANSFER: "Transferencia",
  PAGO_MOVIL: "Pago Móvil",
  ZELLE: "Zelle",
  BINANCE_USDT: "Binance / USDT",
  CARD: "Tarjeta",
  STRIPE: "Stripe",
  OTHER: "Otro",
};

/** Methods a person can register by hand (Stripe payments arrive via webhook). */
export const MANUAL_METHODS = (Object.keys(PAYMENT_METHOD_LABEL) as PaymentMethod[]).filter(
  (m) => m !== "STRIPE",
);

/** Decimal strings from the API, summed in integer cents to avoid float drift. */
export const toCents = (amount: string | number) => Math.round(Number(amount) * 100);
export const fromCents = (cents: number) => (cents / 100).toFixed(2);

export const invoiceNumber = (n: number) => `#${String(n).padStart(4, "0")}`;
