import { rateLimit } from "@/lib/rateLimit"
import { assertAdmin, assertMethod } from "@/lib/adminAuth"
import { NextResponse } from "next/server"
import { put } from "@vercel/blob"
import { writeFile, mkdir } from 'node:fs/promises'
import path from 'node:path'

// Helper pour vérifier la clé admin via header ou Authorization
function adminHeaderOk(req: Request) {
  const fromHeader = req.headers.get('x-admin-key') || req.headers.get('X-Admin-Key')
  const fromAuth = req.headers.get('authorization') || req.headers.get('Authorization')
  const bearer = fromAuth && /^Bearer\s+(.+)$/i.test(fromAuth) ? (fromAuth.match(/^Bearer\s+(.+)$/i) as RegExpMatchArray)[1] : null
  const candidate = (fromHeader || bearer || '').trim()
  const valid = (process.env.ADMIN_KEY || '').trim()
  return !!candidate && !!valid && candidate === valid
}

export const runtime = "nodejs"

const ALLOWED = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/gif",
])

/** Nettoie le nom de base (sans extension) */
function safeBase(s: string) {
  return s
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
}

export async function POST(req: Request) {
  const badMethod = assertMethod(req, ["POST"])
  if (badMethod) return badMethod

  // Autoriser aussi le header "x-admin-key" (ou Authorization: Bearer ...)
  if (!adminHeaderOk(req)) {
    const notAdmin = await assertAdmin(req) // fallback à ta logique existante (cookie/session, etc.)
    if (notAdmin) return notAdmin
  }

  const limiter = rateLimit(req, { limit: 10, windowMs: 60_000 })
  if (!limiter.ok) {
    limiter.headers.set("Access-Control-Allow-Origin", "*")
    return NextResponse.json(
      { ok: false, error: "rate_limited" },
      { status: 429, headers: limiter.headers }
    )
  }

  try {
    const form = await req.formData()
    const file = form.get("file") as File | null
    if (!file) {
      return NextResponse.json(
        { ok: false, error: "file_missing" },
        { status: 400, headers: { "Access-Control-Allow-Origin": "*" } }
      )
    }

    if (!ALLOWED.has(file.type)) {
      return NextResponse.json(
        { ok: false, error: "unsupported_type", details: file.type },
        { status: 400, headers: { "Access-Control-Allow-Origin": "*" } }
      )
    }

    // Taille max 10 Mo
    const MAX = 10 * 1024 * 1024
    if (file.size > MAX) {
      return NextResponse.json(
        { ok: false, error: "too_large", details: ">10MB" },
        { status: 400, headers: { "Access-Control-Allow-Origin": "*" } }
      )
    }

    // Dossier cible en fonction du "kind" passé par le formulaire
    // - "artwork" (défaut) -> "artworks/"
    // - "mockup"           -> "mockups/"
    const rawKind = String(form.get("kind") || "").toLowerCase()
    const folder = rawKind === "mockup" || rawKind === "mockups" ? "mockups" : "artworks"

    // Nom de fichier : base nettoyée + timestamp + extension cohérente avec le MIME
    const original = form.get("originalName") || (file as any).name || "image"
    const base = safeBase(String(original).replace(/\.[^.]+$/, "")) || "img"
    const ext = (file.type.split("/")[1] || "bin").toLowerCase()
    const ts = Date.now()
    const filename = `${folder}/${base}-${ts}.${ext}`

    // Essayez d'abord Vercel Blob si le token d'écriture est présent,
    // sinon basculez sur un enregistrement local dans /public/uploads.
    const token = process.env.BLOB_READ_WRITE_TOKEN

    // Convert to Buffer once so we can reuse for either target
    const bytes = Buffer.from(await file.arrayBuffer())

    if (token) {
      try {
        const blob = await put(filename, bytes, {
          access: 'public',
          contentType: file.type,
          token, // important en local/dev
          // cacheControl: 'public, max-age=31536000, immutable',
        })
        return NextResponse.json(
          { url: blob.url },
          { status: 200, headers: { 'Access-Control-Allow-Origin': '*' } }
        )
      } catch (err) {
        // Log et on tentera le fallback local
        console.error('Vercel Blob upload failed, falling back to local file', err)
      }
    }

    // Fallback local: écrit le fichier sous /public/uploads/<folder>/...
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', folder)
    await mkdir(uploadsDir, { recursive: true })
    const localPath = path.join(uploadsDir, `${base}-${ts}.${ext}`)
    await writeFile(localPath, bytes)
    const publicUrl = `/uploads/${folder}/${path.basename(localPath)}`

    return NextResponse.json(
      { url: publicUrl },
      { status: 200, headers: { 'Access-Control-Allow-Origin': '*' } }
    )
  } catch (e: any) {
    // Mappage d'erreurs plus clair pour dépistage
    const message = e?.message || String(e)
    const status = e?.status || e?.cause?.status

    // Signatures fréquentes côté Vercel Blob
    const isBlobUnauthorized =
      status === 401 ||
      /unauthorized|not\s*authorized|permission/i.test(message) ||
      (/vercel-blob/i.test(message) && /401|unauthorized/i.test(message))

    const isBlobForbidden = status === 403 || /forbidden|permission/i.test(message)

    const payload = {
      ok: false as const,
      error: isBlobUnauthorized
        ? "blob_unauthorized"
        : isBlobForbidden
        ? "blob_forbidden"
        : "upload_failed",
      details: message,
    }

    console.error("UPLOAD ERROR", { status, message, raw: e })
    return NextResponse.json(payload, {
      status: Number.isInteger(status)
        ? status as number
        : isBlobUnauthorized
        ? 401
        : isBlobForbidden
        ? 403
        : 500,
      headers: { "Access-Control-Allow-Origin": "*" },
    })
  }
}

// OPTIONS handler for CORS preflight (inclut x-admin-key)
export async function OPTIONS(req: Request) {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, x-admin-key",
    },
  })
}
