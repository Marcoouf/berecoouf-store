"use client"

import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"

const INTERACTIVE_SEL =
  "a, button, [role='button'], label, input, select, textarea, summary, [tabindex]:not([tabindex='-1'])"

export default function CustomCursor() {
  const pathname = usePathname()
  const isAdmin = pathname?.startsWith("/admin")

  const [pos, setPos] = useState({ x: 0, y: 0 })
  const [isLink, setIsLink] = useState(false)
  const [hidden, setHidden] = useState(false)

  // Gérer la classe body.admin-page
  useEffect(() => {
    const body = document.body
    if (!body) return
    if (isAdmin) {
      body.classList.add("admin-page")
    } else {
      body.classList.remove("admin-page")
    }
    return () => {
      body.classList.remove("admin-page")
    }
  }, [isAdmin])

  if (isAdmin) return null

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      setPos({ x: e.clientX, y: e.clientY })
      setHidden(false)
    }
    const onLeave = () => setHidden(true)
    const onOver = (e: MouseEvent) => {
      const t = e.target as HTMLElement | null
      if (!t) return
      setIsLink(!!t.closest(INTERACTIVE_SEL))
    }

    window.addEventListener("mousemove", onMove)
    window.addEventListener("mouseleave", onLeave)
    window.addEventListener("mouseover", onOver)

    return () => {
      window.removeEventListener("mousemove", onMove)
      window.removeEventListener("mouseleave", onLeave)
      window.removeEventListener("mouseover", onOver)
    }
  }, [])

  return (
    <div
      className={`fixed top-0 left-0 z-[9999] pointer-events-none -translate-x-1/2 -translate-y-1/2 rounded-full transition-colors duration-150 ease-out w-2.5 h-2.5 ${
        hidden ? 'opacity-0' : 'opacity-100'
      } ${isLink ? 'bg-accent-600' : 'bg-accent'}`}
      style={{
        transform: `translate(${pos.x}px, ${pos.y}px)`,
      }}
      aria-hidden
    />
  )
}