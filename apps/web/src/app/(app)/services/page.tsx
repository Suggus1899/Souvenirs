import { ConfirmDeleteButton } from "@/components/confirm-delete-button";
import { ServiceDialog } from "@/components/services/service-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { apiFetch } from "@/lib/api-server";
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
              Todavía no cargaste ningún servicio.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Precio base</TableHead>
                  <TableHead>Duración</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {services.map((service) => (
                  <TableRow key={service.id}>
                    <TableCell className="font-medium">{service.name}</TableCell>
                    <TableCell className="text-muted-foreground">${service.basePrice}</TableCell>
                    <TableCell className="text-muted-foreground">
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
