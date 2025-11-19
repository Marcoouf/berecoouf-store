import { NextRequest } from 'next/server'
import { assertAdmin } from '@/lib/adminAuth'

export function withAdmin<T extends (req: NextRequest, ...rest: any[]) => Promise<Response>>(handler: T) {
  return async (req: NextRequest, ...rest: any[]) => {
    const denied = await assertAdmin(req)
    if (denied) return denied
    return handler(req, ...rest)
  }
}
