import { ConfirmDeleteButton } from "@/components/confirm-delete-button";
import { ServiceDialog } from "@/components/services/service-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { apiFetch } from "@/lib/api-server";
import { formatAmount } from "@/lib/money";
import type { Service } from "@souvenirs/shared";

export default async function ServicesPage() {
  const services = await apiFetch<Service[]>("/services");

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-3xl">Servicios</h1>
        <ServiceDialog />
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium text-muted-foreground">
            {services.length} {services.length === 1 ? "servicio" : "servicios"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {services.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Todavía no has agregado ningún servicio.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead className="hidden sm:table-cell">Precio base</TableHead>
                  <TableHead className="hidden md:table-cell">Duración</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {services.map((service) => (
                  <TableRow key={service.id}>
                    <TableCell className="font-medium whitespace-normal">
                      {service.name}
                      <span className="block text-xs font-normal text-muted-foreground md:hidden">
                        <span className="sm:hidden">{formatAmount(service.basePrice, "USD")} · </span>
                        {service.durationMinutes} min
                      </span>
                    </TableCell>
                    <TableCell className="hidden text-muted-foreground sm:table-cell">{formatAmount(service.basePrice, "USD")}</TableCell>
                    <TableCell className="hidden text-muted-foreground md:table-cell">
                      {service.durationMinutes} min
                    </TableCell>
                    <TableCell className="flex justify-end gap-1">
                      <ServiceDialog service={service} />
                      <ConfirmDeleteButton
                        path={`/services/${service.id}`}
                        title={`¿Eliminar ${service.name}?`}
                        description="Esta acción no se puede deshacer."
                        successMessage="Servicio eliminado"
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
