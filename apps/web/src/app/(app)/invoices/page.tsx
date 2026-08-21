import Link from "next/link";
import { BsEquivalent } from "@/components/invoices/bs-equivalent";
import { InvoiceDialog } from "@/components/invoices/invoice-dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { apiFetch } from "@/lib/api-server";
import type { Client, ExchangeRates, Invoice, InvoiceStatus } from "@souvenirs/shared";

const STATUS_LABEL: Record<InvoiceStatus, string> = {
  DRAFT: "Borrador",
  SENT: "Enviada",
  PARTIAL: "Parcial",
  PAID: "Pagada",
  OVERDUE: "Vencida",
  CANCELLED: "Cancelada",
};

const STATUS_VARIANT: Record<InvoiceStatus, "default" | "secondary" | "destructive" | "outline"> = {
  DRAFT: "outline",
  SENT: "secondary",
  PARTIAL: "secondary",
  PAID: "default",
  OVERDUE: "destructive",
  CANCELLED: "destructive",
};

export default async function InvoicesPage() {
  const [invoices, clients, rates] = await Promise.all([
    apiFetch<Invoice[]>("/invoices"),
    apiFetch<Client[]>("/clients"),
    apiFetch<ExchangeRates>("/exchange-rate"),
  ]);
  const clientById = new Map(clients.map((c) => [c.id, c.name]));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-3xl">Facturas</h1>
        <InvoiceDialog clients={clients} />
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium text-muted-foreground">
            {invoices.length} {invoices.length === 1 ? "factura" : "facturas"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {invoices.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Todavía no generaste ninguna factura.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Monto</TableHead>
                  <TableHead>Vencimiento</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((invoice) => (
                  <TableRow key={invoice.id} className="cursor-pointer">
                    <TableCell className="font-medium">
                      <Link href={`/invoices/${invoice.id}`} className="block">
                        {clientById.get(invoice.clientId) ?? "—"}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      <Link href={`/invoices/${invoice.id}`} className="block">
                        {invoice.totalAmount} {invoice.currency}
                        <BsEquivalent
                          amount={invoice.totalAmount}
                          currency={invoice.currency}
                          rates={rates}
                        />
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      <Link href={`/invoices/${invoice.id}`} className="block">
                        {invoice.dueDate
                          ? new Date(invoice.dueDate).toLocaleDateString("es-AR")
                          : "—"}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Link href={`/invoices/${invoice.id}`} className="block">
                        <Badge variant={STATUS_VARIANT[invoice.status]}>
                          {STATUS_LABEL[invoice.status]}
                        </Badge>
                      </Link>
                    </TableCell>
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
