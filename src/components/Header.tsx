'use client'

import Link from 'next/link'
import { motion, useScroll, useSpring, useReducedMotion } from 'framer-motion'
import { useCartCtx } from '@/components/CartContext'
import { useCartCount } from '@/state/cart'
import { usePathname, useSearchParams } from 'next/navigation'
import { useState, type ReactNode } from 'react'

function Container({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`mx-auto w-full max-w-6xl px-4 sm:px-6 ${className}`}>{children}</div>
}

export default function HeaderGlobal() {
  const { scrollYProgress } = useScroll()
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 30, restDelta: 0.001 })

  const prefersReduced = useReducedMotion()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const is = (p: string) => (pathname ?? '').startsWith(p)
  const isRecent = pathname === '/artworks' && searchParams?.get('sort') === 'recent'

  // Cart (compteur + ouverture) — éviter la désynchro SSR/CSR
  const { openCart, open, hydrated } = useCartCtx()
  const count = useCartCount()
  const cartLabel = hydrated ? (count > 0 ? `Panier (${count})` : 'Panier') : 'Panier'

  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-[60] w-full border-b border-line/70 bg-white/70 backdrop-blur">
      <Container className="py-3 flex items-center justify-between">
        {/* Logo + point animé */}
        <Link
          href="/"
          className="group site-brand flex items-center gap-2 text-sm tracking-widest uppercase"
          data-brand-wave
        >
          <motion.svg
            aria-hidden
            viewBox="0 0 24 12"
            className="brand-wave h-3 w-5 text-accent group-hover:text-accent-dark"
            animate={prefersReduced ? { y: 0 } : { y: [0, -1, 0] }}
            transition={prefersReduced ? undefined : { duration: 2, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' }}
            style={{ willChange: 'transform' }}
          >
            <path
              d="M1 6c2.5 0 2.5-4 5-4s2.5 4 5 4 2.5-4 5-4 2.5 4 5 4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </motion.svg>
          <span>Vague</span>
        </Link>

        {/* Burger (mobile) */}
        <button
          type="button"
          className="md:hidden flex flex-col justify-center items-center gap-1 rounded-md px-2 py-1"
          onClick={() => setMenuOpen((v) => !v)}
          aria-expanded={menuOpen}
          aria-controls="mobile-menu"
          aria-label={menuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
        >
          <span
            className={`block h-0.5 w-6 bg-neutral-700 transition-transform duration-300 ease-in-out origin-left ${menuOpen ? 'rotate-45 translate-y-1.5' : ''}`}
          />
          <span
            className={`block h-0.5 w-6 bg-neutral-700 transition-opacity duration-300 ease-in-out ${menuOpen ? 'opacity-0' : 'opacity-100'}`}
          />
          <span
            className={`block h-0.5 w-6 bg-neutral-700 transition-transform duration-300 ease-in-out origin-left ${menuOpen ? '-rotate-45 -translate-y-1.5' : ''}`}
          />
        </button>

        {/* Navigation */}
        <nav className="hidden gap-6 md:flex text-sm text-neutral-700">
          <Link
            href="/artworks?sort=recent"
            className={`link-underline hover:text-accent-700 ${isRecent ? 'text-accent-700' : ''}`}
          >
            Nouveautés
          </Link>
          <a href="/#collections" className="link-underline hover:text-accent-700">
            Collections
          </a>
          <Link
            href="/artworks"
            className={`link-underline hover:text-accent-700 ${is('/artworks') ? 'text-accent-700' : ''}`}
          >
            Galerie
          </Link>
          <Link
            href="/artists"
            className={`link-underline hover:text-accent-700 ${is('/artists') ? 'text-accent-700' : ''}`}
          >
            Artistes
          </Link>
          <Link href="/carte-cadeau" className="link-underline hover:text-accent-700">
            Carte cadeau
          </Link>
          <a href="/#about" className="link-underline hover:text-accent-700">
            À propos
          </a>
        </nav>

        {/* Bouton Panier (animé quand le compteur change) */}
        <motion.div
          key={hydrated ? count : 0}
          initial={{ scale: 1 }}
          animate={prefersReduced ? { scale: 1 } : { scale: [1, 1.12, 1] }}
          transition={prefersReduced ? undefined : { duration: 0.35, ease: 'easeOut' }}
          className="pointer-events-auto"
        >
          <button
            type="button"
            onPointerDown={(e) => {
              // éviter la fermeture du drawer par "outside click"
              e.stopPropagation()
            }}
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              openCart()
            }}
            className="btn-outline pointer-events-auto"
            aria-label="Ouvrir le panier"
            aria-expanded={open}
            aria-controls="cart-drawer"
          >
            {cartLabel}
          </button>
        </motion.div>
        <span className="sr-only" aria-live="polite">
          {hydrated ? `Panier : ${count} article${count > 1 ? 's' : ''}` : ''}
        </span>
      </Container>

      {/* Mobile menu */}
      {menuOpen && (
        <div id="mobile-menu" className="md:hidden border-t border-line/70 bg-white">
          <Container className="py-3 flex flex-col gap-2 text-sm text-center">
            <Link href="/artworks?sort=recent" onClick={() => setMenuOpen(false)} className="py-2 hover:text-accent-700 transition-colors">
              Nouveautés
            </Link>
            <a href="/#collections" onClick={() => setMenuOpen(false)} className="py-2 hover:text-accent-700 transition-colors">
              Collections
            </a>
            <Link href="/artworks" onClick={() => setMenuOpen(false)} className="py-2 hover:text-accent-700 transition-colors">
              Galerie
            </Link>
            <Link href="/artists" onClick={() => setMenuOpen(false)} className="py-2 hover:text-accent-700 transition-colors">
              Artistes
            </Link>
            <Link href="/carte-cadeau" onClick={() => setMenuOpen(false)} className="py-2 hover:text-accent-700 transition-colors">
              Carte cadeau
            </Link>
            <a href="/#about" onClick={() => setMenuOpen(false)} className="py-2 hover:text-accent-700 transition-colors">
              À propos
            </a>
          </Container>
        </div>
      )}

      {/* Barre de progression sous le header */}
      <div className="relative h-[3px] bg-accent/25">
        <motion.div
          className="absolute left-0 top-0 h-[3px] w-full bg-accent origin-left shadow-[0_1px_0_rgba(0,0,0,0.06)]"
          style={{ scaleX }}
        />
      </div>
    </header>
  )
}