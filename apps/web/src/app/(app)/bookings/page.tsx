import { BookingDialog } from "@/components/bookings/booking-dialog";
import { ConfirmDeleteButton } from "@/components/confirm-delete-button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { apiFetch } from "@/lib/api-server";
import type { Booking, BookingStatus, Client, Service } from "@souvenirs/shared";

const STATUS_LABEL: Record<BookingStatus, string> = {
  PENDING: "Pendiente",
  CONFIRMED: "Confirmada",
  COMPLETED: "Completada",
  CANCELLED: "Cancelada",
};

const STATUS_VARIANT: Record<BookingStatus, "default" | "secondary" | "destructive" | "outline"> = {
  PENDING: "outline",
  CONFIRMED: "default",
  COMPLETED: "secondary",
  CANCELLED: "destructive",
};

export default async function BookingsPage() {
  const [bookings, clients, services] = await Promise.all([
    apiFetch<Booking[]>("/bookings"),
    apiFetch<Client[]>("/clients"),
    apiFetch<Service[]>("/services"),
  ]);
  const clientById = new Map(clients.map((c) => [c.id, c.name]));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-3xl">Reservas</h1>
        <BookingDialog clients={clients} services={services} />
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium text-muted-foreground">
            {bookings.length} {bookings.length === 1 ? "reserva" : "reservas"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {bookings.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Todavía no cargaste ninguna reserva.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Título</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bookings.map((booking) => (
                  <TableRow key={booking.id}>
                    <TableCell className="font-medium">{booking.title}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {clientById.get(booking.clientId) ?? "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(booking.scheduledAt).toLocaleString("es-AR", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </TableCell>
                    <TableCell>
                      <Badge variant={STATUS_VARIANT[booking.status]}>
                        {STATUS_LABEL[booking.status]}
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
    </div>
  );
}
