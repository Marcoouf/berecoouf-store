'use client'

import Link from 'next/link'
import { motion, useScroll, useSpring, useTransform } from 'framer-motion'
import { useEffect, useState } from 'react'

function Container({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`mx-auto w-full max-w-6xl px-6 ${className}`}>{children}</div>
}

export default function HeaderGlobal() {
  const { scrollYProgress } = useScroll()
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 30, restDelta: 0.001 })

  // petit effet de fond coloré au scroll
  const bgOpacity = useTransform(scrollYProgress, [0, 0.1], [0, 1])
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    return scrollYProgress.on("change", (latest) => {
      setScrolled(latest > 0.05)
    })
  }, [scrollYProgress])

  return (
    <header
      className={`
        sticky top-0 z-40 w-full border-b border-line/70 backdrop-blur transition-colors
        ${scrolled ? 'bg-white/90 shadow-[0_1px_3px_rgba(0,0,0,0.06)]' : 'bg-white/70'}
      `}
    >
      <Container className="py-3 flex items-center justify-between">
        <Link
          href="/"
          className="text-sm tracking-widest uppercase text-neutral-900 hover:text-accent transition-colors"
        >
          Berecoouf
        </Link>

        <nav className="hidden gap-6 md:flex text-sm">
          <Link
            href="/artists"
            className="hover:text-accent hover:underline underline-offset-4 transition-colors"
          >
            Artistes
          </Link>
          <Link
            href="/artworks"
            className="hover:text-accent hover:underline underline-offset-4 transition-colors"
          >
            Œuvres
          </Link>
          <a
            href="/#about"
            className="hover:text-accent hover:underline underline-offset-4 transition-colors"
          >
            À propos
          </a>
        </nav>

        <Link
          href="/?cart=1"
          className="rounded-full border border-accent px-3 py-1 text-sm text-accent hover:bg-accent hover:text-white transition-colors"
        >
          Panier
        </Link>
      </Container>

      {/* Progress bar sous le header */}
      <div className="relative h-[3px] bg-accent/20">
        <motion.div
          className="absolute left-0 top-0 h-[3px] w-full bg-accent origin-left shadow-[0_1px_0_rgba(0,0,0,0.08)]"
          style={{ scaleX }}
        />
      </div>
    </header>
  )
}