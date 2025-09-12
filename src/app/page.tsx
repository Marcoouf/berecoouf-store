'use client'

// src/app/page.tsx
import { useEffect } from 'react'
import Site from '@/components/UI'
import { getCatalog } from '@/lib/getCatalog'

export const dynamic = 'force-dynamic'

export default async function Page({
  searchParams,
}: {
  searchParams?: { cart?: string }
}) {
  const openCart = searchParams?.cart === '1'
  const catalog = await getCatalog()

  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => e.preventDefault()
    const handleDragStart = (e: DragEvent) => e.preventDefault()
    document.addEventListener('contextmenu', handleContextMenu)
    document.addEventListener('dragstart', handleDragStart)
    return () => {
      document.removeEventListener('contextmenu', handleContextMenu)
      document.removeEventListener('dragstart', handleDragStart)
    }
  }, [])

  return <Site openCartOnLoad={openCart} catalog={catalog} />
}