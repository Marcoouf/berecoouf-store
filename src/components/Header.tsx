'use client'

import Link from 'next/link'
import { motion, useScroll, useSpring } from 'framer-motion'

function Container({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`mx-auto w-full max-w-6xl px-6 ${className}`}>{children}</div>
}

export default function HeaderGlobal() {
  const { scrollYProgress } = useScroll()
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 30, restDelta: 0.001 })

  return (
    <header className="sticky top-0 z-40 w-full border-b border-line/70 bg-white/70 backdrop-blur">
      <Container className="py-3 flex items-center justify-between">
        {/* Logo + point animé */}
        <Link href="/" className="group flex items-center gap-2 text-sm tracking-widest uppercase">
          <motion.span
            aria-hidden
            className="h-2.5 w-2.5 rounded-full bg-accent group-hover:bg-accent-dark"
            animate={{ scale: [1, 1.15, 1] }}
            transition={{ duration: 2, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' }}
            // Accessibilité : pas d’animation si l’utilisateur préfère réduire les animations
            style={{ willChange: 'transform' }}
          />
          <span>Point Bleu</span>
        </Link>

        {/* Navigation */}
        <nav className="hidden gap-6 md:flex text-sm text-neutral-600">
          <Link href="/artists" className="hover:underline underline-offset-4">Artistes</Link>
          <Link href="/artworks" className="hover:underline underline-offset-4">Œuvres</Link>
          <a href="/#about" className="hover:underline underline-offset-4">À propos</a>
        </nav>

        {/* Panier */}
        <Link
          href="/?cart=1"
          className="rounded-full border border-accent px-3 py-1 text-sm text-accent hover:bg-accent-light transition"
        >
          Panier
        </Link>
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