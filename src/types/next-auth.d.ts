import type { DefaultSession } from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: DefaultSession['user'] & {
      id: string
      role: 'admin' | 'author'
      artistIds: string[]
      artistSlugs: string[]
    }
  }

  interface User {
    role: 'admin' | 'author'
    artistIds?: string[]
    artistSlugs?: string[]
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string
    role?: 'admin' | 'author'
    artistIds?: string[]
    artistSlugs?: string[]
  }
}
