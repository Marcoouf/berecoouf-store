'use client'
import { usePathname, useSearchParams } from 'next/navigation'
import { useEffect } from 'react'

export default function ScrollManager() {
  const pathname = usePathname()
  const search = useSearchParams()

  // Désactive la restauration automatique du navigateur
  useEffect(() => {
    if ('scrollRestoration' in history) {
      const prev = history.scrollRestoration
      history.scrollRestoration = 'manual'
      return () => { history.scrollRestoration = prev }
    }
  }, [])

  // Remonte en haut sur chaque navigation quand il n’y a PAS de hash (#...)
  useEffect(() => {
    const hasHash = typeof window !== 'undefined' && window.location.hash
    if (!hasHash) {
      // on attend un frame pour laisser le DOM se peindre
      requestAnimationFrame(() => {
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior })
      })
    }
  }, [pathname, search])

  return null
}