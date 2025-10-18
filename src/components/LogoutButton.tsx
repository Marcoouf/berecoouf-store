'use client'

import { signOut } from 'next-auth/react'

type Props = {
  className?: string
  label?: string
}

export default function LogoutButton({ className = '', label = 'Déconnexion' }: Props) {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: '/login' })}
      className={['rounded-md border border-neutral-300 px-3 py-2 text-sm font-medium text-neutral-700 transition hover:bg-neutral-100', className].filter(Boolean).join(' ')}
    >
      {label}
    </button>
  )
}
