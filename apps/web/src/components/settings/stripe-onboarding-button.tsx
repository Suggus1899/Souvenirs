"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { apiClientFetch } from "@/lib/api-client";

export function StripeOnboardingButton({ alreadyConnected }: { alreadyConnected: boolean }) {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    try {
      const res = await apiClientFetch<{ url: string }>("/tenants/me/stripe/onboarding-link", {
        method: "POST",
      });
      window.location.href = res.url;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No pudimos iniciar el onboarding de Stripe");
      setLoading(false);
    }
  }

  return (
    <Button onClick={handleClick} disabled={loading}>
      {loading ? "Redirigiendo..." : alreadyConnected ? "Actualizar datos de Stripe" : "Conectar con Stripe"}
    </Button>
  );
}
