"use client";

import { PlusIcon } from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { apiClientFetch } from "@/lib/api-client";
import { toast } from "sonner";
import type { Client } from "@souvenirs/shared";

export function ClientDialog({ client }: { client?: Client }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isEditing = Boolean(client);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(event.currentTarget);
    const payload = {
      name: formData.get("name"),
      email: formData.get("email") || undefined,
      phone: formData.get("phone") || undefined,
      notes: formData.get("notes") || undefined,
    };

    try {
      await apiClientFetch(isEditing ? `/clients/${client!.id}` : "/clients", {
        method: isEditing ? "PATCH" : "POST",
        body: JSON.stringify(payload),
      });
      toast.success(isEditing ? "Cliente actualizado" : "Cliente creado");
      setOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Algo salió mal");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {isEditing ? (
          <Button variant="ghost" size="sm">
            Editar
          </Button>
        ) : (
          <Button>
            <PlusIcon className="size-4" />
            Nuevo cliente
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar cliente" : "Nuevo cliente"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Actualizá los datos de contacto del cliente."
              : "Cargá los datos de contacto del cliente."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="name">Nombre</Label>
            <Input id="name" name="name" required minLength={2} defaultValue={client?.name} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" defaultValue={client?.email ?? ""} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="phone">Teléfono</Label>
            <Input id="phone" name="phone" defaultValue={client?.phone ?? ""} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="notes">Notas</Label>
            <Textarea id="notes" name="notes" defaultValue={client?.notes ?? ""} />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading ? "Guardando..." : "Guardar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
