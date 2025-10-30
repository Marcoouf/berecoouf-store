import { NextResponse } from 'next/server'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'current_password_required'),
  newPassword: z.string().min(8, 'new_password_too_short'),
})

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  const userId = session?.user?.id

  if (!userId) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })
  }

  const body = await req.json().catch(() => null)
  const parsed = changePasswordSchema.safeParse(body)
  if (!parsed.success) {
    const firstIssue = parsed.error.issues?.[0]
    return NextResponse.json({ ok: false, error: firstIssue?.message || 'invalid_payload' }, { status: 400 })
  }

  const { currentPassword, newPassword } = parsed.data

  if (currentPassword === newPassword) {
    return NextResponse.json({ ok: false, error: 'password_unchanged' }, { status: 400 })
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { passwordHash: true },
  })

  if (!user?.passwordHash) {
    return NextResponse.json({ ok: false, error: 'password_not_set' }, { status: 400 })
  }

  const validCurrent = await bcrypt.compare(currentPassword, user.passwordHash)
  if (!validCurrent) {
    return NextResponse.json({ ok: false, error: 'invalid_current_password' }, { status: 400 })
  }

  const newHash = await bcrypt.hash(newPassword, 10)
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: newHash },
  })

  return NextResponse.json({ ok: true })
}
