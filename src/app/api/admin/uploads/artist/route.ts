import { NextResponse } from "next/server";
import { put } from "@vercel/blob";

// Laisse en Node.js (plus permissif pour les gros fichiers)
export const runtime = "nodejs";

/**
 * POST /api/admin/uploads/artist
 * Body: multipart/form-data { file: File, folder?: string, filename?: string }
 * Return: { url: string }
 */
export async function POST(req: Request) {
  try {
    // TODO: auth admin ici si besoin

    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Aucun fichier reçu (champ 'file' manquant)" }, { status: 400 });
    }

    // (facultatif) garde-fous taille & type
    const MAX_MB = 15;
    const maxBytes = MAX_MB * 1024 * 1024;
    if (file.size > maxBytes) {
      return NextResponse.json({ error: `Fichier trop lourd (> ${MAX_MB} Mo)` }, { status: 413 });
    }
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Type non supporté (image/* attendu)" }, { status: 415 });
    }

    const folder = (form.get("folder") as string) || "artists";
    const baseName = (form.get("filename") as string) || file.name || "upload";
    const safeName = baseName.replace(/[^\w.\-]+/g, "_").slice(-100);

    const key = `${folder}/${Date.now()}-${safeName}`;

    // En local / hors Vercel, il faut un token RW
    const token = process.env.BLOB_READ_WRITE_TOKEN;
    const blob = await put(key, file, {
      access: "public",
      token,                 // OK vide sur Vercel, requis en local
      addRandomSuffix: false,
      contentType: file.type || "application/octet-stream",
    });

    return NextResponse.json({ url: blob.url }, { status: 201 });
  } catch (err: any) {
    // Renvoie TOUJOURS du JSON lisible (évite la page HTML Next)
    console.error("Upload /artist error:", err);
    return NextResponse.json(
      { error: err?.message ?? "Upload échoué" },
      { status: 500, headers: { "x-error": "upload-artist" } }
    );
  }
}