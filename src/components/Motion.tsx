'use client'
import { motion, useReducedMotion } from 'framer-motion'
import React from 'react'

export function FadeIn({ children, delay = 0, y = 8 }: { children: React.ReactNode; delay?: number; y?: number }) {
  const prefersReduced = useReducedMotion()
  if (prefersReduced) return <>{children}</>
  return (
    <motion.div initial={{ opacity: 0, y }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.6, ease: 'easeOut', delay }}>
      {children}
    </motion.div>
  )
}

export function Stagger({ children, gap = 0.06 }: { children: React.ReactNode; gap?: number }) {
  const prefersReduced = useReducedMotion()
  if (prefersReduced) return <>{children}</>
  const items = React.Children.toArray(children)
  return <>{items.map((child, i) => <FadeIn key={i} delay={i * gap}>{child}</FadeIn>)}</>
}