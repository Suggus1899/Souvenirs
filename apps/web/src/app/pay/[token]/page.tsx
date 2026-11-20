import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LogoMark } from "@/components/brand/logo";
import { InvoiceItemsTable } from "@/components/invoices/invoice-items-table";
import { PayOnlineButton } from "@/components/pay/pay-online-button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate, INVOICE_STATUS_LABEL, invoiceNumber } from "@/lib/labels";
import { formatAmount } from "@/lib/money";
import type { PublicInvoice } from "@souvenirs/shared";

export const metadata: Metadata = {
  title: "Tu factura",
  // The URL is a bearer secret: keep it out of search engines and referrers.
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

async function loadInvoice(token: string): Promise<PublicInvoice | null> {
  const res = await fetch(`${process.env.API_URL}/public/invoices/${encodeURIComponent(token)}`, {
    cache: "no-store",
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Public invoice request failed: ${res.status}`);
  return (await res.json()) as PublicInvoice;
}

/** Client-facing page, reached from the invoice email. No account needed. */
export default async function PayPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ payment?: string }>;
}) {
  const [{ token }, { payment }] = await Promise.all([params, searchParams]);
  const invoice = await loadInvoice(token);
  if (!invoice) notFound();

  const settled = invoice.status === "PAID";
  const cancelled = invoice.status === "CANCELLED";

  return (
    <main className="flex min-h-screen flex-col items-center gap-6 bg-background px-4 py-10">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <div>
              <CardTitle className="font-heading text-2xl">{invoice.studioName}</CardTitle>
              <CardDescription>
                Factura {invoiceNumber(invoice.number)} para {invoice.clientName}
              </CardDescription>
            </div>
            <Badge variant={settled ? "default" : cancelled ? "destructive" : "secondary"}>
              {INVOICE_STATUS_LABEL[invoice.status]}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          {payment === "success" && (
            <p role="status" className="rounded-md border border-emerald-600/40 bg-emerald-600/10 px-4 py-2 text-sm">
              ¡Gracias! Recibimos tu pago. El estado se actualizará en unos segundos.
            </p>
          )}
          {payment === "cancelled" && (
            <p role="status" className="rounded-md border border-border px-4 py-2 text-sm">
              El pago no se completó. Puedes intentarlo de nuevo cuando quieras.
            </p>
          )}

          <InvoiceItemsTable items={invoice.items} currency={invoice.currency} totalAmount={invoice.totalAmount} />

          <dl className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
            <div>
              <dt className="text-muted-foreground">Pagado</dt>
              <dd className="font-medium">{formatAmount(invoice.paidAmount, invoice.currency)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Saldo pendiente</dt>
              <dd className="font-heading text-xl">{formatAmount(invoice.balance, invoice.currency)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Vence</dt>
              <dd className="font-medium">{formatDate(invoice.dueDate)}</dd>
            </div>
          </dl>

          {invoice.notes && (
            <section aria-label="Notas del estudio" className="whitespace-pre-line rounded-md bg-muted/50 p-3 text-sm">
              {invoice.notes}
            </section>
          )}

          {invoice.canPayOnline && Number(invoice.balance) > 0 ? (
            <PayOnlineButton token={token} />
          ) : (
            !settled &&
            !cancelled && (
              <p className="text-sm text-muted-foreground">
                Para pagar, usa los datos que te indicó {invoice.studioName}.
              </p>
            )
          )}
        </CardContent>
      </Card>
      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <LogoMark className="size-4 text-primary" />
        Factura gestionada con Souvenirs
      </p>
    </main>
  );
}
