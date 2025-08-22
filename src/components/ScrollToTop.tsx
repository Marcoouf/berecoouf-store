'use client'

import { usePathname } from 'next/navigation'
import { useEffect } from 'react'

export default function ScrollToTop() {
  const pathname = usePathname()

  useEffect(() => {
    // À chaque changement d’URL, remonte en haut
    requestAnimationFrame(() => {
      window.scrollTo({ top: 0, left: 0 }) // pas d’animation => pas d’effet « collant »
    })
  }, [pathname])

  return null
}