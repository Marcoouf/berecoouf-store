'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { AdminNav } from '@/components/admin/AdminNav'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    document.body.classList.add('admin-page')
    return () => document.body.classList.remove('admin-page')
  }, [])

  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="border-b border-neutral-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">
              Espace administration
            </p>
            <p className="text-sm font-medium text-neutral-900">Vague — Éditions d’art</p>
          </div>
          <Link
            href="/"
            className="text-sm font-medium text-neutral-600 underline-offset-4 hover:text-neutral-900 hover:underline"
          >
            ← Retour au site
          </Link>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-6 py-8 lg:flex-row lg:items-start">
        <aside className="lg:w-64">
          <div className="rounded-2xl border border-neutral-200 bg-white/80 p-4 shadow-sm">
            <AdminNav />
          </div>
        </aside>

        <main className="flex-1 pb-16">{children}</main>
      </div>
    </div>
  )
}
