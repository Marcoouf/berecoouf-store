// src/lib/format.ts
/** Prix au format "1 200 €" avec espace insécable */
export function euro(value: number) {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(value); // => "1 200 €"
}