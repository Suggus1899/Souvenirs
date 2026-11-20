/** Money arrives from the API as decimal strings ("12.30"); do the math in integer cents to avoid float drift. */
export function toCents(amount: string | number): number {
  return Math.round(Number(amount) * 100);
}

export function formatMoney(cents: number, currency: string): string {
  try {
    return new Intl.NumberFormat("es-VE", { style: "currency", currency }).format(cents / 100);
  } catch {
    // Unknown ISO code: still show something readable.
    return `${(cents / 100).toFixed(2)} ${currency}`;
  }
}

export function formatAmount(amount: string | number, currency: string): string {
  return formatMoney(toCents(amount), currency);
}
