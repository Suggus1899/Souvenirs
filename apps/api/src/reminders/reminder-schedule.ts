const DAY_MS = 24 * 60 * 60 * 1000;

export function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * DAY_MS);
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString('es-VE', { timeZone: 'UTC' });
}

/** "vence en 3 días" / "vence hoy" / "venció hace 2 días" relative to the due date. */
export function duePhrase(offsetDays: number): string {
  if (offsetDays === 0) return 'vence hoy';
  const n = Math.abs(offsetDays);
  const days = n === 1 ? '1 día' : `${n} días`;
  return offsetDays < 0 ? `vence en ${days}` : `venció hace ${days}`;
}
