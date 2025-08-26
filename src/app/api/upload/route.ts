import { rateLimit } from "@/lib/rateLimit"
import { assertAdmin, assertMethod } from "@/lib/adminAuth"
import { NextResponse } from "next/server"
import { put } from "@vercel/blob"

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

  const notAdmin = assertAdmin(req)
  if (notAdmin) return notAdmin

  if (!rateLimit(req, 10, 60_000)) {
    return NextResponse.json({ ok: false, error: "rate_limited" }, { status: 429 })
  }

  try {
    const form = await req.formData()
    const file = form.get("file") as File | null
    if (!file) {
      return NextResponse.json({ ok: false, error: "file manquant" }, { status: 400 })
    }

    if (!ALLOWED.has(file.type)) {
      return NextResponse.json(
        { ok: false, error: `type non autorisé: ${file.type}` },
        { status: 400 },
      )
    }

    // Taille max 10 Mo
    const MAX = 10 * 1024 * 1024
    if (file.size > MAX) {
      return NextResponse.json(
        { ok: false, error: "fichier trop volumineux (>10MB)" },
        { status: 400 },
      )
    }

    // Dossier cible en fonction du "kind" passé par le formulaire
    // - "artwork" (défaut) -> "artworks/"
    // - "mockup"           -> "mockups/"
    const rawKind = String(form.get("kind") || "").toLowerCase()
    const folder = rawKind === "mockup" || rawKind === "mockups" ? "mockups" : "artworks"

    // Nom de fichier : base nettoyée + timestamp + extension cohérente avec le MIME
    const original = (file as any).name || "image"
    const base = safeBase(original.replace(/\.[^.]+$/, "")) || "img"
    const ext = (file.type.split("/")[1] || "bin").toLowerCase()
    const ts = Date.now()
    const filename = `${folder}/${base}-${ts}.${ext}`

    // Upload vers Vercel Blob (public) avec contentType explicite
    const blob = await put(filename, file, {
      access: "public",
      contentType: file.type,
      // cacheControl: "public, max-age=31536000, immutable", // optionnel
    })

    // Retourne l’URL publique et des infos pratiques
    return NextResponse.json({
      ok: true,
      url: blob.url,
      key: blob.pathname, // ex: "artworks/quiet-grid-1693072138.webp"
      kind: folder,
    })
  } catch (e: any) {
    console.error("UPLOAD ERROR", e)
    return NextResponse.json({ ok: false, error: "Erreur upload serveur" }, { status: 500 })
  }
}