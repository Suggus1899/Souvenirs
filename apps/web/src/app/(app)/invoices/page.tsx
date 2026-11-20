import { ArrowDownTrayIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { FilterLinks } from "@/components/filter-links";
import { BsEquivalent } from "@/components/invoices/bs-equivalent";
import { InvoiceDialog } from "@/components/invoices/invoice-dialog";
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
} from "@/lib/labels";
import { formatAmount } from "@/lib/money";
import type { Client, ExchangeRates, Invoice, InvoiceStatus } from "@souvenirs/shared";

const FILTERS: { value?: InvoiceStatus; label: string }[] = [
  { label: "Todas" },
  { value: "DRAFT", label: "Borradores" },
  { value: "SENT", label: "Enviadas" },
  { value: "PARTIAL", label: "Parciales" },
  { value: "OVERDUE", label: "Vencidas" },
  { value: "PAID", label: "Pagadas" },
];

export default async function InvoicesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const validStatus = FILTERS.some((f) => f.value === status) ? status : undefined;
  const query = validStatus ? `?status=${validStatus}` : "";

  const [invoices, clients, rates] = await Promise.all([
    apiFetch<Invoice[]>(`/invoices${query}`),
    apiFetch<Client[]>("/clients?take=200"),
    apiFetch<ExchangeRates>("/exchange-rate"),
  ]);
  const clientById = new Map(clients.map((c) => [c.id, c.name]));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="font-heading text-3xl">Facturas</h1>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            {/* Route handler download: a plain <a>, not a client-side navigation. */}
            <a href={`/api/proxy/invoices/export${query}`} download>
              <ArrowDownTrayIcon className="size-4" />
              Exportar CSV
            </a>
          </Button>
          <InvoiceDialog clients={clients} />
        </div>
      </div>
      <FilterLinks basePath="/invoices" param="status" current={validStatus} options={FILTERS} />
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium text-muted-foreground">
            {invoices.length} {invoices.length === 1 ? "factura" : "facturas"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {invoices.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              {validStatus ? "No hay facturas con este estado." : "Todavía no has creado ninguna factura."}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>N.º</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Monto</TableHead>
                  <TableHead>Vencimiento</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((invoice) => {
                  const href = `/invoices/${invoice.id}`;
                  return (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-mono text-sm">
                        <Link href={href} className="block">
                          {invoiceNumber(invoice.number)}
                        </Link>
                      </TableCell>
                      <TableCell className="font-medium">
                        <Link href={href} className="block">
                          {clientById.get(invoice.clientId) ?? "—"}
                        </Link>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        <Link href={href} className="block">
                          {formatAmount(invoice.totalAmount, invoice.currency)}
                          <BsEquivalent amount={invoice.totalAmount} currency={invoice.currency} rates={rates} />
                        </Link>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        <Link href={href} className="block">
                          {formatDate(invoice.dueDate)}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Link href={href} className="block">
                          <Badge variant={INVOICE_STATUS_VARIANT[invoice.status]}>
                            {INVOICE_STATUS_LABEL[invoice.status]}
                          </Badge>
                        </Link>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
