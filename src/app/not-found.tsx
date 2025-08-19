import Link from 'next/link'
export default function NotFound() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-24 text-center">
      <h1 className="text-3xl font-medium tracking-tight">Page introuvable</h1>
      <p className="mt-2 text-neutral-600">Le contenu demandé n’existe pas ou a été déplacé.</p>
      <div className="mt-6"><Link href="/" className="rounded-full border px-4 py-2 text-sm hover:bg-neutral-50">← Retour à l’accueil</Link></div>
    </div>
  )
}