import { NextResponse, type NextRequest } from 'next/server'

const ADMIN_PATHS = [/^\/admin(\/.*)?$/, /^\/api\/admin(\/.*)?$/, /^\/api\/upload$/]

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Ne filtre que les zones admin
  const isAdminZone = ADMIN_PATHS.some((re) => re.test(pathname))
  if (!isAdminZone) return NextResponse.next()

  // Si l'admin est désactivé, 404
  if (process.env.ADMIN_ENABLED !== 'true') {
    return NextResponse.redirect(new URL('/404', req.url))
  }

  // Vérifie cookie de session admin (HttpOnly, défini au login)
  const session = req.cookies.get('pb_admin_session')?.value
  if (session !== 'ok') {
    // Option: autoriser le header d’automatisation Vercel en cas d’usage outillé
    const bypass = req.headers.get('x-vercel-protection-bypass')
    if (bypass && bypass === process.env.VERCEL_AUTOMATION_BYPASS_SECRET) {
      return NextResponse.next()
    }
    const url = new URL('/admin/login', req.url)
    url.searchParams.set('next', pathname)
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*', '/api/upload'],
}