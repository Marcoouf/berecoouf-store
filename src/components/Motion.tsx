'use client'

import React, { Children, useEffect, useState } from 'react'

type FadeInProps = { children: React.ReactNode; delay?: number; className?: string }
type StaggerProps = { children: React.ReactNode; className?: string }

/**
 * Hydration-safe:
 * - SSR : même DOM qu’au client (un simple <div> + enfants)
 * - CSR : on ajoute les classes d’animation après hydratation
 */
export function FadeIn({ children, delay = 0, className = '' }: FadeInProps) {
  const [ready, setReady] = useState(false)
  useEffect(() => setReady(true), [])
  return (
    <div
      className={[
        className,
        ready ? 'animate-fadeUp will-change-transform' : 'opacity-0 translate-y-2',
      ].join(' ')}
      style={ready ? { animationDelay: `${delay}s` } : undefined}
    >
      {children}
    </div>
  )
}

/**
 * Stagger hydratation-safe:
 * - wrapper en display:contents (ne casse pas la grille)
 * - chaque enfant reçoit l’anim CSS avec un delay progressif
 */
export function Stagger({ children, className = '' }: StaggerProps) {
  const [ready, setReady] = useState(false)
  const items = Children.toArray(children)
  useEffect(() => setReady(true), [])

  return (
    <div className={`contents ${className}`}>
      {items.map((child, i) => (
        <div
          key={(child as any)?.key ?? i}
          className={ready ? 'animate-fadeUp will-change-transform' : 'opacity-0 translate-y-2'}
          style={ready ? { animationDelay: `${0.06 * i}s` } : undefined}
        >
          {child}
        </div>
      ))}
    </div>
  )
}