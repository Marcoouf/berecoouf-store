import Link from 'next/link'

export type Crumb = { label: string; href?: string }

export default function Breadcrumb({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Fil d’Ariane" className="text-xs text-neutral-500">
      <ol className="flex flex-wrap items-center gap-0.5 sm:gap-1">
        {items.map((it, i) => (
          <li
            key={i}
            className={`flex items-center gap-0.5 sm:gap-1 max-w-[120px] sm:max-w-none truncate ${
              !it.href && i === items.length - 1 ? 'text-accent font-medium' : ''
            }`}
          >
            {it.href ? (
              <Link
                href={it.href}
                className="truncate hover:underline hover:text-accent transition-colors"
              >
                {it.label}
              </Link>
            ) : (
              <span className="truncate">{it.label}</span>
            )}
            {i < items.length - 1 && (
              <span className="px-0.5 sm:px-1 text-neutral-400">/</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}
