"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
      <h1 className="font-heading text-3xl">Algo salió mal</h1>
      <p className="max-w-sm text-muted-foreground">
        No pudimos cargar esta sección. Intenta de nuevo en unos segundos.
      </p>
      <Button onClick={reset}>Reintentar</Button>
    </div>
  );
}
