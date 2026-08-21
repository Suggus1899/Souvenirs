import { ClientDialog } from "@/components/clients/client-dialog";
import { DeleteClientButton } from "@/components/clients/delete-client-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { apiFetch } from "@/lib/api-server";
import type { Client } from "@souvenirs/shared";

export default async function ClientsPage() {
  const clients = await apiFetch<Client[]>("/clients");

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-3xl">Clientes</h1>
        <ClientDialog />
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium text-muted-foreground">
            {clients.length} {clients.length === 1 ? "cliente" : "clientes"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {clients.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Todavía no cargaste ningún cliente.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Teléfono</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clients.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell className="font-medium">{client.name}</TableCell>
                    <TableCell className="text-muted-foreground">{client.email ?? "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{client.phone ?? "—"}</TableCell>
                    <TableCell className="flex justify-end gap-1">
                      <ClientDialog client={client} />
                      <DeleteClientButton clientId={client.id} clientName={client.name} />
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
