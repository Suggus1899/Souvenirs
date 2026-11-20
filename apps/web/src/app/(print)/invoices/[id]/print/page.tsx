import Link from "next/link";
import { InvoiceItemsTable } from "@/components/invoices/invoice-items-table";
import { PrintButton } from "@/components/print-button";
import { apiFetch } from "@/lib/api-server";
import { formatDate, INVOICE_STATUS_LABEL, invoiceNumber } from "@/lib/labels";
import { formatMoney, toCents } from "@/lib/money";
import type { Client, Invoice, Tenant } from "@souvenirs/shared";

/**
 * Print-ready invoice, outside the app shell. "Guardar como PDF" in the browser's
 * print dialog produces the PDF — no server-side PDF library needed.
 */
export default async function InvoicePrintPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [invoice, tenant] = await Promise.all([
    apiFetch<Invoice>(`/invoices/${id}`),
    apiFetch<Tenant>("/tenants/me"),
  ]);
  const client = await apiFetch<Client>(`/clients/${invoice.clientId}`);
  const paidCents = (invoice.payments ?? []).reduce((sum, p) => sum + toCents(p.amount), 0);

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-8 bg-background p-4 text-foreground sm:p-8 print:p-0">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link href={`/invoices/${invoice.id}`} className="text-sm underline underline-offset-4">
          Volver a la factura
        </Link>
        <PrintButton />
      </div>

      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="font-heading text-2xl">{tenant.name}</p>
          <p className="text-sm text-muted-foreground">Factura {invoiceNumber(invoice.number)}</p>
        </div>
        <dl className="text-sm sm:text-right">
          <div>
            <dt className="inline text-muted-foreground">Emitida: </dt>
            <dd className="inline">{formatDate(invoice.sentAt ?? invoice.createdAt)}</dd>
          </div>
          <div>
            <dt className="inline text-muted-foreground">Vence: </dt>
            <dd className="inline">{formatDate(invoice.dueDate)}</dd>
          </div>
          <div>
            <dt className="inline text-muted-foreground">Estado: </dt>
            <dd className="inline">{INVOICE_STATUS_LABEL[invoice.status]}</dd>
          </div>
        </dl>
      </header>

      <section aria-label="Cliente" className="text-sm">
        <p className="text-muted-foreground">Facturar a</p>
        <p className="font-medium">{client.name}</p>
        {client.email && <p>{client.email}</p>}
        {client.phone && <p>{client.phone}</p>}
      </section>

      <InvoiceItemsTable
        items={invoice.items ?? []}
        currency={invoice.currency}
        totalAmount={invoice.totalAmount}
      />

      <dl className="grid w-full grid-cols-2 gap-1 text-sm sm:ml-auto sm:w-64">
        <dt className="text-muted-foreground">Pagado</dt>
        <dd className="text-right">{formatMoney(paidCents, invoice.currency)}</dd>
        <dt className="font-medium">Saldo</dt>
        <dd className="text-right font-medium">
          {formatMoney(Math.max(toCents(invoice.totalAmount) - paidCents, 0), invoice.currency)}
        </dd>
      </dl>

      {invoice.notes && <p className="whitespace-pre-line text-sm">{invoice.notes}</p>}
    </main>
  );
}
