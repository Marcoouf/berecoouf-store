// src/app/api/upload/route.ts
import { NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'
import crypto from 'crypto'

export const runtime = 'nodejs'

const ALLOWED = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif'])

/** Nettoie le nom de base (sans extension) */
function safeBase(s: string) {
  return s
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

export async function POST(req: Request) {
  try {
    const form = await req.formData()
    const file = form.get('file') as File | null
    if (!file) return NextResponse.json({ ok: false, error: 'file manquant' }, { status: 400 })

    if (!ALLOWED.has(file.type)) {
      return NextResponse.json({ ok: false, error: `type non autorisé: ${file.type}` }, { status: 400 })
    }

    // Récupère l’extension depuis le mimetype
    const ext = file.type.split('/')[1] || 'bin'

    // Nom de fichier: horodatage + hash court + base nettoyée
    const original = (file as any).name || 'image'
    const base = safeBase(original.replace(/\.[^.]+$/, '')) || 'img'
    const stamp = new Date().toISOString().replace(/[:.]/g, '-')
    const hash = crypto.createHash('md5').update(base + stamp).digest('hex').slice(0, 8)
    const filename = `${stamp}-${hash}-${base}.${ext}`

    // Dossier cible dans /public/images/artworks
    const dir = path.join(process.cwd(), 'public', 'images', 'artworks')
    await fs.mkdir(dir, { recursive: true })
    const dest = path.join(dir, filename)

    // IMPORTANT : convertir en Uint8Array (compatible typings Node)
    const arrayBuffer = await file.arrayBuffer()
    const bytes = new Uint8Array(arrayBuffer)

    // Écrit le fichier
    await fs.writeFile(dest, bytes)

    // Chemin public à renvoyer à la page admin
    const publicPath = `/images/artworks/${filename}`
    return NextResponse.json({ ok: true, path: publicPath })
  } catch (e: any) {
    console.error('UPLOAD ERROR', e)
    return NextResponse.json({ ok: false, error: 'Erreur upload serveur' }, { status: 500 })
  }
}