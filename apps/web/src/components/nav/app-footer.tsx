import Link from "next/link";

export function AppFooter({ variant = "compact" }: { variant?: "compact" | "marketing" }) {
  const year = new Date().getFullYear();

  if (variant === "compact") {
    return (
      <footer className="border-t border-border px-4 py-4 text-center text-xs text-muted-foreground md:px-8">
        © {year} Souvenirs — gestión de clientes y pagos para fotógrafos.
      </footer>
    );
  }

  return (
    <footer className="border-t border-border px-4 py-12 md:px-8">
      <div className="mx-auto flex max-w-5xl flex-col gap-8 sm:flex-row sm:justify-between">
        <div className="flex flex-col gap-2">
          <span className="font-heading text-lg">Souvenirs</span>
          <p className="max-w-xs text-sm text-muted-foreground">
            Gestión de clientes y pagos para fotógrafos.
          </p>
        </div>
        <div className="flex gap-12">
          <div className="flex flex-col gap-2 text-sm">
            <span className="font-medium">Producto</span>
            <Link href="/register" className="text-muted-foreground hover:text-foreground">
              Creá tu estudio
            </Link>
            <Link href="/login" className="text-muted-foreground hover:text-foreground">
              Ingresar
            </Link>
          </div>
          <div className="flex flex-col gap-2 text-sm">
            <span className="font-medium">Contacto</span>
            <a
              href="mailto:hola@souvenirs.app"
              className="text-muted-foreground hover:text-foreground"
            >
              hola@souvenirs.app
            </a>
          </div>
        </div>
      </div>
      <p className="mx-auto mt-8 max-w-5xl text-xs text-muted-foreground">
        © {year} Souvenirs — todos los derechos reservados.
      </p>
    </footer>
  );
}
