// src/app/page.tsx

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
  return <Site openCartOnLoad={openCart} catalog={catalog} />
}