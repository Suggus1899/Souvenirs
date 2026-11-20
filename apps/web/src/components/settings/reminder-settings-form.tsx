"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { apiClientFetch } from "@/lib/api-client";

const OPTIONS = [
  { value: -7, label: "7 días antes" },
  { value: -3, label: "3 días antes" },
  { value: -1, label: "1 día antes" },
  { value: 0, label: "El día del vencimiento" },
  { value: 3, label: "3 días después" },
  { value: 7, label: "7 días después" },
];

export function ReminderSettingsForm({
  offsets,
  clientRemindersEnabled,
  canEdit,
}: {
  offsets: number[];
  clientRemindersEnabled: boolean;
  canEdit: boolean;
}) {
  const router = useRouter();
  const [selected, setSelected] = useState(new Set(offsets));
  const [emailClients, setEmailClients] = useState(clientRemindersEnabled);
  const [loading, setLoading] = useState(false);

  function toggle(value: number) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      return next;
    });
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    try {
      await apiClientFetch("/tenants/me", {
        method: "PATCH",
        body: JSON.stringify({
          reminderOffsetsDays: [...selected],
          clientRemindersEnabled: emailClients,
        }),
      });
      toast.success("Preferencias guardadas. Aplican a las facturas que envíes desde ahora.");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No pudimos guardar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <fieldset disabled={!canEdit} className="flex flex-col gap-2">
        <legend className="mb-2 text-sm font-medium">Enviar recordatorios</legend>
        {OPTIONS.map((option) => (
          <label key={option.value} className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              className="size-4 accent-primary"
              checked={selected.has(option.value)}
              onChange={() => toggle(option.value)}
            />
            {option.label}
          </label>
        ))}
      </fieldset>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          className="size-4 accent-primary"
          disabled={!canEdit}
          checked={emailClients}
          onChange={(e) => setEmailClients(e.target.checked)}
        />
        Enviar también un email al cliente con el link de pago
      </label>
      {canEdit ? (
        <div>
          <Button type="submit" disabled={loading}>
            {loading ? "Guardando..." : "Guardar preferencias"}
          </Button>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">Solo el dueño del estudio puede cambiar esto.</p>
      )}
    </form>
  );
}
