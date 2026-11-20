import { Prisma } from '@prisma/client';

interface ExportInvoice {
  number: number;
  clientId: string;
  status: string;
  currency: string;
  totalAmount: Prisma.Decimal;
  createdAt: Date;
  dueDate: Date | null;
  payments: { amount: Prisma.Decimal }[];
}

/**
 * RFC 4180 quoting. Cells starting with = + - @ are prefixed with ' so a
 * spreadsheet opening the export can't run a client name as a formula.
 */
function cell(value: string): string {
  const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return /[",\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

const day = (d: Date | null) => (d ? d.toISOString().slice(0, 10) : '');

export function invoicesToCsv(
  invoices: ExportInvoice[],
  clients: { id: string; name: string }[],
): string {
  const clientNames = new Map(clients.map((c) => [c.id, c.name]));
  const header = [
    'numero',
    'cliente',
    'estado',
    'moneda',
    'total',
    'pagado',
    'saldo',
    'emitida',
    'vence',
  ];
  const rows = invoices.map((inv) => {
    const paid = inv.payments.reduce(
      (sum, p) => sum.plus(p.amount),
      new Prisma.Decimal(0),
    );
    return [
      String(inv.number),
      clientNames.get(inv.clientId) ?? '',
      inv.status,
      inv.currency,
      inv.totalAmount.toFixed(2),
      paid.toFixed(2),
      inv.totalAmount.minus(paid).toFixed(2),
      day(inv.createdAt),
      day(inv.dueDate),
    ];
  });
  return [header, ...rows].map((r) => r.map(cell).join(',')).join('\r\n');
}
