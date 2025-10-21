'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useTransition } from 'react'

export default function RefreshClientButton() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const handleRefresh = () => {
    startTransition(() => {
      const params = new URLSearchParams(searchParams.toString())
      params.set('_', Date.now().toString())
      router.replace(`/admin/logs?${params.toString()}`)
    })
  }

  return (
    <button
      type="button"
      onClick={handleRefresh}
      disabled={isPending}
      className="rounded-md border border-neutral-300 px-3 py-2 text-sm font-medium text-neutral-700 transition hover:bg-neutral-100 disabled:opacity-60"
    >
      {isPending ? 'Actualisation…' : 'Actualiser'}
    </button>
  )
}
