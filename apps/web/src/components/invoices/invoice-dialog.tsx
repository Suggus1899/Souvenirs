"use client";

import { PlusIcon, TrashIcon } from "@heroicons/react/24/outline";
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
import { ApiError } from "@/lib/api-error";
import { formatMoney, toCents } from "@/lib/money";
import type { Client, Invoice } from "@souvenirs/shared";

interface ItemRow {
  key: number;
  description: string;
  quantity: string;
  unitPrice: string;
}

let nextKey = 0;
const emptyRow = (): ItemRow => ({ key: nextKey++, description: "", quantity: "1", unitPrice: "" });

function initialRows(invoice?: Invoice): ItemRow[] {
  if (invoice?.items?.length) {
    return invoice.items.map((item) => ({
      key: nextKey++,
      description: item.description,
      quantity: String(item.quantity),
      unitPrice: item.unitPrice,
    }));
  }
  // Invoices created before line items existed: show their total as a single row.
  if (invoice) {
    return [{ key: nextKey++, description: "Servicio", quantity: "1", unitPrice: invoice.totalAmount }];
  }
  return [emptyRow()];
}

export function InvoiceDialog({
  invoice,
  clients,
  defaultClientId,
}: {
  invoice?: Invoice;
  clients: Client[];
  defaultClientId?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<ItemRow[]>(() => initialRows(invoice));
  const isEditing = Boolean(invoice);

  const currencyDefault = invoice?.currency ?? "USD";
  const [currency, setCurrency] = useState(currencyDefault);
  const totalCents = rows.reduce(
    (sum, row) => sum + (Number(row.quantity) || 0) * toCents(row.unitPrice || 0),
    0,
  );

  function updateRow(key: number, patch: Partial<ItemRow>) {
    setRows((current) => current.map((row) => (row.key === key ? { ...row, ...patch } : row)));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(event.currentTarget);
    const dueDate = formData.get("dueDate");
    const items = rows.map((row) => ({
      description: row.description.trim(),
      quantity: Number(row.quantity),
      unitPrice: Number(row.unitPrice),
    }));
    const payload = {
      ...(isEditing ? {} : { clientId: formData.get("clientId") }),
      items,
      currency: currency.toUpperCase() || undefined,
      // A plain date means "that calendar day", so pin it to UTC midnight.
      dueDate: dueDate ? new Date(`${String(dueDate)}T00:00:00Z`).toISOString() : undefined,
      notes: formData.get("notes") || undefined,
    };

    try {
      await apiClientFetch(isEditing ? `/invoices/${invoice!.id}` : "/invoices", {
        method: isEditing ? "PATCH" : "POST",
        body: JSON.stringify(payload),
      });
      toast.success(isEditing ? "Factura actualizada" : "Factura creada");
      setOpen(false);
      if (!isEditing) setRows([emptyRow()]);
      router.refresh();
    } catch (err) {
      if (err instanceof ApiError && err.status === 403) {
        toast.error(err.message, {
          action: { label: "Ver planes", onClick: () => router.push("/settings") },
        });
      } else {
        setError(err instanceof Error ? err.message : "Algo salió mal");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {isEditing ? (
          <Button variant="outline">Editar</Button>
        ) : (
          <Button>
            <PlusIcon className="size-4" />
            Nueva factura
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar factura" : "Nueva factura"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Solo se puede editar mientras la factura esté en borrador."
              : "Agrega los conceptos a cobrar; el total se calcula solo."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {!isEditing && (
            <div className="flex flex-col gap-2">
              <Label htmlFor="clientId">Cliente</Label>
              <Select name="clientId" required defaultValue={defaultClientId}>
                <SelectTrigger id="clientId" className="w-full">
                  <SelectValue placeholder="Elige un cliente" />
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

          <fieldset className="flex flex-col gap-2">
            <legend className="mb-2 text-sm font-medium">Conceptos</legend>
            <div className="hidden grid-cols-[1fr_5rem_7rem_2.25rem] gap-2 text-xs text-muted-foreground sm:grid">
              <span>Descripción</span>
              <span>Cant.</span>
              <span>Precio unit.</span>
            </div>
            {rows.map((row, index) => (
              <div key={row.key} className="grid grid-cols-[1fr_5rem_7rem_2.25rem] gap-2">
                <Input
                  aria-label={`Descripción del concepto ${index + 1}`}
                  placeholder="Sesión de fotos"
                  required
                  maxLength={200}
                  value={row.description}
                  onChange={(e) => updateRow(row.key, { description: e.target.value })}
                />
                <Input
                  aria-label={`Cantidad del concepto ${index + 1}`}
                  type="number"
                  min="1"
                  step="1"
                  required
                  value={row.quantity}
                  onChange={(e) => updateRow(row.key, { quantity: e.target.value })}
                />
                <Input
                  aria-label={`Precio unitario del concepto ${index + 1}`}
                  type="number"
                  min="0.01"
                  step="0.01"
                  required
                  value={row.unitPrice}
                  onChange={(e) => updateRow(row.key, { unitPrice: e.target.value })}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={`Quitar concepto ${index + 1}`}
                  disabled={rows.length === 1}
                  onClick={() => setRows((current) => current.filter((r) => r.key !== row.key))}
                >
                  <TrashIcon className="size-4" />
                </Button>
              </div>
            ))}
            <div className="flex items-center justify-between">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={rows.length >= 50}
                onClick={() => setRows((current) => [...current, emptyRow()])}
              >
                <PlusIcon className="size-4" />
                Agregar concepto
              </Button>
              <p className="text-sm">
                Total: <span className="font-medium">{formatMoney(totalCents, currency || "USD")}</span>
              </p>
            </div>
          </fieldset>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="currency">Moneda</Label>
              <Input
                id="currency"
                name="currency"
                maxLength={3}
                minLength={3}
                placeholder="USD"
                value={currency}
                onChange={(e) => setCurrency(e.target.value.toUpperCase())}
              />
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
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="notes">Notas para el cliente</Label>
            <Textarea
              id="notes"
              name="notes"
              maxLength={2000}
              placeholder="Datos de Pago Móvil, condiciones, etc."
              defaultValue={invoice?.notes ?? ""}
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
