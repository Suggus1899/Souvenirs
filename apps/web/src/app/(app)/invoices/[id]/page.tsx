import { PrinterIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { BsEquivalent } from "@/components/invoices/bs-equivalent";
import { CopyPayLinkButton } from "@/components/invoices/copy-pay-link-button";
import { InvoiceActions } from "@/components/invoices/invoice-actions";
import { InvoiceDialog } from "@/components/invoices/invoice-dialog";
import { InvoiceItemsTable } from "@/components/invoices/invoice-items-table";
import { RegisterPaymentDialog } from "@/components/invoices/register-payment-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { apiFetch } from "@/lib/api-server";
import {
  formatDate,
  INVOICE_STATUS_LABEL,
  INVOICE_STATUS_VARIANT,
  invoiceNumber,
  PAYMENT_METHOD_LABEL,
} from "@/lib/labels";
import { formatAmount, formatMoney, toCents } from "@/lib/money";
import type { Client, ExchangeRates, Invoice } from "@souvenirs/shared";

export default async function InvoiceDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ payment?: string }>;
}) {
  const [{ id }, { payment }] = await Promise.all([params, searchParams]);
  const [invoice, rates] = await Promise.all([
    apiFetch<Invoice>(`/invoices/${id}`),
    apiFetch<ExchangeRates>("/exchange-rate"),
  ]);
  const client = await apiFetch<Client>(`/clients/${invoice.clientId}`);
  const payments = invoice.payments ?? [];
  const paidCents = payments.reduce((sum, p) => sum + toCents(p.amount), 0);
  const balanceCents = toCents(invoice.totalAmount) - paidCents;
  const isOpen = invoice.status !== "PAID" && invoice.status !== "CANCELLED";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-heading text-3xl">
            Factura {invoiceNumber(invoice.number)}
          </h1>
          <p className="text-sm text-muted-foreground">
            Para{" "}
            <Link href={`/clients/${client.id}`} className="underline underline-offset-4">
              {client.name}
            </Link>{" "}
            ·{" "}
            <Link href="/invoices" className="underline underline-offset-4">
              Volver a facturas
            </Link>
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" asChild>
            <Link href={`/invoices/${invoice.id}/print`}>
              <PrinterIcon className="size-4" />
              PDF
            </Link>
          </Button>
          {invoice.status === "DRAFT" && <InvoiceDialog invoice={invoice} clients={[client]} />}
        </div>
      </div>

      {payment === "success" && (
        <p role="status" className="rounded-md border border-emerald-600/40 bg-emerald-600/10 px-4 py-2 text-sm">
          Stripe confirmó el pago. Puede tardar unos segundos en aparecer abajo.
        </p>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="font-heading text-2xl">
              {formatAmount(invoice.totalAmount, invoice.currency)}
            </CardTitle>
            <BsEquivalent amount={invoice.totalAmount} currency={invoice.currency} rates={rates} />
          </div>
          <Badge variant={INVOICE_STATUS_VARIANT[invoice.status]}>
            {INVOICE_STATUS_LABEL[invoice.status]}
          </Badge>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <dl className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
            <div>
              <dt className="text-muted-foreground">Pagado</dt>
              <dd className="font-medium">{formatMoney(paidCents, invoice.currency)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Saldo</dt>
              <dd className="font-medium">{formatMoney(Math.max(balanceCents, 0), invoice.currency)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Vencimiento</dt>
              <dd className="font-medium">{formatDate(invoice.dueDate)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Enviada</dt>
              <dd className="font-medium">{formatDate(invoice.sentAt)}</dd>
            </div>
          </dl>
          <InvoiceItemsTable
            items={invoice.items ?? []}
            currency={invoice.currency}
            totalAmount={invoice.totalAmount}
          />
          {invoice.notes && (
            <p className="whitespace-pre-line rounded-md bg-muted/50 p-3 text-sm">{invoice.notes}</p>
          )}
          <div className="flex flex-wrap gap-2">
            <InvoiceActions invoiceId={invoice.id} status={invoice.status} />
            {invoice.status !== "DRAFT" && <CopyPayLinkButton publicToken={invoice.publicToken} />}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base font-medium text-muted-foreground">Pagos</CardTitle>
          {isOpen && balanceCents > 0 && (
            <RegisterPaymentDialog
              invoiceId={invoice.id}
              maxAmount={balanceCents / 100}
              currency={invoice.currency}
            />
          )}
        </CardHeader>
        <CardContent>
          {payments.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Todavía no se registraron pagos.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="hidden sm:table-cell">Fecha</TableHead>
                  <TableHead>Método</TableHead>
                  <TableHead>Monto</TableHead>
                  <TableHead className="hidden md:table-cell">Notas</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="hidden sm:table-cell">{formatDate(p.paidAt)}</TableCell>
                    <TableCell className="whitespace-normal">
                      {PAYMENT_METHOD_LABEL[p.method]}
                      <span className="block text-xs text-muted-foreground sm:hidden">{formatDate(p.paidAt)}</span>
                    </TableCell>
                    <TableCell>{formatAmount(p.amount, invoice.currency)}</TableCell>
                    <TableCell className="hidden whitespace-normal text-muted-foreground md:table-cell">{p.notes ?? "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
