import Link from "next/link";
import { ClientDialog } from "@/components/clients/client-dialog";
import { DeleteClientButton } from "@/components/clients/delete-client-button";
import { SearchForm } from "@/components/search-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { apiFetch } from "@/lib/api-server";
import type { Client } from "@souvenirs/shared";

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>;
}) {
  const { search } = await searchParams;
  const query = search?.trim() ? `?search=${encodeURIComponent(search.trim())}` : "";
  const clients = await apiFetch<Client[]>(`/clients${query}`);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-3xl">Clientes</h1>
        <ClientDialog />
      </div>
      <SearchForm action="/clients" defaultValue={search} placeholder="Buscar por nombre, email o teléfono" />
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium text-muted-foreground">
            {clients.length} {clients.length === 1 ? "cliente" : "clientes"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {clients.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              {search ? "Ningún cliente coincide con la búsqueda." : "Todavía no has agregado ningún cliente."}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead className="hidden lg:table-cell">Email</TableHead>
                  <TableHead className="hidden xl:table-cell">Teléfono</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clients.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell className="font-medium whitespace-normal">
                      <Link href={`/clients/${client.id}`} className="underline-offset-4 hover:underline">
                        {client.name}
                      </Link>
                      {/* Small screens: contact data under the name instead of in hidden columns. */}
                      <span className="block text-xs font-normal break-all text-muted-foreground lg:hidden">
                        {[client.email, client.phone].filter(Boolean).join(" · ")}
                      </span>
                    </TableCell>
                    <TableCell className="hidden text-muted-foreground lg:table-cell">{client.email ?? "—"}</TableCell>
                    <TableCell className="hidden text-muted-foreground xl:table-cell">{client.phone ?? "—"}</TableCell>
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
