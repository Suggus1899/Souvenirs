import { BookingCalendar } from "@/components/bookings/booking-calendar";
import { BookingDialog } from "@/components/bookings/booking-dialog";
import { FilterLinks } from "@/components/filter-links";
import { ConfirmDeleteButton } from "@/components/confirm-delete-button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { apiFetch } from "@/lib/api-server";
import { BOOKING_STATUS_LABEL, BOOKING_STATUS_VARIANT, dayKey, formatDateTime } from "@/lib/labels";
import type { Booking, Client, Service } from "@souvenirs/shared";

const VIEWS = [
  { label: "Lista" },
  { value: "calendar", label: "Calendario" },
];

function currentMonth(): string {
  return dayKey(new Date()).slice(0, 7);
}

export default async function BookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; month?: string }>;
}) {
  const params = await searchParams;
  const isCalendar = params.view === "calendar";
  const month = /^\d{4}-(0[1-9]|1[0-2])$/.test(params.month ?? "") ? params.month! : currentMonth();

  // Calendar: just that month (padded a day each side for time zones). List: upcoming first.
  const [y, m] = month.split("-").map(Number);
  const from = new Date(Date.UTC(y, m - 1, 1) - 86_400_000).toISOString();
  const to = new Date(Date.UTC(y, m, 1) + 86_400_000).toISOString();
  const bookingsPath = isCalendar ? `/bookings?from=${from}&to=${to}&take=200` : "/bookings";

  const [bookings, clients, services] = await Promise.all([
    apiFetch<Booking[]>(bookingsPath),
    apiFetch<Client[]>("/clients?take=200"),
    apiFetch<Service[]>("/services"),
  ]);
  const clientById = new Map(clients.map((c) => [c.id, c.name]));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-3xl">Reservas</h1>
        <BookingDialog clients={clients} services={services} />
      </div>
      <FilterLinks basePath="/bookings" param="view" current={params.view} options={VIEWS} />
      {isCalendar ? (
        <BookingCalendar month={month} bookings={bookings} clientNames={clientById} />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-medium text-muted-foreground">
              {bookings.length} {bookings.length === 1 ? "reserva" : "reservas"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {bookings.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Todavía no has agregado ninguna reserva.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Título</TableHead>
                    <TableHead className="hidden xl:table-cell">Cliente</TableHead>
                    <TableHead className="hidden lg:table-cell">Fecha</TableHead>
                    <TableHead className="hidden sm:table-cell">Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bookings.map((booking) => (
                    <TableRow key={booking.id}>
                      <TableCell className="font-medium whitespace-normal">
                        {booking.title}
                        <span className="block text-xs font-normal text-muted-foreground xl:hidden">
                          {clientById.get(booking.clientId) ?? "—"}
                          <span className="lg:hidden"> · {formatDateTime(booking.scheduledAt)}</span>
                        </span>
                        <Badge variant={BOOKING_STATUS_VARIANT[booking.status]} className="mt-1 sm:hidden">
                          {BOOKING_STATUS_LABEL[booking.status]}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden text-muted-foreground xl:table-cell">
                        {clientById.get(booking.clientId) ?? "—"}
                      </TableCell>
                      <TableCell className="hidden text-muted-foreground lg:table-cell">
                        {formatDateTime(booking.scheduledAt)}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <Badge variant={BOOKING_STATUS_VARIANT[booking.status]}>
                          {BOOKING_STATUS_LABEL[booking.status]}
                        </Badge>
                      </TableCell>
                      <TableCell className="flex justify-end gap-1">
                        <BookingDialog booking={booking} clients={clients} services={services} />
                        <ConfirmDeleteButton
                          path={`/bookings/${booking.id}`}
                          title={`¿Eliminar "${booking.title}"?`}
                          description="Esta acción no se puede deshacer."
                          successMessage="Reserva eliminada"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
