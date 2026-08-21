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
import { apiClientFetch } from "@/lib/api-client";
import type { Client, Invoice } from "@souvenirs/shared";

export function InvoiceDialog({ invoice, clients }: { invoice?: Invoice; clients: Client[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isEditing = Boolean(invoice);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(event.currentTarget);
    const dueDate = formData.get("dueDate");
    const payload = isEditing
      ? {
          totalAmount: Number(formData.get("totalAmount")),
          currency: formData.get("currency") || undefined,
          dueDate: dueDate ? new Date(String(dueDate)).toISOString() : undefined,
        }
      : {
          clientId: formData.get("clientId"),
          totalAmount: Number(formData.get("totalAmount")),
          currency: formData.get("currency") || undefined,
          dueDate: dueDate ? new Date(String(dueDate)).toISOString() : undefined,
        };

    try {
      await apiClientFetch(isEditing ? `/invoices/${invoice!.id}` : "/invoices", {
        method: isEditing ? "PATCH" : "POST",
        body: JSON.stringify(payload),
      });
      toast.success(isEditing ? "Factura actualizada" : "Factura creada");
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
            Nueva factura
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar factura" : "Nueva factura"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Solo se puede editar mientras la factura esté en borrador."
              : "Generá una factura para un cliente."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {!isEditing && (
            <div className="flex flex-col gap-2">
              <Label htmlFor="clientId">Cliente</Label>
              <Select name="clientId" required>
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
          )}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="totalAmount">Monto total</Label>
              <Input
                id="totalAmount"
                name="totalAmount"
                type="number"
                step="0.01"
                min="0.01"
                required
                defaultValue={invoice?.totalAmount}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="currency">Moneda</Label>
              <Input
                id="currency"
                name="currency"
                maxLength={3}
                placeholder="USD"
                defaultValue={invoice?.currency}
              />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="dueDate">Vencimiento</Label>
            <Input
              id="dueDate"
              name="dueDate"
              type="date"
              defaultValue={invoice?.dueDate?.slice(0, 10) ?? ""}
            />
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
