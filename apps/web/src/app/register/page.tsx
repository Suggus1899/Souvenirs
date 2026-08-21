"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { extractErrorMessage } from "@/lib/api-error";

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(event.currentTarget);
    const payload = {
      tenantName: formData.get("tenantName"),
      name: formData.get("name"),
      email: formData.get("email"),
      password: formData.get("password"),
    };

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body: unknown = await res.json();
      if (!res.ok) {
        setError(extractErrorMessage(body, "No pudimos crear tu cuenta"));
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Creá tu estudio</CardTitle>
          <CardDescription>Empezá a gestionar clientes, reservas y pagos.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="tenantName">Nombre del estudio</Label>
              <Input id="tenantName" name="tenantName" required minLength={2} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="name">Tu nombre</Label>
              <Input id="name" name="name" required minLength={2} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" required autoComplete="email" />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" disabled={loading} className="mt-2">
              {loading ? "Creando cuenta..." : "Crear cuenta"}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            ¿Ya tenés cuenta?{" "}
            <Link href="/login" className="font-medium text-foreground underline underline-offset-4">
              Ingresá
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
