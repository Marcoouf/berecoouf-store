'use client'

import { useCallback, useEffect } from 'react'
import Link from 'next/link'
import { signOut } from 'next-auth/react'
import { AdminNav } from '@/components/admin/AdminNav'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    document.body.classList.add('admin-page')
    return () => document.body.classList.remove('admin-page')
  }, [])

  const handleSignOut = useCallback(() => {
    signOut({ callbackUrl: '/login' })
  }, [])

  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="border-b border-neutral-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="text-center sm:text-left">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">
              Espace administration
            </p>
            <p className="text-sm font-medium text-neutral-900">Vague — Éditions d’art</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
            <Link
              href="/"
              className="rounded-md border border-neutral-300 px-3 py-2 text-center text-sm font-medium text-neutral-700 hover:bg-neutral-50"
            >
              ← Retour au site
            </Link>
            <button
              type="button"
              onClick={handleSignOut}
              className="rounded-md border border-neutral-300 px-3 py-2 text-sm font-medium text-neutral-700 transition hover:bg-neutral-100"
            >
              Déconnexion
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6 lg:flex-row lg:items-start">
        <aside className="w-full lg:w-64">
          <div className="rounded-2xl border border-neutral-200 bg-white/80 p-4 shadow-sm">
            <AdminNav />
          </div>
        </aside>

        <main className="flex-1 pb-16">{children}</main>
      </div>
    </div>
  )
}
