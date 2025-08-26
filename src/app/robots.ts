import { headers } from 'next/headers'

function base() {
  const h = headers()
  const host = h.get('x-forwarded-host') ?? h.get('host')
  const proto = h.get('x-forwarded-proto') ?? 'http'
  return (process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '')) || `${proto}://${host}`
}

export default function robots() {
  const b = base()
  return {
    rules: [
      { userAgent: '*', disallow: ['/admin', '/api/admin'] },
    ],
    sitemap: `${b}/sitemap.xml`,
  }
}