/**
 * slugify
 * ---------------------------------------------------------
 * - Normalise en NFKD pour décomposer aussi les ligatures (ex: Œ → OE).
 * - Supprime les diacritiques (accents).
 * - Translitère quelques ligatures/caractères connus (œ, æ, ß).
 * - Remplace toute séquence non [a-z0-9] par un tiret.
 * - Compacte les tirets et supprime ceux en début/fin.
 *
 * Exemples :
 *  "Œuvre d’été"  -> "oeuvre-d-ete"
 *  "Bérénice Duchemin" -> "berenice-duchemin"
 */
export function slugify(input: string): string {
  const normalized = input
    // Décompose les caractères (compatibility), gère les ligatures
    .normalize('NFKD')
    // Supprime les diacritiques (accents) issus de la décomposition
    .replace(/[\u0300-\u036f]/g, '')
    // Translitérations utiles en FR / EU
    .replace(/œ/g, 'oe')
    .replace(/Œ/g, 'OE')
    .replace(/æ/g, 'ae')
    .replace(/Æ/g, 'AE')
    .replace(/ß/g, 'ss');

  return normalized
    .toLowerCase()
    // Tout ce qui n'est pas alphanum devient un séparateur
    .replace(/[^a-z0-9]+/g, '-')
    // Compacte les séparateurs multiples
    .replace(/-{2,}/g, '-')
    // Retire tirets en début/fin
    .replace(/(^-|-$)/g, '');
}