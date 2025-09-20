'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect } from 'react'

/**
 * Client-only helper mounted on /merci
 * - makes the CTA buttons work reliably
 * - (optionally) clears any page-level overlays that could block clicks
 * - can react to the `session_id` query param if needed later
 */
export default function CheckoutSuccessClient() {
  const router = useRouter()
  const search = useSearchParams()
  const sessionId = search.get('session_id') || null

  // Defensive: make sure nothing is blocking pointer events on this page
  useEffect(() => {
    // If a global overlay/backdrop was left mounted by mistake, disable its pointer events.
    const offenders = document.querySelectorAll<HTMLElement>('[data-overlay], [data-backdrop], .app-overlay')
    offenders.forEach((el) => {
      el.style.pointerEvents = 'none'
    })
  }, [])

  return (
    <div className="mt-6 flex flex-col items-center gap-3 pointer-events-auto">
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          router.push('/')
        }}
        className="rounded-full bg-accent hover:bg-accent-dark text-ink font-medium px-4 py-2 text-sm shadow-sm transition"
        aria-label="Retourner à l’accueil"
      >
        Retourner à la galerie
      </button>

      {/* Affichage discret du session_id en data-attr pour debug si présent */}
      {sessionId ? (
        <span data-session-id={sessionId} className="sr-only">
          {sessionId}
        </span>
      ) : null}
    </div>
  )
}