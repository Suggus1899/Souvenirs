import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiFetch } from "@/lib/api-server";
import type { Booking, Invoice } from "@souvenirs/shared";

export default async function DashboardPage() {
  const [bookings, invoices] = await Promise.all([
    apiFetch<Booking[]>("/bookings"),
    apiFetch<Invoice[]>("/invoices"),
  ]);

  const upcomingBookings = bookings.filter((b) => new Date(b.scheduledAt) >= new Date()).length;
  const pendingInvoices = invoices.filter((i) => i.status === "SENT" || i.status === "PARTIAL").length;
  const overdueInvoices = invoices.filter((i) => i.status === "OVERDUE").length;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-heading text-3xl">Inicio</h1>
      <div className="grid gap-4 sm:grid-cols-3">
        <Link href="/bookings">
          <Card className="transition-colors hover:bg-accent/50">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Reservas próximas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-heading text-4xl">{upcomingBookings}</p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/invoices">
          <Card className="transition-colors hover:bg-accent/50">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Facturas pendientes de cobro
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-heading text-4xl">{pendingInvoices}</p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/invoices">
          <Card className="transition-colors hover:bg-accent/50">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Facturas vencidas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-heading text-4xl">{overdueInvoices}</p>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
