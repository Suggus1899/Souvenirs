import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiFetch } from "@/lib/api-server";
import { BOOKING_STATUS_LABEL, BOOKING_STATUS_VARIANT, formatDateTime } from "@/lib/labels";
import { formatAmount } from "@/lib/money";
import type { DashboardSummary, MoneyByCurrency } from "@souvenirs/shared";

function MoneyList({ rows }: { rows: MoneyByCurrency[] }) {
  if (rows.length === 0) return <p className="font-heading text-4xl">0</p>;
  return (
    <ul className="flex flex-col gap-1">
      {rows.map((row) => (
        <li key={row.currency} className="font-heading text-3xl">
          {formatAmount(row.amount, row.currency)}
        </li>
      ))}
    </ul>
  );
}

function StatCard({ title, href, children }: { title: string; href: string; children: React.ReactNode }) {
  return (
    <Link href={href}>
      <Card className="h-full transition-colors hover:bg-accent/50">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        </CardHeader>
        <CardContent>{children}</CardContent>
      </Card>
    </Link>
  );
}

export default async function DashboardPage() {
  const summary = await apiFetch<DashboardSummary>("/dashboard/summary");

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-heading text-3xl">Inicio</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Cobrado este mes" href="/invoices?status=PAID">
          <MoneyList rows={summary.collectedThisMonth} />
        </StatCard>
        <StatCard title="Por cobrar" href="/invoices">
          <MoneyList rows={summary.outstanding} />
          <p className="mt-1 text-xs text-muted-foreground">
            {summary.openInvoices} {summary.openInvoices === 1 ? "factura abierta" : "facturas abiertas"}
          </p>
        </StatCard>
        <StatCard title="Facturas vencidas" href="/invoices?status=OVERDUE">
          <p className={`font-heading text-4xl ${summary.overdueInvoices > 0 ? "text-destructive" : ""}`}>
            {summary.overdueInvoices}
          </p>
        </StatCard>
        <StatCard title="Sesiones en los próximos 7 días" href="/bookings?view=calendar">
          <p className="font-heading text-4xl">{summary.bookingsThisWeek}</p>
        </StatCard>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium text-muted-foreground">Próximas sesiones</CardTitle>
        </CardHeader>
        <CardContent>
          {summary.nextBookings.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">No tienes sesiones agendadas.</p>
          ) : (
            <ul className="divide-y divide-border">
              {summary.nextBookings.map((booking) => (
                <li key={booking.id} className="flex items-center justify-between gap-2 py-3">
                  <div>
                    <p className="font-medium">{booking.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {booking.clientName} · {formatDateTime(booking.scheduledAt)}
                    </p>
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
