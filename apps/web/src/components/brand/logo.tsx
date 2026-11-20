import { cn } from "@/lib/utils";

/**
 * Souvenirs mark: an instant-photo frame (the keepsake a session leaves behind)
 * with a sun over a horizon inside. Draws in currentColor so it follows the theme.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" aria-hidden="true" className={cn("size-7", className)}>
      <rect x="5" y="3" width="22" height="26" rx="3" transform="rotate(-6 16 16)" fill="currentColor" />
      <g transform="rotate(-6 16 16)">
        <rect x="8" y="6" width="16" height="15" rx="1.5" className="fill-background" />
        <circle cx="19.5" cy="10.5" r="2.2" fill="currentColor" />
        <path d="M8 18.5l4.5-4.5 3.5 3.5 2.5-2 5.5 5.5H9.5A1.5 1.5 0 0 1 8 19.5z" fill="currentColor" opacity="0.55" />
      </g>
    </svg>
  );
}

export function Logo({ className, markClassName }: { className?: string; markClassName?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2 font-heading text-xl", className)}>
      <LogoMark className={cn("text-primary", markClassName)} />
      Souvenirs
    </span>
  );
}
