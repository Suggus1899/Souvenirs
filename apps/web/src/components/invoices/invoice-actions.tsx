"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { apiClientFetch } from "@/lib/api-client";
import type { InvoiceStatus } from "@souvenirs/shared";

export function InvoiceActions({ invoiceId, status }: { invoiceId: string; status: InvoiceStatus }) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  async function handleSend() {
    setLoading("send");
    try {
      await apiClientFetch(`/invoices/${invoiceId}/send`, { method: "POST" });
      toast.success("Factura enviada");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No pudimos enviar la factura");
    } finally {
      setLoading(null);
    }
  }

  async function handleCancel() {
    setLoading("cancel");
    try {
      await apiClientFetch(`/invoices/${invoiceId}/cancel`, { method: "POST" });
      toast.success("Factura cancelada");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No pudimos cancelar la factura");
    } finally {
      setLoading(null);
    }
  }

  async function handleCheckoutLink() {
    setLoading("checkout");
    try {
      const res = await apiClientFetch<{ url: string | null }>(
        `/invoices/${invoiceId}/checkout-session`,
        { method: "POST" },
      );
      if (res.url) {
        await navigator.clipboard.writeText(res.url);
        toast.success("Link de pago copiado al portapapeles");
      }
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No pudimos generar el link de pago");
    } finally {
      setLoading(null);
    }
  }

  const canSend = status === "DRAFT";
  const canCancel = status !== "PAID" && status !== "CANCELLED";
  const canCharge = status !== "PAID" && status !== "CANCELLED";

  return (
    <div className="flex flex-wrap gap-2">
      {canSend && (
        <Button variant="outline" disabled={loading !== null} onClick={handleSend}>
          {loading === "send" ? "Enviando..." : "Enviar"}
        </Button>
      )}
      {canCharge && (
        <Button variant="outline" disabled={loading !== null} onClick={handleCheckoutLink}>
          {loading === "checkout" ? "Generando..." : "Generar link de pago (Stripe)"}
        </Button>
      )}
      {canCancel && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" className="text-destructive hover:text-destructive">
              Cancelar factura
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Cancelar esta factura?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción no se puede deshacer. Ya no se podrán registrar pagos sobre ella.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Volver</AlertDialogCancel>
              <AlertDialogAction disabled={loading !== null} onClick={handleCancel}>
                Cancelar factura
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
