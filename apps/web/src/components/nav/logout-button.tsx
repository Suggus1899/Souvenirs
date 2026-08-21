"use client";

import { ArrowRightStartOnRectangleIcon } from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <Button variant="ghost" size="icon" aria-label="Cerrar sesión" onClick={handleLogout}>
      <ArrowRightStartOnRectangleIcon className="size-5" />
    </Button>
  );
}
