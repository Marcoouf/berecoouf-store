import { redirect } from 'next/navigation'
import { getAuthSession } from '@/lib/auth'
import OrdersClient from './OrdersClient'

export const dynamic = 'force-dynamic'

export default async function OrdersPage() {
  const session = await getAuthSession()
  if (!session?.user) {
    redirect('/login?callbackUrl=/dashboard/orders')
  }

  return <OrdersClient />
}

