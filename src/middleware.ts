import { NextResponse, type NextRequest } from "next/server";

const ADMIN_PATHS = [/^\/admin(?!\/login)(\/.*)?$/, /^\/api\/admin(\/.*)?$/, /^\/api\/upload$/];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isApi = pathname.startsWith('/api/')
  const isOptions = req.method === 'OPTIONS'

  if (pathname === "/admin/login") return NextResponse.next();

  const isAdminZone = ADMIN_PATHS.some((re) => re.test(pathname));
  if (!isAdminZone) return NextResponse.next();

  if (process.env.ADMIN_ENABLED !== "true") {
    if (isApi) {
      return NextResponse.json({ ok: false, error: 'admin_disabled' }, { status: 404 })
    }
    // Pas de /404 dédié en App Router si tu n'as pas app/404.tsx
    return NextResponse.redirect(new URL("/", req.url))
  }

  const session = req.cookies.get("pb_admin_session")?.value;
  if (session !== "ok") {
    const bypass = req.headers.get("x-vercel-protection-bypass");
    if (bypass && bypass === process.env.VERCEL_AUTOMATION_BYPASS_SECRET) {
      return NextResponse.next();
    }
    if (isApi) {
      // Autorise le preflight CORS
      if (isOptions) return NextResponse.next()
      return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })
    }
    const url = new URL("/admin/login", req.url);
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*", "/api/upload"],
};
