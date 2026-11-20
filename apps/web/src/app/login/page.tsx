"use client";

import { Logo } from "@/components/brand/logo";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { extractErrorMessage } from "@/lib/api-error";

/** Shown after a redirect from /api/auth/session-expired. */
function ExpiredNotice() {
  const expired = useSearchParams().get("expired") === "1";
  if (!expired) return null;
  return (
    <p role="status" className="mb-4 rounded-md bg-muted px-3 py-2 text-sm">
      Tu sesión expiró. Vuelve a iniciar sesión.
    </p>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(event.currentTarget);
    const email = formData.get("email");
    const password = formData.get("password");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const body: unknown = await res.json();
      if (!res.ok) {
        setError(extractErrorMessage(body, "No pudimos iniciar sesión"));
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background px-4 py-10">
      <Link href="/" aria-label="Souvenirs, inicio">
        <Logo className="text-2xl" markClassName="size-9" />
      </Link>
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="font-heading text-2xl">Bienvenido de nuevo</CardTitle>
          <CardDescription>Ingresa a tu cuenta para gestionar clientes y pagos.</CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense>
            <ExpiredNotice />
          </Suspense>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" required autoComplete="email" />
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Contraseña</Label>
                <Link href="/forgot-password" className="text-xs text-muted-foreground underline underline-offset-4">
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
              <Input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" disabled={loading} className="mt-2">
              {loading ? "Ingresando..." : "Ingresar"}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            ¿No tienes cuenta?{" "}
            <Link href="/register" className="font-medium text-foreground underline underline-offset-4">
              Crea tu estudio
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
