import Link from "next/link";

const LINKS = [
  { href: "/settings", label: "Estudio" },
  { href: "/settings/profile", label: "Mi perfil" },
  { href: "/settings/team", label: "Equipo" },
];

export function SettingsNav({ current }: { current: string }) {
  return (
    <nav aria-label="Secciones de configuración" className="flex gap-4 border-b border-border text-sm">
      {LINKS.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          aria-current={current === link.href ? "page" : undefined}
          className={
            current === link.href
              ? "-mb-px border-b-2 border-primary pb-2 font-medium"
              : "pb-2 text-muted-foreground hover:text-foreground"
          }
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
