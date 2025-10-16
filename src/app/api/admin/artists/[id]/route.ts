import { NextResponse } from "next/server";
import { prisma } from '@/lib/prisma'
import { artistUpdateSchema } from "@/lib/validators/artist";
import { revalidateArtistPaths } from "@/lib/revalidate";

function assertAdmin() {}

type Params = { params: { id: string } };

export async function GET(_req: Request, { params }: Params) {
  try {
    assertAdmin();
    const id = decodeURIComponent(params.id);
    const artist = await prisma.artist.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        slug: true,
        bio: true,
        image: true,
        portrait: true,
        contactEmail: true,
        socials: true,
        isArchived: true,
        deletedAt: true,
      },
    });
    if (!artist || artist.deletedAt) {
      return NextResponse.json({ error: "Artiste introuvable" }, { status: 404 });
    }
    const { deletedAt, ...safe } = artist;
    return NextResponse.json(safe);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Erreur" }, { status: 400 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    assertAdmin();

    const id = decodeURIComponent(params.id);
    const payload = await req.json();

    // Vérifier existence
    const existing = await prisma.artist.findUnique({ where: { id } });
    if (!existing || existing.deletedAt) {
      return NextResponse.json({ error: "Artiste introuvable" }, { status: 404 });
    }

    // Vérifier unicité du slug si changé
    if (typeof payload.slug === "string" && payload.slug !== existing.slug) {
      const slugExists = await prisma.artist.findUnique({ where: { slug: payload.slug } });
      if (slugExists && !slugExists.deletedAt) {
        return NextResponse.json({ error: "Slug déjà utilisé" }, { status: 409 });
      }
    }

    const data: any = {};
    if (typeof payload.name === "string") data.name = payload.name;
    if (typeof payload.slug === "string") data.slug = payload.slug;
    if (typeof payload.bio === "string" || payload.bio === null) data.bio = payload.bio;
    if (Array.isArray(payload.socials)) data.socials = payload.socials;
    if (typeof payload.image === "string" || payload.image === null) data.image = payload.image;       // cover (mapped -> coverUrl)
    if (typeof payload.portrait === "string" || payload.portrait === null) data.portrait = payload.portrait; // avatar (mapped -> avatarUrl)
    if (typeof payload.contactEmail === "string" || payload.contactEmail === null) {
      const email = typeof payload.contactEmail === "string" ? payload.contactEmail.trim() : payload.contactEmail
      data.contactEmail = email ? email : null
    }

    const updated = await prisma.artist.update({
      where: { id },
      data,
      select: { id: true, slug: true, name: true },
    });

    // Revalidation des pages publiques
    await revalidateArtistPaths(updated.slug);

    return NextResponse.json(updated);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Erreur" }, { status: 400 });
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  try {
    assertAdmin();
    const id = params.id;

    const artist = await prisma.artist.findUnique({
      where: { id },
      include: { _count: { select: { works: true } } },
    });
    if (!artist || artist.deletedAt) {
      return NextResponse.json({ error: "Artiste introuvable" }, { status: 404 });
    }

    if (artist._count.works > 0) {
      return NextResponse.json(
        { error: "Suppression refusée : l'artiste possède encore des œuvres. Archive d'abord." },
        { status: 422 }
      );
    }

    await prisma.artist.update({
      where: { id },
      data: { deletedAt: new Date(), isArchived: true },
    });

    await revalidateArtistPaths(artist.slug);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Erreur" }, { status: 400 });
  }
}
