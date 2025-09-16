'use client'

import React, { createContext, useContext, useMemo, useState } from 'react'
import type { Artwork, Format } from '@/lib/types'

const STORAGE_KEY = 'cart-v1';

function safeLoad<T>(key: string): T | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function safeSave<T>(key: string, value: T) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

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
  overlayClick: (e: React.MouseEvent<HTMLDivElement>) => void
  checkingOut: boolean
  checkout: (options?: { email?: string }) => Promise<void>
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
  const [checkingOut, setCheckingOut] = useState(false)

  React.useEffect(() => {
    const data = safeLoad<{ items: CartItem[] }>(STORAGE_KEY);
    if (data && Array.isArray(data.items)) {
      setItems(data.items);
    }
  }, []);

  React.useEffect(() => {
    safeSave(STORAGE_KEY, { items });
  }, [items]);

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

  const overlayClick: CartCtx['overlayClick'] = (e) => {
    // Ferme uniquement si on clique en dehors du panneau (id="cart-drawer").
    const panel = typeof document !== 'undefined' ? document.getElementById('cart-drawer') : null;
    const target = e.target as Node | null;
    if (panel && target && panel.contains(target)) {
      return; // clic à l'intérieur du panier -> ne rien faire
    }
    setOpen(false); // clic sur l'overlay -> fermer
  };

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
    setCheckingOut(true)
    try {
      const mapped = items.map(i => ({
        workId: i.artwork.id,
        variantId: i.format?.id ?? `${i.artwork.id}-default`,
        title: i.artwork.title,
        artistName: (i.artwork as any).artist?.name ?? (i.artwork as any).artistName,
        image: (i.artwork as any).image ?? (Array.isArray((i.artwork as any).images) ? (i as any).artwork.images?.[0] : undefined),
        price: Number(i.format?.price ?? i.artwork.price ?? 0),
        qty: Number(i.qty ?? 1),
      }))
      await goToCheckout({ items: mapped, email: options?.email })
    } catch (e) {
      console.error(e)
      alert('Une erreur est survenue lors de la création du paiement. Réessayez.')
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
  }

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}