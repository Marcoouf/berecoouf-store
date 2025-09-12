// scripts/migrate-to-blob.mjs
import { put } from '@vercel/blob'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

// --- CONFIG ----------------------------------------------------
const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const PUBLIC_IMAGES = path.join(ROOT, 'public', 'images')

// Dossiers d'images à migrer (tu peux en ajouter si besoin)
const DIRS = [
  path.join(PUBLIC_IMAGES, 'artworks'),
  path.join(PUBLIC_IMAGES, 'artworks', 'mockups'),
  path.join(PUBLIC_IMAGES, 'artists'),
]

// Extensions prises en charge
const EXT_OK = new Set(['.webp', '.jpg', '.jpeg', '.png', '.gif'])
// Préfixe de destination côté Blob (optionnel)
const BLOB_PREFIX = 'images'

// Emplacement du catalogue local à mettre à jour (ajuste si besoin)
const LOCAL_CATALOG = path.join(ROOT, 'catalog.json')

// Variables d’env
const TOKEN = process.env.BLOB_READ_WRITE_TOKEN // requis en local
const CATALOG_BLOB_KEY = process.env.CATALOG_BLOB_KEY // ex: "data/catalog.json"

if (!TOKEN) {
  console.error('❌ BLOB_READ_WRITE_TOKEN manquant (exporte la variable d’env).')
  process.exit(1)
}
if (!CATALOG_BLOB_KEY) {
  console.error('❌ CATALOG_BLOB_KEY manquant (ex: data/catalog.json).')
  process.exit(1)
}

// --- HELPERS ---------------------------------------------------
const contentTypeFor = (ext) => {
  switch (ext) {
    case '.webp': return 'image/webp'
    case '.jpg':
    case '.jpeg': return 'image/jpeg'
    case '.png': return 'image/png'
    case '.gif': return 'image/gif'
    default: return 'application/octet-stream'
  }
}

async function walk(dir, out = []) {
  const entries = await fs.readdir(dir, { withFileTypes: true })
  for (const e of entries) {
    const full = path.join(dir, e.name)
    if (e.isDirectory()) {
      await walk(full, out)
    } else {
      const ext = path.extname(e.name).toLowerCase()
      if (EXT_OK.has(ext)) out.push(full)
    }
  }
  return out
}

// --- 1) Upload de toutes les images locales vers Vercel Blob ---
const localToBlob = {} // mapping { '/images/artworks/foo.webp': 'https://.../foo.webp' }

for (const dir of DIRS) {
  try {
    const files = await walk(dir)
    if (!files.length) continue

    for (const abs of files) {
      // Chemin relatif "public/…"
      const relFromPublic = path.relative(path.join(ROOT, 'public'), abs) // ex: images/artworks/foo.webp
      const ext = path.extname(abs).toLowerCase()
      const ct = contentTypeFor(ext)

      // Clé de destination côté blob: <BLOB_PREFIX>/<relFromPublic> (ex: images/images/artworks/foo.webp)
      // On évite le double "images/" si relFromPublic commence déjà par "images/"
      const cleanRel = relFromPublic.startsWith('images/')
        ? relFromPublic
        : path.join('images', relFromPublic)
      const blobKey = path.join(BLOB_PREFIX, cleanRel).replace(/\\/g, '/')

      const buf = await fs.readFile(abs)
      const { url } = await put(blobKey, buf, {
        access: 'public',
        contentType: ct,
        addRandomSuffix: false,
        // important: autoriser les re-runs
        allowOverwrite: true,
        token: TOKEN,
        cacheControl: 'public, max-age=31536000, immutable',
      })

      // Mappe le chemin web local vers l’URL Blob finale
      localToBlob['/' + relFromPublic.replace(/\\/g, '/')] = url
      console.log('✔︎ upload:', relFromPublic, '→', url)
    }
  } catch (err) {
    // On continue même si un dossier est absent
    if (err?.code !== 'ENOENT') throw err
  }
}

// --- 2) Mettre à jour catalog.json (image/mockup) ---------------
let catalog = null
try {
  const raw = await fs.readFile(LOCAL_CATALOG, 'utf8')
  catalog = JSON.parse(raw)
} catch (err) {
  console.error('❌ Impossible de lire le catalogue local:', LOCAL_CATALOG, err?.message)
  process.exit(1)
}

if (Array.isArray(catalog?.artworks)) {
  for (const a of catalog.artworks) {
    if (a?.image && localToBlob[a.image]) a.image = localToBlob[a.image]
    if (a?.mockup && localToBlob[a.mockup]) a.mockup = localToBlob[a.mockup]
  }
}

// Sauvegarde locale de secours
await fs.writeFile(path.join(ROOT, 'catalog.updated.json'), JSON.stringify(catalog, null, 2), 'utf8')

// --- 3) Pousser le catalogue mis à jour dans le Blob ------------
const { url: catalogUrl } = await put(
  CATALOG_BLOB_KEY,
  JSON.stringify(catalog),
  {
    access: 'public',
    contentType: 'application/json',
    addRandomSuffix: false,
    allowOverwrite: true,
    token: TOKEN,
    // pas d’immutabilité ici: on veut pouvoir relire la dernière version
    cacheControl: 'no-store',
  }
)

console.log('\n✅ Migration terminée.')
console.log('   - mapping images:', Object.keys(localToBlob).length, 'fichiers')
console.log('   - catalog.json (mis à jour) →', catalogUrl)
console.log('   - backup local → catalog.updated.json')