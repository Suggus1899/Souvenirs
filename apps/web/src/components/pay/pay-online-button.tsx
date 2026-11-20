"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { extractErrorMessage, parseJsonBody } from "@/lib/api-error";

export function PayOnlineButton({ token }: { token: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/proxy/public/invoices/${encodeURIComponent(token)}/checkout`, {
        method: "POST",
      });
      const body = await parseJsonBody(res);
      if (!res.ok) {
        setError(extractErrorMessage(body, "No pudimos iniciar el pago"));
        return;
      }
      const { url } = body as { url: string | null };
      if (url) window.location.assign(url);
    } catch {
      setError("No pudimos conectar. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <Button size="lg" onClick={handleClick} disabled={loading}>
        {loading ? "Redirigiendo a Stripe..." : "Pagar con tarjeta"}
      </Button>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
