"use client";

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

const METHODS = [
  { value: "CASH", label: "Efectivo (USD)" },
  { value: "CASH_VES", label: "Efectivo (Bs)" },
  { value: "TRANSFER", label: "Transferencia" },
  { value: "PAGO_MOVIL", label: "Pago Móvil" },
  { value: "ZELLE", label: "Zelle" },
  { value: "BINANCE_USDT", label: "Binance / USDT" },
  { value: "CARD", label: "Tarjeta" },
  { value: "OTHER", label: "Otro" },
];

export function RegisterPaymentDialog({ invoiceId }: { invoiceId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(event.currentTarget);
    const payload = {
      invoiceId,
      amount: Number(formData.get("amount")),
      method: formData.get("method"),
      notes: formData.get("notes") || undefined,
    };

    try {
      await apiClientFetch("/payments", { method: "POST", body: JSON.stringify(payload) });
      toast.success("Pago registrado");
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
        <Button variant="outline">Registrar pago</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registrar pago</DialogTitle>
          <DialogDescription>
            Para pagos recibidos en efectivo, transferencia u otro medio fuera del sistema.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="amount">Monto</Label>
            <Input id="amount" name="amount" type="number" step="0.01" min="0.01" required />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="method">Método</Label>
            <Select name="method" defaultValue="CASH" required>
              <SelectTrigger id="method" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {METHODS.map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="notes">Notas</Label>
            <Textarea id="notes" name="notes" />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading ? "Guardando..." : "Registrar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
