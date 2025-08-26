import { NextResponse, type NextRequest } from "next/server";

const ADMIN_PATHS = [/^\/admin(?!\/login)(\/.*)?$/, /^\/api\/admin(\/.*)?$/, /^\/api\/upload$/];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname === "/admin/login") return NextResponse.next();

  const isAdminZone = ADMIN_PATHS.some((re) => re.test(pathname));
  if (!isAdminZone) return NextResponse.next();

  if (process.env.ADMIN_ENABLED !== "true") {
    return NextResponse.redirect(new URL("/404", req.url));
  }

  const session = req.cookies.get("pb_admin_session")?.value;
  if (session !== "ok") {
    const bypass = req.headers.get("x-vercel-protection-bypass");
    if (bypass && bypass === process.env.VERCEL_AUTOMATION_BYPASS_SECRET) {
      return NextResponse.next();
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
