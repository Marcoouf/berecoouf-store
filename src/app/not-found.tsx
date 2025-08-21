import Link from 'next/link'
export default function NotFound() {
  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-12 sm:py-24 text-center">
      <h1 className="text-2xl sm:text-4xl font-medium tracking-tight">Page introuvable</h1>
      <p className="mt-2 text-neutral-600 text-base sm:text-lg">Le contenu demandé n’existe pas ou a été déplacé.</p>
      <div className="mt-6">
        <Link 
          href="/" 
          className="block w-full sm:inline-block sm:w-auto rounded-full border px-6 py-3 text-sm sm:text-base hover:bg-neutral-50 transition"
        >
          ← Retour à l’accueil
        </Link>
      </div>
    </div>
  )
}