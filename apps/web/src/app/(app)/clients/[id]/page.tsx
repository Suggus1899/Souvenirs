import Link from "next/link";
import { BookingDialog } from "@/components/bookings/booking-dialog";
import { ClientDialog } from "@/components/clients/client-dialog";
import { InvoiceDialog } from "@/components/invoices/invoice-dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { apiFetch } from "@/lib/api-server";
import {
  BOOKING_STATUS_LABEL,
  BOOKING_STATUS_VARIANT,
  formatDate,
  formatDateTime,
  INVOICE_STATUS_LABEL,
  INVOICE_STATUS_VARIANT,
  invoiceNumber,
} from "@/lib/labels";
import { formatAmount, formatMoney, toCents } from "@/lib/money";
import type { Booking, Client, Invoice, Service } from "@souvenirs/shared";

const OPEN = new Set(["SENT", "PARTIAL", "OVERDUE"]);

export default async function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [client, invoices, bookings, services] = await Promise.all([
    apiFetch<Client>(`/clients/${id}`),
    apiFetch<Invoice[]>(`/invoices?clientId=${encodeURIComponent(id)}`),
    apiFetch<Booking[]>(`/bookings?clientId=${encodeURIComponent(id)}`),
    apiFetch<Service[]>("/services"),
  ]);

  // Balance per currency over open invoices: total minus what was already paid.
  const balance = new Map<string, number>();
  for (const inv of invoices.filter((i) => OPEN.has(i.status))) {
    const owed = toCents(inv.totalAmount) - toCents(inv.paidAmount ?? 0);
    balance.set(inv.currency, (balance.get(inv.currency) ?? 0) + owed);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="font-heading text-3xl">{client.name}</h1>
          <p className="text-sm text-muted-foreground">
            {[client.email, client.phone].filter(Boolean).join(" · ") || "Sin datos de contacto"} ·{" "}
            <Link href="/clients" className="underline underline-offset-4">
              Volver a clientes
            </Link>
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <ClientDialog client={client} />
          <BookingDialog clients={[client]} services={services} defaultClientId={client.id} />
          <InvoiceDialog clients={[client]} defaultClientId={client.id} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Saldo pendiente</CardTitle>
          </CardHeader>
          <CardContent>
            {balance.size === 0 ? (
              <p className="font-heading text-3xl">Al día</p>
            ) : (
              [...balance].map(([currency, cents]) => (
                <p key={currency} className="font-heading text-3xl">
                  {formatMoney(cents, currency)}
                </p>
              ))
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Facturas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-heading text-3xl">{invoices.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Sesiones</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-heading text-3xl">{bookings.length}</p>
          </CardContent>
        </Card>
      </div>

      {client.notes && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-medium text-muted-foreground">Notas</CardTitle>
          </CardHeader>
          <CardContent className="whitespace-pre-line text-sm">{client.notes}</CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium text-muted-foreground">Facturas</CardTitle>
        </CardHeader>
        <CardContent>
          {invoices.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">Sin facturas todavía.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>N.º</TableHead>
                  <TableHead>Monto</TableHead>
                  <TableHead className="hidden sm:table-cell">Vencimiento</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-mono text-sm">
                      <Link href={`/invoices/${invoice.id}`} className="underline-offset-4 hover:underline">
                        {invoiceNumber(invoice.number)}
                      </Link>
                    </TableCell>
                    <TableCell>{formatAmount(invoice.totalAmount, invoice.currency)}</TableCell>
                    <TableCell className="hidden text-muted-foreground sm:table-cell">{formatDate(invoice.dueDate)}</TableCell>
                    <TableCell>
                      <Badge variant={INVOICE_STATUS_VARIANT[invoice.status]}>
                        {INVOICE_STATUS_LABEL[invoice.status]}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium text-muted-foreground">Sesiones</CardTitle>
        </CardHeader>
        <CardContent>
          {bookings.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">Sin sesiones todavía.</p>
          ) : (
            <ul className="divide-y divide-border">
              {bookings.map((booking) => (
                <li key={booking.id} className="flex items-center justify-between gap-2 py-3">
                  <div>
                    <p className="font-medium">{booking.title}</p>
                    <p className="text-sm text-muted-foreground">{formatDateTime(booking.scheduledAt)}</p>
                  </div>
                  <Badge variant={BOOKING_STATUS_VARIANT[booking.status]}>
                    {BOOKING_STATUS_LABEL[booking.status]}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
