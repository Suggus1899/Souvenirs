import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { apiFetch } from "@/lib/api-server";
import type { Reminder, ReminderStatus } from "@souvenirs/shared";

const STATUS_LABEL: Record<ReminderStatus, string> = {
  PENDING: "Pendiente",
  SENT: "Enviado",
  DISMISSED: "Descartado",
};

const CHANNEL_LABEL = { PUSH: "Push", EMAIL: "Email" };

export default async function RemindersPage() {
  const reminders = await apiFetch<Reminder[]>("/reminders");

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-3xl">Recordatorios</h1>
        <p className="text-sm text-muted-foreground">
          Se generan automáticamente al crear una factura con fecha de vencimiento.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium text-muted-foreground">
            {reminders.length} {reminders.length === 1 ? "recordatorio" : "recordatorios"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {reminders.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No hay recordatorios programados todavía.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mensaje</TableHead>
                  <TableHead>Canal</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reminders.map((reminder) => (
                  <TableRow key={reminder.id}>
                    <TableCell className="font-medium">{reminder.message}</TableCell>
                    <TableCell>{CHANNEL_LABEL[reminder.channel]}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(reminder.remindAt).toLocaleString("es-AR", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </TableCell>
                    <TableCell>
                      <Badge variant={reminder.status === "SENT" ? "default" : "outline"}>
                        {STATUS_LABEL[reminder.status]}
                      </Badge>
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
