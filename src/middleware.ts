import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(req: NextRequest) {
  const url = req.nextUrl.clone()
  const { pathname } = url

  // Index
  if (pathname === '/artistes') {
    url.pathname = '/artists'
    return NextResponse.rewrite(url)
  }
  if (pathname === '/galerie') {
    url.pathname = '/artworks'
    return NextResponse.rewrite(url)
  }

  // Slugs
  if (pathname.startsWith('/artiste/')) {
    url.pathname = pathname.replace('/artiste/', '/artists/')
    return NextResponse.rewrite(url)
  }
  if (pathname.startsWith('/oeuvre/')) {
    url.pathname = pathname.replace('/oeuvre/', '/artworks/')
    return NextResponse.rewrite(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/artistes','/galerie','/artiste/:path*','/oeuvre/:path*'],
}