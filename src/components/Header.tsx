'use client'

import Link from 'next/link'
import { motion, useScroll, useSpring, useReducedMotion } from 'framer-motion'
import { useCart } from '@/components/CartContext'
import { usePathname } from 'next/navigation'

function Container({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`mx-auto w-full max-w-6xl px-6 ${className}`}>{children}</div>
}

export default function HeaderGlobal() {
  const { scrollYProgress } = useScroll()
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 30, restDelta: 0.001 })

  const prefersReduced = useReducedMotion()
  const pathname = usePathname()
  const is = (p: string) => (pathname ?? '').startsWith(p)

  // Cart infos pour l'anim + compteur
  const { itemCount, lastAdded, toggleCart, open } = useCart()

  return (
    <header className="sticky top-0 z-40 w-full border-b border-line/70 bg-white/70 backdrop-blur">
      <Container className="py-3 flex items-center justify-between">
        {/* Logo + point animé */}
        <Link href="/" className="group flex items-center gap-2 text-sm tracking-widest uppercase">
          <motion.span
            aria-hidden
            className="h-2.5 w-2.5 rounded-full bg-accent group-hover:bg-accent-dark"
            animate={prefersReduced ? { scale: 1 } : { scale: [1, 1.15, 1] }}
            transition={prefersReduced ? undefined : { duration: 2, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' }}
            style={{ willChange: 'transform' }}
          />
          <span>Point Bleu</span>
        </Link>

        {/* Navigation */}
        <nav className="hidden gap-6 md:flex text-sm text-neutral-700">
          <Link href="/artists"  className={`link-underline hover:text-accent-700 ${is('/artists') ? 'text-accent-700' : ''}`}>Artistes</Link>
          <Link href="/artworks" className={`link-underline hover:text-accent-700 ${is('/artworks') ? 'text-accent-700' : ''}`}>Œuvres</Link>
          <a    href="/#about"   className={`link-underline hover:text-accent-700 ${is('/#about') ? 'text-accent-700' : ''}`}>À propos</a>
        </nav>

        {/* Panier animé à chaque ajout */}
        <motion.div
          key={lastAdded}                       // relance l'anim à chaque ajout
          initial={{ scale: 1 }}
          animate={prefersReduced ? { scale: 1 } : { scale: [1, 1.12, 1] }}
          transition={prefersReduced ? undefined : { duration: 0.35, ease: 'easeOut' }}
        >
          <button
            type="button"
            onClick={toggleCart}
            className="btn-outline"
            aria-label="Ouvrir le panier"
            aria-expanded={open}
            aria-controls="cart-drawer"
          >
            Panier{itemCount > 0 ? ` (${itemCount})` : ''}
          </button>
        </motion.div>
      </Container>

      {/* Progress bar sous le header */}
      <div className="relative h-[3px] bg-accent/25">
        <motion.div
          className="absolute left-0 top-0 h-[3px] w-full bg-accent origin-left shadow-[0_1px_0_rgba(0,0,0,0.06)]"
          style={{ scaleX }}
        />
      </div>
    </header>
  )
}