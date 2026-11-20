import Link from "next/link";
import { cn } from "@/lib/utils";

/** Server-rendered filter chips: each one is a plain link that sets a query param. */
export function FilterLinks({
  basePath,
  param,
  current,
  options,
  extraParams = {},
}: {
  basePath: string;
  param: string;
  current?: string;
  options: { value?: string; label: string }[];
  extraParams?: Record<string, string>;
}) {
  return (
    <nav aria-label="Filtros" className="flex flex-wrap gap-2">
      {options.map((option) => {
        const params = new URLSearchParams(extraParams);
        if (option.value) params.set(param, option.value);
        const href = params.size ? `${basePath}?${params}` : basePath;
        const active = (current ?? "") === (option.value ?? "");
        return (
          <Link
            key={option.label}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "rounded-full border px-3 py-1 text-sm transition-colors",
              active
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border text-muted-foreground hover:bg-accent",
            )}
          >
            {option.label}
          </Link>
        );
      })}
    </nav>
  );
}
