"use client";

import { PlusIcon } from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { toast } from "sonner";
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
import type { Service } from "@souvenirs/shared";

export function ServiceDialog({ service }: { service?: Service }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isEditing = Boolean(service);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(event.currentTarget);
    const payload = {
      name: formData.get("name"),
      description: formData.get("description") || undefined,
      basePrice: Number(formData.get("basePrice")),
      durationMinutes: Number(formData.get("durationMinutes")),
    };

    try {
      await apiClientFetch(isEditing ? `/services/${service!.id}` : "/services", {
        method: isEditing ? "PATCH" : "POST",
        body: JSON.stringify(payload),
      });
      toast.success(isEditing ? "Servicio actualizado" : "Servicio creado");
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
            Nuevo servicio
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar servicio" : "Nuevo servicio"}</DialogTitle>
          <DialogDescription>
            Definí el precio base y la duración estándar del servicio.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="name">Nombre</Label>
            <Input id="name" name="name" required minLength={2} defaultValue={service?.name} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea id="description" name="description" defaultValue={service?.description ?? ""} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="basePrice">Precio base</Label>
              <Input
                id="basePrice"
                name="basePrice"
                type="number"
                step="0.01"
                min="0"
                required
                defaultValue={service?.basePrice}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="durationMinutes">Duración (min)</Label>
              <Input
                id="durationMinutes"
                name="durationMinutes"
                type="number"
                min="1"
                required
                defaultValue={service?.durationMinutes}
              />
            </div>
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
