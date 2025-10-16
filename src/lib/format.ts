// src/lib/format.ts
type Cents = number;

const EUR_NO_CENTS = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

export function euro(v: Cents | null | undefined) {
  const n = Number(v);
  if (!Number.isFinite(n)) return '—';
  return EUR_NO_CENTS.format(n / 100);
}