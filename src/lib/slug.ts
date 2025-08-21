export function slugify(input: string) {
  return input
    .normalize('NFD').replace(/\p{Diacritic}/gu, '')  // retire les accents
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')                      // espaces/ponctuation → tirets
    .replace(/(^-|-$)/g, '');
}