// src/lib/uniqueSlug.ts
import { slugify } from './slug'

/**
 * Génère un slug unique à partir d'une base, en vérifiant un Set de slugs déjà pris.
 * - Préserve un suffixe numérique existant (ex: "titre-3" => base "titre", reprendra à 4).
 * - Peut couper le slug pour respecter une longueur max (maxLen) en tenant compte du suffixe.
 * - Gère le cas où la base est vide via `fallback` (par défaut: "untitled").
 * - Par défaut ajoute le résultat au Set (`addToSet: true`) pour éviter les collisions ultérieures.
 */
export function uniqueSlug(
  base: string,
  taken: Set<string>,
  opts?: {
    maxLen?: number
    fallback?: string
    addToSet?: boolean
  }
): string {
  const { maxLen, fallback = 'untitled', addToSet = true } = opts ?? {}

  // Slug initial
  let s = slugify((base ?? '').trim())
  if (!s) s = slugify(fallback)

  // Si le slug se termine par "-nombre", on enlève ce suffixe et on reprend le compteur à nombre+1
  let original = s
  let i = 2
  const match = original.match(/-(\d+)$/)
  if (match) {
    original = original.replace(/-\d+$/, '')
    i = Number(match[1]) + 1
  }

  // Si maxLen est défini, on tronque la base
  if (typeof maxLen === 'number' && maxLen > 0 && original.length > maxLen) {
    original = original.slice(0, maxLen)
  }

  // Premier candidat : la base (sans suffixe)
  let candidate = original

  // Tant que pris, on ajoute un suffixe incrémental en respectant maxLen
  while (taken.has(candidate)) {
    const suffix = `-${i++}`
    if (typeof maxLen === 'number' && maxLen > 0) {
      const baseMax = Math.max(1, maxLen - suffix.length) // on garde au moins 1 caractère
      candidate = `${original.slice(0, baseMax)}${suffix}`
    } else {
      candidate = `${original}${suffix}`
    }
  }

  if (addToSet) taken.add(candidate)
  return candidate
}