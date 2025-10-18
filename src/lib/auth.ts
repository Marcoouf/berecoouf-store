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
      async authorize(rawCredentials) {
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
