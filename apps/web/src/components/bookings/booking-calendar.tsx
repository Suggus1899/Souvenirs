import Link from "next/link";
import { cn } from "@/lib/utils";
import { dayKey, formatTime, LOCALE } from "@/lib/labels";
import type { Booking } from "@souvenirs/shared";

const WEEKDAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

function shiftMonth(month: string, delta: number): string {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + delta, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

/** Month grid (weeks start on Monday). `month` is yyyy-mm. */
export function BookingCalendar({
  month,
  bookings,
  clientNames,
}: {
  month: string;
  bookings: Booking[];
  clientNames: Map<string, string>;
}) {
  const [year, monthIndex] = month.split("-").map(Number);
  const first = new Date(Date.UTC(year, monthIndex - 1, 1));
  const daysInMonth = new Date(Date.UTC(year, monthIndex, 0)).getUTCDate();
  const leadingBlanks = (first.getUTCDay() + 6) % 7; // Monday = 0
  const today = dayKey(new Date());

  const byDay = new Map<string, Booking[]>();
  for (const booking of bookings) {
    const key = dayKey(new Date(booking.scheduledAt));
    byDay.set(key, [...(byDay.get(key) ?? []), booking]);
  }

  const cells: (number | null)[] = [
    ...Array.from({ length: leadingBlanks }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const title = first.toLocaleDateString(LOCALE, { month: "long", year: "numeric", timeZone: "UTC" });

  return (
    <section aria-label={`Calendario de ${title}`} className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <Link
          href={`/bookings?view=calendar&month=${shiftMonth(month, -1)}`}
          className="rounded-md px-2 py-1 text-sm hover:bg-accent"
          aria-label="Mes anterior"
        >
          ←
        </Link>
        <h2 className="font-heading text-xl first-letter:uppercase">{title}</h2>
        <Link
          href={`/bookings?view=calendar&month=${shiftMonth(month, 1)}`}
          className="rounded-md px-2 py-1 text-sm hover:bg-accent"
          aria-label="Mes siguiente"
        >
          →
        </Link>
      </div>
      <div className="grid grid-cols-7 gap-px overflow-hidden rounded-lg border border-border bg-border text-sm">
        {WEEKDAYS.map((day) => (
          <div key={day} className="bg-muted px-2 py-1 text-center text-xs font-medium text-muted-foreground">
            {day}
          </div>
        ))}
        {cells.map((day, index) => {
          if (day === null) return <div key={`blank-${index}`} className="min-h-20 bg-background/60" />;
          const key = `${month}-${String(day).padStart(2, "0")}`;
          const dayBookings = byDay.get(key) ?? [];
          return (
            <div key={key} className="flex min-h-20 flex-col gap-1 bg-background p-1 sm:min-h-24">
              <span
                className={cn(
                  "self-end rounded-full px-1.5 text-xs",
                  key === today && "bg-primary text-primary-foreground",
                )}
              >
                {day}
              </span>
              <ul className="flex flex-col gap-1">
                {dayBookings.map((booking) => (
                  <li
                    key={booking.id}
                    title={`${booking.title} — ${clientNames.get(booking.clientId) ?? ""}`}
                    className={cn(
                      "truncate rounded px-1 py-0.5 text-[11px] leading-tight",
                      booking.status === "CANCELLED"
                        ? "bg-muted text-muted-foreground line-through"
                        : "bg-primary/15 text-foreground",
                    )}
                  >
                    <span className="font-medium">{formatTime(booking.scheduledAt)}</span> {booking.title}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </section>
  );
}
