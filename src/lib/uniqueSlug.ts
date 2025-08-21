// src/lib/uniqueSlug.ts
import { slugify } from './slug'

export function uniqueSlug(base: string, taken: Set<string>) {
  let s = slugify(base)
  let i = 2
  const original = s
  while (taken.has(s)) {
    s = `${original}-${i++}`
  }
  taken.add(s)
  return s
}