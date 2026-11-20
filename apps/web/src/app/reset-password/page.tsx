"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { extractErrorMessage, parseJsonBody } from "@/lib/api-error";

function ResetPasswordForm() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token") ?? "";
  const isInvite = params.get("invite") === "1";
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const formData = new FormData(event.currentTarget);
    const password = String(formData.get("password"));
    if (password !== formData.get("confirm")) {
      setError("Las contraseñas no coinciden");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      if (!res.ok) {
        setError(extractErrorMessage(await parseJsonBody(res), "No pudimos cambiar la contraseña"));
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Este enlace está incompleto.{" "}
          <Link href="/forgot-password" className="underline underline-offset-4">
            Pide uno nuevo
          </Link>
          .
        </p>
      </CardContent>
    );
  }

  return (
    <>
      <CardHeader>
        <CardTitle className="text-2xl">{isInvite ? "Bienvenido a Souvenirs" : "Nueva contraseña"}</CardTitle>
        <CardDescription>
          {isInvite
            ? "Elige una contraseña para entrar al panel de tu estudio."
            : "Elige una contraseña nueva de al menos 8 caracteres."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="password">Contraseña</Label>
            <Input id="password" name="password" type="password" required minLength={8} maxLength={128} autoComplete="new-password" />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="confirm">Repite la contraseña</Label>
            <Input id="confirm" name="confirm" type="password" required minLength={8} maxLength={128} autoComplete="new-password" />
          </div>
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}{" "}
              <Link href="/forgot-password" className="underline underline-offset-4">
                Pedir otro enlace
              </Link>
            </p>
          )}
          <Button type="submit" disabled={loading}>
            {loading ? "Guardando..." : "Guardar y entrar"}
          </Button>
        </form>
      </CardContent>
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-sm">
        {/* useSearchParams needs a Suspense boundary for static rendering. */}
        <Suspense>
          <ResetPasswordForm />
        </Suspense>
      </Card>
    </div>
  );
}
