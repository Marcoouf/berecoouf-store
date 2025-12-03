export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { getAuthSession } from '@/lib/auth'

export default async function AdminDashboardPage() {
  const session = await getAuthSession()
  if (!session?.user) {
    redirect('/login?callbackUrl=/admin')
  }
  // On concentre tout sur /dashboard pour éviter le doublon /admin et /dashboard.
  redirect('/dashboard')
}
