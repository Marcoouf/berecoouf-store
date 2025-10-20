'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { useCartCtx } from '@/components/CartContext'

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
  const { clear, hydrated } = useCartCtx()
  const clearedRef = useRef(false)
  const [showToast, setShowToast] = useState(false)

  // Defensive: make sure nothing is blocking pointer events on this page
  useEffect(() => {
    // If a global overlay/backdrop was left mounted by mistake, disable its pointer events.
    const offenders = document.querySelectorAll<HTMLElement>('[data-overlay], [data-backdrop], .app-overlay')
    offenders.forEach((el) => {
      el.style.pointerEvents = 'none'
    })
  }, [])

  // Vide le panier une fois la commande confirmée (après hydratation côté client)
  useEffect(() => {
    if (!hydrated || !sessionId || clearedRef.current) return
    clear()
    clearedRef.current = true
    setShowToast(true)
    const timer = setTimeout(() => setShowToast(false), 4000)
    return () => clearTimeout(timer)
  }, [hydrated, sessionId, clear])

  return (
    <>
      {showToast ? (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 right-6 z-50 rounded-full bg-emerald-500/95 px-4 py-3 text-sm font-medium text-white shadow-lg"
        >
          Panier vidé après paiement
        </div>
      ) : null}
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
    </>
  )
}
