import { NextResponse } from "next/server";
import { prisma } from '@/lib/prisma'
import { revalidateArtistPaths } from "@/lib/revalidate";
import { assertAdmin } from '@/lib/adminAuth'

type Params = { params: { id: string } };

export async function POST(req: Request, { params }: Params) {
  const denied = await assertAdmin(req)
  if (denied) return denied
  try {
    const id = params.id;

    const artist = await prisma.artist.findUnique({ where: { id } });
    if (!artist || artist.deletedAt) {
      return NextResponse.json({ error: "Artiste introuvable" }, { status: 404 });
    }

    const updated = await prisma.artist.update({
      where: { id },
      data: { isArchived: true },
      select: { slug: true },
    });

    await revalidateArtistPaths(updated.slug);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Erreur" }, { status: 400 });
  }
}
