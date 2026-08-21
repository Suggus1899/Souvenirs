import Link from "next/link";
import { BsEquivalent } from "@/components/invoices/bs-equivalent";
import { InvoiceActions } from "@/components/invoices/invoice-actions";
import { InvoiceDialog } from "@/components/invoices/invoice-dialog";
import { RegisterPaymentDialog } from "@/components/invoices/register-payment-dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { apiFetch } from "@/lib/api-server";
import type { Client, ExchangeRates, Invoice, InvoiceStatus, PaymentMethod } from "@souvenirs/shared";

const STATUS_LABEL: Record<InvoiceStatus, string> = {
  DRAFT: "Borrador",
  SENT: "Enviada",
  PARTIAL: "Parcial",
  PAID: "Pagada",
  OVERDUE: "Vencida",
  CANCELLED: "Cancelada",
};

const METHOD_LABEL: Record<PaymentMethod, string> = {
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

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const invoice = await apiFetch<Invoice>(`/invoices/${id}`);
  const client = await apiFetch<Client>(`/clients/${invoice.clientId}`);
  const rates = await apiFetch<ExchangeRates>("/exchange-rate");
  const payments = invoice.payments ?? [];
  const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount), 0);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl">Factura de {client.name}</h1>
          <p className="text-sm text-muted-foreground">
            <Link href="/invoices" className="underline underline-offset-4">
              Volver a facturas
            </Link>
          </p>
        </div>
        {invoice.status === "DRAFT" && <InvoiceDialog invoice={invoice} clients={[client]} />}
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="font-heading text-2xl">
              {invoice.totalAmount} {invoice.currency}
            </CardTitle>
            <BsEquivalent amount={invoice.totalAmount} currency={invoice.currency} rates={rates} />
          </div>
          <Badge>{STATUS_LABEL[invoice.status]}</Badge>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <dl className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
            <div>
              <dt className="text-muted-foreground">Pagado</dt>
              <dd className="font-medium">
                {totalPaid} / {invoice.totalAmount} {invoice.currency}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Vencimiento</dt>
              <dd className="font-medium">
                {invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString("es-AR") : "—"}
              </dd>
            </div>
            {invoice.paymentLinkUrl && (
              <div>
                <dt className="text-muted-foreground">Link de pago</dt>
                <dd>
                  <a
                    href={invoice.paymentLinkUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="font-medium underline underline-offset-4"
                  >
                    Ver link
                  </a>
                </dd>
              </div>
            )}
          </dl>
          <InvoiceActions invoiceId={invoice.id} status={invoice.status} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base font-medium text-muted-foreground">Pagos</CardTitle>
          {invoice.status !== "CANCELLED" && <RegisterPaymentDialog invoiceId={invoice.id} />}
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
                  <TableHead>Fecha</TableHead>
                  <TableHead>Método</TableHead>
                  <TableHead>Monto</TableHead>
                  <TableHead>Notas</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>{new Date(payment.paidAt).toLocaleDateString("es-AR")}</TableCell>
                    <TableCell>{METHOD_LABEL[payment.method]}</TableCell>
                    <TableCell>
                      {payment.amount} {invoice.currency}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{payment.notes ?? "—"}</TableCell>
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
