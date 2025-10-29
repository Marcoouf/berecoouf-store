import { z } from "zod";

export const artistBaseSchema = z.object({
  name: z.string().min(1, "Nom requis"),
  slug: z.string().min(1, "Slug requis").regex(/^[a-z0-9-]+$/, "slug: [a-z0-9-]"),
  bio: z.string().max(2000).optional().nullable(),
  socials: z.array(z.string().url("URL invalide")).optional().default([]),
  image: z.string().url("URL invalide").optional().nullable(),     // cover (hero)
  portrait: z.string().url("URL invalide").optional().nullable(),  // avatar rond
  contactEmail: z.string().email("Email invalide").optional().nullable(),
});

export const artistCreateSchema = artistBaseSchema.extend({
  isHidden: z.boolean().optional(),
});

export const artistUpdateSchema = artistBaseSchema.partial().extend({
  id: z.string().min(1),
  isHidden: z.boolean().optional(),
});
