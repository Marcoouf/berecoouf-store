'use client'

import { useState } from 'react'

export default function CopyPublicLinkButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      setCopied(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="inline-flex items-center gap-2 rounded-full border border-white/60 bg-white/80 px-3 py-1.5 text-xs font-medium text-neutral-800 shadow-sm transition hover:bg-white"
    >
      <span aria-hidden className="text-base">🔗</span>
      {copied ? 'Lien copié !' : 'Copier le lien public'}
    </button>
  )
}
