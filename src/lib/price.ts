// src/lib/price.ts

/**
 * Convertit un montant en CENTIMES prêt pour Stripe.
 * ⚠️ Cette fonction attend des centimes en entrée (ex: 12000 pour 120 €).
 * - Arrondit à l'entier le plus proche
 * - Vérifie la validité (nombre fini, entier sûr, > 0)
 * - Laisse la responsabilité de la conversion euros → centimes au code appelant.
 *
 * Exemple:
 *   const unitAmount = toStripeAmount(variant.unitPriceCents) // ✅
 */
export function toStripeAmount(cents: number): number {
  if (!Number.isFinite(cents)) {
    throw new Error('amount_not_finite');
  }
  const value = Math.round(cents);
  if (!Number.isSafeInteger(value)) {
    throw new Error('amount_not_integer');
  }
  if (value <= 0) {
    throw new Error('amount_not_positive'); // Stripe n'accepte pas 0
  }
  return value;
}

/**
 * Utilitaire: convertir un prix en euros (nombre) vers des centimes (entier).
 * À utiliser uniquement en amont (admin/seed/parsing) — pas dans l’UI.
 *
 * Exemple:
 *   const cents = eurosToCents(120); // -> 12000
 */
export function eurosToCents(euros: number): number {
  if (!Number.isFinite(euros)) {
    throw new Error('euros_not_finite');
  }
  return Math.round(euros * 100);
}