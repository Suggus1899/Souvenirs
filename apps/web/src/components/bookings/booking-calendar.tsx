import Link from "next/link";
import { cn } from "@/lib/utils";
import { dayKey, formatDateTime, formatTime, LOCALE } from "@/lib/labels";
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

  const monthBookings = bookings
    .filter((b) => dayKey(new Date(b.scheduledAt)).startsWith(month))
    .sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt));

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
          if (day === null) return <div key={`blank-${index}`} className="min-h-14 bg-background/60 sm:min-h-24" />;
          const key = `${month}-${String(day).padStart(2, "0")}`;
          const dayBookings = byDay.get(key) ?? [];
          return (
            <div key={key} className="flex min-h-14 flex-col gap-1 bg-background p-1 sm:min-h-24">
              <span
                className={cn(
                  "self-end rounded-full px-1.5 text-xs",
                  key === today && "bg-primary text-primary-foreground",
                )}
              >
                {day}
              </span>
              {/* Phones: a dot per session; the agenda list below has the details. */}
              {dayBookings.length > 0 && (
                <span className="flex flex-wrap justify-center gap-0.5 sm:hidden" aria-label={`${dayBookings.length} sesiones`}>
                  {dayBookings.slice(0, 3).map((b) => (
                    <span key={b.id} className="size-1.5 rounded-full bg-primary" />
                  ))}
                </span>
              )}
              <ul className="hidden flex-col gap-1 sm:flex">
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
      <ol className="flex flex-col divide-y divide-border rounded-lg border border-border sm:hidden" aria-label="Sesiones del mes">
        {monthBookings.length === 0 ? (
          <li className="p-4 text-center text-sm text-muted-foreground">Sin sesiones este mes.</li>
        ) : (
          monthBookings.map((booking) => (
            <li key={booking.id} className="flex flex-col gap-0.5 p-3 text-sm">
              <span className="font-medium">{booking.title}</span>
              <span className="text-xs text-muted-foreground">
                {formatDateTime(booking.scheduledAt)} · {clientNames.get(booking.clientId) ?? "—"}
              </span>
            </li>
          ))
        )}
      </ol>
    </section>
  );
}
