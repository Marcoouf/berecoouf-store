// src/lib/price.ts
export const toStripeAmount = (centsOrEuros: number) => {
  // Si tu stockes déjà en centimes, retourne tel quel.
  // Ici on considère que le panier est en centimes.
  return Math.round(centsOrEuros);
};