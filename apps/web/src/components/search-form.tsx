import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { Input } from "@/components/ui/input";

/** GET form: submitting puts ?search= in the URL, so the server page re-renders filtered. */
export function SearchForm({ action, defaultValue, placeholder }: { action: string; defaultValue?: string; placeholder: string }) {
  return (
    <form action={action} role="search" className="relative w-full sm:max-w-xs">
      <MagnifyingGlassIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="search"
        name="search"
        aria-label={placeholder}
        placeholder={placeholder}
        defaultValue={defaultValue}
        maxLength={100}
        className="pl-9"
      />
    </form>
  );
}
