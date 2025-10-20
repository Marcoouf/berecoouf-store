import { PrismaAdapter } from '@next-auth/prisma-adapter'
import type { NextAuthOptions } from 'next-auth'
import { getServerSession } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
})

function readHeader(headers: any, name: string): string | null {
  if (!headers) return null
  if (typeof headers.get === 'function') {
    const value = headers.get(name)
    return typeof value === 'string' && value.length ? value : null
  }
  if (typeof headers === 'object') {
    const key = Object.keys(headers).find((k) => k.toLowerCase() === name.toLowerCase())
    if (!key) return null
    const rawValue = (headers as Record<string, unknown>)[key]
    if (Array.isArray(rawValue)) {
      return rawValue[0] ?? null
    }
    if (typeof rawValue === 'string') {
      return rawValue.length ? rawValue : null
    }
  }
  return null
}

function extractClientIp(req: any): string | null {
  const forwarded = readHeader(req?.headers, 'x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0]?.trim() || null
  }
  const realIp = readHeader(req?.headers, 'x-real-ip')
  if (realIp) {
    return realIp.split(',')[0]?.trim() || null
  }
  const directIp = req?.ip
  if (typeof directIp === 'string') return directIp
  if (Array.isArray(directIp)) return directIp[0] ?? null
  return null
}

function extractUserAgent(req: any): string | null {
  const userAgent = readHeader(req?.headers, 'user-agent')
  return userAgent ? userAgent.slice(0, 512) : null
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/login',
  },
  providers: [
    CredentialsProvider({
      name: 'Email et mot de passe',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Mot de passe', type: 'password' },
      },
      async authorize(rawCredentials, req) {
        const parsed = credentialsSchema.safeParse(rawCredentials)
        if (!parsed.success) {
          throw new Error('credentials_invalid')
        }
        const { email, password } = parsed.data
        const normalizedEmail = email.trim().toLowerCase()

        const user = await prisma.user.findUnique({
          where: { email: normalizedEmail },
          include: {
            artists: {
              include: {
                artist: { select: { id: true, slug: true } },
              },
            },
          },
        })

        if (!user) {
          throw new Error('invalid_credentials')
        }
        if (!user.passwordHash) {
          throw new Error('password_not_set')
        }

        const ok = await bcrypt.compare(password, user.passwordHash)
        if (!ok) {
          throw new Error('invalid_credentials')
        }

        const artistIds = user.artists.map((a) => a.artistId)
        const artistSlugs = user.artists
          .map((a) => a.artist?.slug)
          .filter((slug): slug is string => typeof slug === 'string' && slug.length > 0)

        const clientIp = extractClientIp(req)
        const userAgent = extractUserAgent(req)
        try {
          await prisma.loginEvent.create({
            data: {
              userId: user.id,
              ip: clientIp,
              userAgent,
            },
          })
        } catch (err) {
          console.error('login_event_create_failed', err)
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          artistIds,
          artistSlugs,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = (user as any).role
        token.artistIds = (user as any).artistIds ?? []
        token.artistSlugs = (user as any).artistSlugs ?? []
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = (token.role as any) ?? 'author'
        session.user.artistIds = (token.artistIds as string[]) ?? []
        session.user.artistSlugs = (token.artistSlugs as string[]) ?? []
      }
      return session
    },
  },
}

export function getAuthSession() {
  return getServerSession(authOptions)
}
