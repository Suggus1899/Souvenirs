import { InvoiceStatus, Prisma } from '@prisma/client';

/** An invoice is overdue once its whole due day has passed. */
const OVERDUE_GRACE_MS = 24 * 60 * 60 * 1000;

export const OPEN_INVOICE_STATUSES: InvoiceStatus[] = [
  InvoiceStatus.SENT,
  InvoiceStatus.PARTIAL,
  InvoiceStatus.OVERDUE,
];

export function overdueCutoff(now: Date): Date {
  return new Date(now.getTime() - OVERDUE_GRACE_MS);
}

export function isPastDue(dueDate: Date | null, now: Date): boolean {
  return dueDate !== null && dueDate < overdueCutoff(now);
}

/** Single source of truth for the status an invoice takes after its paid total changes. */
export function statusAfterPayment(
  invoice: { totalAmount: Prisma.Decimal; dueDate: Date | null },
  totalPaid: Prisma.Decimal,
  now: Date = new Date(),
): InvoiceStatus {
  if (totalPaid.gte(invoice.totalAmount)) return InvoiceStatus.PAID;
  if (isPastDue(invoice.dueDate, now)) return InvoiceStatus.OVERDUE;
  return totalPaid.gt(0) ? InvoiceStatus.PARTIAL : InvoiceStatus.SENT;
}

export function canSend(status: InvoiceStatus) {
  return status === InvoiceStatus.DRAFT;
}

export function canEdit(status: InvoiceStatus) {
  return status === InvoiceStatus.DRAFT;
}

export function canCancel(status: InvoiceStatus) {
  return status !== InvoiceStatus.PAID && status !== InvoiceStatus.CANCELLED;
}

export function isOpenForPayment(status: InvoiceStatus) {
  return status !== InvoiceStatus.PAID && status !== InvoiceStatus.CANCELLED;
}
