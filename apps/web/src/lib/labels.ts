import type { BookingStatus, InvoiceStatus, PaymentMethod } from "@souvenirs/shared";

type BadgeVariant = "default" | "secondary" | "destructive" | "outline";

export const INVOICE_STATUS_LABEL: Record<InvoiceStatus, string> = {
  DRAFT: "Borrador",
  SENT: "Enviada",
  PARTIAL: "Parcial",
  PAID: "Pagada",
  OVERDUE: "Vencida",
  CANCELLED: "Cancelada",
};

export const INVOICE_STATUS_VARIANT: Record<InvoiceStatus, BadgeVariant> = {
  DRAFT: "outline",
  SENT: "secondary",
  PARTIAL: "secondary",
  PAID: "default",
  OVERDUE: "destructive",
  CANCELLED: "destructive",
};

export const BOOKING_STATUS_LABEL: Record<BookingStatus, string> = {
  PENDING: "Pendiente",
  CONFIRMED: "Confirmada",
  COMPLETED: "Completada",
  CANCELLED: "Cancelada",
};

export const BOOKING_STATUS_VARIANT: Record<BookingStatus, BadgeVariant> = {
  PENDING: "outline",
  CONFIRMED: "default",
  COMPLETED: "secondary",
  CANCELLED: "destructive",
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

export const LOCALE = "es-VE";
/**
 * Server Components render on the server, whose clock is usually UTC, so times
 * are formatted in the studio's zone explicitly instead of the machine's.
 */
export const TIME_ZONE = process.env.NEXT_PUBLIC_TIME_ZONE ?? "America/Caracas";

/** yyyy-mm-dd of an instant, as a calendar day in TIME_ZONE. */
export function dayKey(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TIME_ZONE }).format(date);
}

export function formatDate(iso: string | null | undefined): string {
  return iso ? new Date(iso).toLocaleDateString(LOCALE, { timeZone: "UTC" }) : "—";
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString(LOCALE, {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: TIME_ZONE,
  });
}

export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(LOCALE, { timeStyle: "short", timeZone: TIME_ZONE });
}

/** "#0007" style, as printed on the invoice. */
export function invoiceNumber(n: number): string {
  return `#${String(n).padStart(4, "0")}`;
}
