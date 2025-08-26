'use client'

import { Suspense } from 'react'

import Link from 'next/link'
function NotFoundInner() {
  return (
    <>
      <div
        aria-label="Page non trouvée"
        className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-12 sm:py-24 text-center animate-fadeIn"
      >
        <h1
          role="alert"
          aria-live="assertive"
          className="text-2xl sm:text-4xl font-medium tracking-tight"
        >
          Page introuvable
        </h1>
        <p className="mt-2 text-neutral-600 text-base sm:text-lg">
          Le contenu demandé n’existe pas ou a été déplacé.
        </p>
        <div className="mt-6">
          <Link
            href="/"
            className="block w-full sm:inline-block sm:w-auto rounded-full border px-6 py-3 text-sm sm:text-base hover:bg-neutral-50 transition"
          >
            ← Retour à l’accueil
          </Link>
        </div>
      </div>
      <style jsx>{`
        @keyframes fadeIn {
          0% {
            opacity: 0;
            transform: translateY(24px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.8s cubic-bezier(0.32, 0.72, 0, 1) both;
        }
      `}</style>
    </>
  )
}

export default function NotFound() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-neutral-500">Chargement…</div>}>
      <NotFoundInner />
    </Suspense>
  )
}