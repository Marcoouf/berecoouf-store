// src/lib/adminGuard.ts
import { cookies } from 'next/headers'

export function assertAdmin() {
  if (process.env.ADMIN_ENABLED !== 'true') throw new Error('Admin disabled')
  const session = cookies().get('pb_admin_session')?.value
  if (session !== 'ok') {
    const e = new Error('Unauthorized')
    // @ts-expect-error
    e.status = 401
    throw e
  }
}