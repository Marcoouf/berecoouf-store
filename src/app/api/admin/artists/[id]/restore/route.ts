import { NextResponse } from "next/server";
import { prisma } from '@/lib/prisma'
import { revalidateArtistPaths } from "@/lib/revalidate";

function assertAdmin() {}

type Params = { params: { id: string } };

export async function POST(_req: Request, { params }: Params) {
  try {
    assertAdmin();
    const id = params.id;

    const artist = await prisma.artist.findUnique({ where: { id } });
    if (!artist) {
      return NextResponse.json({ error: "Artiste introuvable" }, { status: 404 });
    }

    const updated = await prisma.artist.update({
      where: { id },
      data: { isArchived: false, deletedAt: null },
      select: { slug: true },
    });

    await revalidateArtistPaths(updated.slug);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Erreur" }, { status: 400 });
  }
}