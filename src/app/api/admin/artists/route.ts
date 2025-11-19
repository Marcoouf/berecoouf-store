import { NextResponse } from "next/server";
import { prisma } from '@/lib/prisma'
import { artistCreateSchema } from "@/lib/validators/artist";
import { revalidateArtistPaths } from "@/lib/revalidate";
import { assertAdmin } from '@/lib/adminAuth'

export async function GET(req: Request) {
  const denied = await assertAdmin(req)
  if (denied) return denied
  const artists = await prisma.artist.findMany({
    where: { deletedAt: null },
    orderBy: { name: "asc" },
    select: { id: true, name: true, slug: true, isArchived: true, isHidden: true },
  });
  return NextResponse.json(artists);
}

export async function POST(req: Request) {
  const denied = await assertAdmin(req)
  if (denied) return denied
  try {
    const payload = await req.json();
    const input = artistCreateSchema.parse(payload);

    // Empêche doublon slug si non supprimé
    const exists = await prisma.artist.findUnique({ where: { slug: input.slug } });
    if (exists && !exists.deletedAt) {
      return NextResponse.json({ error: "Slug déjà utilisé" }, { status: 409 });
    }

    const contactEmail = input.contactEmail?.trim() || null

    const created = await prisma.artist.upsert({
      where: { slug: input.slug },
      create: {
        name: input.name,
        slug: input.slug,
        bio: input.bio ?? null,
        socials: input.socials ?? [],
        image: input.image ?? null,
        portrait: input.portrait ?? null,
        contactEmail,
        isHidden: input.isHidden ?? false,
      },
      update: {
        name: input.name,
        bio: input.bio ?? null,
        socials: input.socials ?? [],
        image: input.image ?? null,
        portrait: input.portrait ?? null,
        contactEmail,
        deletedAt: null,
        isArchived: false,
        isHidden: input.isHidden ?? false,
      },
      select: { id: true, slug: true, name: true },
    });

    await revalidateArtistPaths(created.slug);
    return NextResponse.json(created, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Erreur" }, { status: 400 });
  }
}
