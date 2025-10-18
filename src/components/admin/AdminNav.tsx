'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import React from 'react'

type NavItem = {
  href: string
  label: string
  description?: string
  match?: (pathname: string) => boolean
}

const NAV_ITEMS: NavItem[] = [
  {
    href: '/admin',
    label: 'Tableau de bord',
    description: 'Vue globale et raccourcis',
    match: pathname => pathname === '/admin',
  },
  {
    href: '/admin/works',
    label: 'Œuvres',
    description: 'Créer ou éditer une œuvre',
  },
  {
    href: '/admin/artists',
    label: 'Artistes',
    description: 'Bio, portrait, couverture…',
  },
  {
    href: '/admin/authors',
    label: 'Comptes auteurs',
    description: 'Associer comptes et artistes',
  },
  {
    href: '/admin/tools',
    label: 'Outils',
    description: 'Maintenance & scripts',
  },
]

function isActive(pathname: string, item: NavItem) {
  if (typeof item.match === 'function') return item.match(pathname)
  if (item.href === '/admin') return pathname === '/admin'
  return pathname.startsWith(item.href)
}

export function AdminNav() {
  const pathname = usePathname()

  return (
    <nav className="flex flex-col gap-0.5">
      {NAV_ITEMS.map(item => {
        const active = isActive(pathname, item)
        const descriptionClass = active ? 'mt-0.5 block text-xs text-white/70' : 'mt-0.5 block text-xs text-neutral-400'
        return (
          <Link
            key={item.href}
            href={item.href}
            className={[
              'rounded-md px-3 py-2 text-sm transition',
              active
                ? 'bg-ink text-white shadow-sm'
                : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900',
            ].join(' ')}
            aria-current={active ? 'page' : undefined}
          >
            <span className="font-medium">{item.label}</span>
            {item.description ? (
              <span className={descriptionClass}>{item.description}</span>
            ) : null}
          </Link>
        )
      })}
    </nav>
  )
}

export default AdminNav
