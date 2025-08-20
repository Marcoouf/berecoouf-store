// src/app/page.tsx
import Site from '@/components/UI'

export default function Page({
  searchParams,
}: {
  searchParams?: { cart?: string }
}) {
  const openCart = searchParams?.cart === '1'
  return <Site openCartOnLoad={openCart} />
}