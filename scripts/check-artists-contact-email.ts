// scripts/check-artists-contact-email.ts
import { prisma } from '@/lib/prisma'

async function main() {
  const artists = await prisma.artist.findMany({
    select: { id: true, name: true, slug: true, contactEmail: true },
    orderBy: { name: 'asc' },
  })

  const missing = artists.filter((a) => !a.contactEmail || !a.contactEmail.trim())

  if (missing.length === 0) {
    console.log('✅ Tous les artistes disposent d’un email de contact.')
    return
  }

  console.error('⚠️  Artistes sans email de contact :')
  for (const artist of missing) {
    console.error(` - ${artist.name} (slug: ${artist.slug})`)
  }
  process.exitCode = 1
}

main()
  .catch((err) => {
    console.error('Erreur lors de la vérification des artistes :', err)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
