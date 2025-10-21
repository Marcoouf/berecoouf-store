'use client'

import { useEffect, useState } from 'react'

type Props = {
  message: string | null
  error: string | null
}

export default function ProfileToast({ message, error }: Props) {
  const [visible, setVisible] = useState<null | 'success' | 'error'>(null)
  const [content, setContent] = useState<string>('')

  useEffect(() => {
    if (message) {
      setContent(message)
      setVisible('success')
      const timer = setTimeout(() => setVisible(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [message])

  useEffect(() => {
    if (error) {
      setContent(error)
      setVisible('error')
      const timer = setTimeout(() => setVisible(null), 4000)
      return () => clearTimeout(timer)
    }
  }, [error])

  if (!visible) return null

  return (
    <div
      className={`fixed right-6 top-6 z-50 max-w-xs rounded-2xl px-4 py-3 text-sm shadow-lg transition-transform duration-200 ${
        visible === 'success'
          ? 'bg-emerald-500/95 text-white'
          : 'bg-rose-500/95 text-white'
      }`}
    >
      {content}
    </div>
  )
}
