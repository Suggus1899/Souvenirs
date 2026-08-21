import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-4 text-center">
      <p className="font-heading text-sm tracking-widest text-muted-foreground uppercase">
        Error 404
      </p>
      <h1 className="font-heading text-4xl">Esta página no existe</h1>
      <p className="max-w-sm text-muted-foreground">
        Puede que el link esté roto o que la página se haya movido.
      </p>
      <Button asChild className="mt-2">
        <Link href="/dashboard">Volver al inicio</Link>
      </Button>
    </div>
  );
}
