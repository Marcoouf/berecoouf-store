import { NextResponse } from 'next/server'
import { withAuth } from 'next-auth/middleware'
import type { NextRequestWithAuth } from 'next-auth/middleware'

export default withAuth(
  function middleware(req: NextRequestWithAuth) {
    const token = req.nextauth?.token
    if (!token) {
      const loginUrl = new URL('/login', req.nextUrl.origin)
      loginUrl.searchParams.set('callbackUrl', req.nextUrl.pathname + req.nextUrl.search)
      return NextResponse.redirect(loginUrl)
    }

    const pathname = req.nextUrl.pathname
    const role = token.role

    if (pathname.startsWith('/admin') && role !== 'admin') {
      return NextResponse.redirect(new URL('/dashboard', req.nextUrl.origin))
    }

    if (pathname.startsWith('/dashboard') && role !== 'admin' && !token.artistIds?.length) {
      // Auteur sans artiste lié → refuse l’accès jusqu’à assignation
      const contactUrl = new URL('/login', req.nextUrl.origin)
      contactUrl.searchParams.set('error', 'not_authorized')
      return NextResponse.redirect(contactUrl)
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized({ token }) {
        return !!token
      },
    },
  },
)

export const config = {
  matcher: ['/admin/:path*', '/dashboard/:path*'],
}
