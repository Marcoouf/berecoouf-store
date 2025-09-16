'use client'

import { useEffect } from 'react'
import { useCart } from '@/components/CartContext'

export default function CheckoutSuccessClient() {
  const { clear } = useCart()
  useEffect(() => {
    // vide le panier au montage de la page merci
    clear()
  }, [clear])

  return null
}