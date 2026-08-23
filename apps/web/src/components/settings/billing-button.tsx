"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { apiClientFetch } from "@/lib/api-client";
import type { Plan } from "@souvenirs/shared";

export function BillingButton({ plan }: { plan: Plan }) {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    try {
      const path =
        plan === "PRO" ? "/tenants/me/billing/portal" : "/tenants/me/billing/checkout-session";
      const res = await apiClientFetch<{ url: string }>(path, { method: "POST" });
      window.location.href = res.url;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No pudimos abrir la facturación");
      setLoading(false);
    }
  }

  return (
    <Button onClick={handleClick} disabled={loading}>
      {loading ? "Redirigiendo..." : plan === "PRO" ? "Gestionar suscripción" : "Actualizar a Pro"}
    </Button>
  );
}
