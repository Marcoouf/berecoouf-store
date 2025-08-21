'use client'

import React, { createContext, useContext, useMemo, useState } from 'react'
import type { Artwork, Format } from '@/lib/types'

type CartItem = {
  key: string
  artwork: Artwork
  format: Format | null
  qty: number
}

type CartCtx = {
  items: CartItem[]
  add: (artwork: Artwork, format: Format | null) => void
  remove: (key: string) => void
  updateQty: (key: string, qty: number) => void
  clear: () => void
  total: number
  itemCount: number
  /** Signal horodaté pour déclencher une animation (ex: bouton Panier) */
  lastAdded: number
  open: boolean
  openCart: () => void
  closeCart: () => void
  toggleCart: () => void
}

const CartContext = createContext<CartCtx | null>(null)

export const useCart = () => {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [lastAdded, setLastAdded] = useState<number>(0)
  const [open, setOpen] = useState(false)

  const add: CartCtx['add'] = (artwork, format) => {
    setItems(prev => {
      const key = `${artwork.id}-${format?.id ?? 'std'}`
      const found = prev.find(i => i.key === key)
      if (found) {
        // Incrémente la quantité si déjà présent
        return prev.map(i => (i.key === key ? { ...i, qty: i.qty + 1 } : i))
      }
      // Ajoute une nouvelle ligne
      return [...prev, { key, artwork, format, qty: 1 }]
    })
    // Déclenche le signal d’anim (timestamp unique)
    setLastAdded(Date.now())
    setOpen(true)
  }

  const remove: CartCtx['remove'] = (key) =>
    setItems(prev => prev.filter(i => i.key !== key))

  const updateQty: CartCtx['updateQty'] = (key, qty) =>
    setItems(prev =>
      prev.map(i =>
        i.key === key ? { ...i, qty: Math.max(1, qty) } : i
      )
    )

  const clear = () => setItems([])

  const total = useMemo(
    () => items.reduce((acc, i) => acc + (i.format?.price ?? i.artwork.price) * i.qty, 0),
    [items]
  )

  const itemCount = useMemo(
    () => items.reduce((acc, i) => acc + i.qty, 0),
    [items]
  )

  const openCart = () => setOpen(true)
  const closeCart = () => setOpen(false)
  const toggleCart = () => setOpen(o => !o)

  const value: CartCtx = {
    items,
    add,
    remove,
    updateQty,
    clear,
    total,
    itemCount,
    lastAdded,
    open,
    openCart,
    closeCart,
    toggleCart,
  }

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}