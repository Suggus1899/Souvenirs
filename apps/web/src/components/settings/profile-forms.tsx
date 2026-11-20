"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiClientFetch } from "@/lib/api-client";

export function ProfileNameForm({ name }: { name: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    try {
      await apiClientFetch("/users/me", {
        method: "PATCH",
        body: JSON.stringify({ name: new FormData(event.currentTarget).get("name") }),
      });
      toast.success("Nombre actualizado");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No pudimos guardar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex max-w-sm flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="name">Nombre</Label>
        <Input id="name" name="name" required minLength={2} maxLength={100} defaultValue={name} />
      </div>
      <div>
        <Button type="submit" disabled={loading}>
          {loading ? "Guardando..." : "Guardar"}
        </Button>
      </div>
    </form>
  );
}

export function ChangePasswordForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const form = event.currentTarget;
    const data = new FormData(form);
    if (data.get("newPassword") !== data.get("confirm")) {
      setError("Las contraseñas nuevas no coinciden");
      return;
    }
    setLoading(true);
    try {
      await apiClientFetch("/users/me/password", {
        method: "POST",
        body: JSON.stringify({
          currentPassword: data.get("currentPassword"),
          newPassword: data.get("newPassword"),
        }),
      });
      toast.success("Contraseña actualizada");
      form.reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No pudimos cambiar la contraseña");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex max-w-sm flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="currentPassword">Contraseña actual</Label>
        <Input id="currentPassword" name="currentPassword" type="password" required autoComplete="current-password" />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="newPassword">Contraseña nueva</Label>
        <Input id="newPassword" name="newPassword" type="password" required minLength={8} maxLength={128} autoComplete="new-password" />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="confirm">Repite la contraseña nueva</Label>
        <Input id="confirm" name="confirm" type="password" required minLength={8} maxLength={128} autoComplete="new-password" />
      </div>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      <div>
        <Button type="submit" disabled={loading}>
          {loading ? "Guardando..." : "Cambiar contraseña"}
        </Button>
      </div>
    </form>
  );
}
