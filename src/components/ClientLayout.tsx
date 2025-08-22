// src/components/ClientLayout.tsx
'use client'
import { usePathname } from 'next/navigation'

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  // Remontage à chaque route => position de scroll réinitialisée
  return <div key={pathname}>{children}</div>
}