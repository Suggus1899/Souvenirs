"use client";

import { LinkIcon } from "@heroicons/react/24/outline";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

/** Copies the client-facing payment page URL (/pay/:token), which needs no login. */
export function CopyPayLinkButton({ publicToken }: { publicToken: string }) {
  async function handleClick() {
    const url = `${window.location.origin}/pay/${publicToken}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link para el cliente copiado");
    } catch {
      toast.error("No pudimos copiar el link", { description: url });
    }
  }

  return (
    <Button variant="outline" onClick={handleClick}>
      <LinkIcon className="size-4" />
      Copiar link para el cliente
    </Button>
  );
}
