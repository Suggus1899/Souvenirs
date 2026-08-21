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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { apiClientFetch } from "@/lib/api-client";
import type { Booking, Client, Service } from "@souvenirs/shared";

function toDatetimeLocal(iso?: string) {
  if (!iso) return "";
  return iso.slice(0, 16);
}

export function BookingDialog({
  booking,
  clients,
  services,
}: {
  booking?: Booking;
  clients: Client[];
  services: Service[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isEditing = Boolean(booking);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(event.currentTarget);
    const serviceId = formData.get("serviceId");
    const scheduledAt = formData.get("scheduledAt");
    const payload = {
      clientId: formData.get("clientId"),
      serviceId: serviceId ? serviceId : undefined,
      title: formData.get("title"),
      scheduledAt: scheduledAt ? new Date(String(scheduledAt)).toISOString() : undefined,
      durationMinutes: Number(formData.get("durationMinutes")),
      location: formData.get("location") || undefined,
      notes: formData.get("notes") || undefined,
    };

    try {
      await apiClientFetch(isEditing ? `/bookings/${booking!.id}` : "/bookings", {
        method: isEditing ? "PATCH" : "POST",
        body: JSON.stringify(payload),
      });
      toast.success(isEditing ? "Reserva actualizada" : "Reserva creada");
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
            Nueva reserva
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar reserva" : "Nueva reserva"}</DialogTitle>
          <DialogDescription>Agendá una sesión con un cliente.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="clientId">Cliente</Label>
            <Select name="clientId" defaultValue={booking?.clientId} required>
              <SelectTrigger id="clientId" className="w-full">
                <SelectValue placeholder="Elegí un cliente" />
              </SelectTrigger>
              <SelectContent>
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="serviceId">Servicio (opcional)</Label>
            <Select name="serviceId" defaultValue={booking?.serviceId ?? undefined}>
              <SelectTrigger id="serviceId" className="w-full">
                <SelectValue placeholder="Sin servicio asociado" />
              </SelectTrigger>
              <SelectContent>
                {services.map((service) => (
                  <SelectItem key={service.id} value={service.id}>
                    {service.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="title">Título</Label>
            <Input id="title" name="title" required minLength={2} defaultValue={booking?.title} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="scheduledAt">Fecha y hora</Label>
              <Input
                id="scheduledAt"
                name="scheduledAt"
                type="datetime-local"
                required
                defaultValue={toDatetimeLocal(booking?.scheduledAt)}
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
                defaultValue={booking?.durationMinutes ?? 60}
              />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="location">Ubicación</Label>
            <Input id="location" name="location" defaultValue={booking?.location ?? ""} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="notes">Notas</Label>
            <Textarea id="notes" name="notes" defaultValue={booking?.notes ?? ""} />
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
