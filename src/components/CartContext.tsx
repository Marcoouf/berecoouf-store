'use client'

import React, { createContext, useContext, useMemo, useState, useEffect } from 'react'
import type { CartItem } from '@/lib/types'

const STORAGE_KEY = 'cart-v1'

function safeSave<T>(key: string, value: T) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {}
}

// Lecture synchrone au premier render côté client pour éviter le flash à vide
function initialItems(): CartItem[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed?.items)) return parsed.items as CartItem[]
    if (Array.isArray(parsed)) return parsed as CartItem[]
    return []
  } catch {
    return []
  }
}


type CartCtx = {
  items: CartItem[]
  add: (item: CartItem) => void
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
  overlayClick: (e: React.MouseEvent<HTMLDivElement>) => void
  checkingOut: boolean
  checkout: (options?: { email?: string }) => Promise<void>
  /** Vrai quand le contexte est hydraté côté client (évite l'état vide transitoire) */
  hydrated: boolean
}

const CartContext = createContext<CartCtx | null>(null)

export const useCartCtx = () => {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCartCtx must be used within CartProvider')
  return ctx
}

export default function CartProvider({ children }: { children: React.ReactNode }) {
  // Initialise immédiatement depuis localStorage (si présent)
  const [items, setItems] = useState<CartItem[]>(initialItems)
  const [lastAdded, setLastAdded] = useState<number>(0)
  const [open, setOpen] = useState(false)
  const [checkingOut, setCheckingOut] = useState(false)
  const [hydrated, setHydrated] = useState(false)

  // Marque le contexte comme hydraté côté client
  useEffect(() => {
    setHydrated(true)
  }, [])

  // Persistance après hydratation
  useEffect(() => {
    if (!hydrated) return
    safeSave(STORAGE_KEY, { items })
  }, [items, hydrated])

  const add: CartCtx['add'] = (item) => {
    setItems(prev => {
      const key = item.key
      const found = prev.find(i => i.key === key)
      if (found) {
        // Incrémente la quantité si déjà présent
        const inc = Math.max(1, Number(item.qty ?? 1))
        return prev.map(i => (i.key === key ? { ...i, qty: i.qty + inc } : i))
      }
      // Ajoute une nouvelle ligne (avec garde sur le prix unitaire)
      const unit = Number.isFinite(item.unitPriceCents) ? Number(item.unitPriceCents) : 0
      return [...prev, { ...item, unitPriceCents: unit, qty: Math.max(1, Number(item.qty ?? 1)) }]
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
    () => items.reduce((acc, i) => acc + i.unitPriceCents * i.qty, 0),
    [items]
  )

  const itemCount = useMemo(
    () => items.reduce((acc, i) => acc + i.qty, 0),
    [items]
  )

  const openCart = () => setOpen(true)
  const closeCart = () => setOpen(false)
  const toggleCart = () => setOpen(o => !o)

  const overlayClick: CartCtx['overlayClick'] = (e) => {
    // ferme uniquement si on clique directement sur l’overlay
    if (e.currentTarget === e.target) {
      setOpen(false)
    }
  }

  async function goToCheckout(payload: any) {
    const res = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!res.ok) throw new Error('checkout-failed')
    const data = await res.json()
    if (!data?.url) throw new Error('missing-url')
    window.location.href = data.url as string
  }

  const checkout: CartCtx['checkout'] = async (options) => {
    if (items.length === 0 || checkingOut) return

    const stripePublishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
    if (!stripePublishableKey) {
      window.location.href = '/cart'
      return
    }

    setCheckingOut(true)
    try {
      const mapped = items.map(i => ({
        workId: i.artwork.id,
        variantId: i.format?.id ?? `${i.artwork.id}-default`,
        title: i.artwork.title,
        artistName: (i.artwork as any).artist?.name ?? (i.artwork as any).artistName,
        image: (i.artwork as any).image ?? (Array.isArray((i.artwork as any).images) ? (i as any).artwork.images?.[0] : undefined),
        price: Number(i.unitPriceCents ?? 0),
        qty: Number(i.qty ?? 1),
      }))
      await goToCheckout({ items: mapped, email: options?.email })
    } catch (e) {
      console.error(e)
      alert('Une erreur est survenue lors de la création du paiement. Réessayez ou finalisez depuis le panier complet.')
      window.location.href = '/cart'
    } finally {
      setCheckingOut(false)
    }
  }

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
    overlayClick,
    checkingOut,
    checkout,
    hydrated,
  }

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

// Back-compat: certains composants importent encore { useCart } depuis ce module
export { useCartCtx as useCart };