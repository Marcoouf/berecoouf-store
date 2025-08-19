import Link from 'next/link'

export type Crumb = { label: string; href?: string }

export default function Breadcrumb({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Fil d’Ariane" className="text-xs text-neutral-500">
      <ol className="flex flex-wrap items-center gap-1">
        {items.map((it, i) => (
          <li key={i} className="flex items-center gap-1">
            {it.href ? (
              <Link href={it.href} className="hover:underline">{it.label}</Link>
            ) : (
              <span className="text-neutral-700">{it.label}</span>
            )}
            {i < items.length - 1 && <span className="px-1">/</span>}
          </li>
        ))}
      </ol>
    </nav>
  )
}
