import type { ExchangeRates } from "@souvenirs/shared";

export function BsEquivalent({
  amount,
  currency,
  rates,
}: {
  amount: string | number;
  currency: string;
  rates: ExchangeRates;
}) {
  if (currency !== "USD" || (!rates.oficial && !rates.paralelo)) {
    return null;
  }

  const amountUsd = Number(amount);
  const parts: string[] = [];
  if (rates.oficial) {
    const bs = amountUsd * Number(rates.oficial.rate);
    parts.push(`${bs.toLocaleString("es-VE", { maximumFractionDigits: 2 })} Bs (oficial)`);
  }
  if (rates.paralelo) {
    const bs = amountUsd * Number(rates.paralelo.rate);
    parts.push(`${bs.toLocaleString("es-VE", { maximumFractionDigits: 2 })} Bs (paralelo)`);
  }

  return <span className="block text-xs text-muted-foreground">≈ {parts.join(" · ")}</span>;
}
