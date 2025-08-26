'use client'

import { useEffect } from 'react'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Ajoute la classe sur <body> uniquement dans la zone admin,
  // et la retire quand on quitte cette zone.
  useEffect(() => {
    document.body.classList.add('admin-page')
    return () => document.body.classList.remove('admin-page')
  }, [])

  // Ne pas rendre <html> ou <body> ici — ils sont fournis par le root layout.
  return <>{children}</>
}
