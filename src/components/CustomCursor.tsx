"use client"

import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"

// Elements that should make the cursor darken on hover
const INTERACTIVE_SEL =
  "a, button, [role='button'], label, input, select, textarea, summary, [tabindex]:not([tabindex='-1'])"

/**
 * Split in two components so we never break the Rules of Hooks.
 * The outer component decides whether to render the cursor at all
 * (admin pages or mobile/tablet -> no cursor). The inner component
 * attaches mouse listeners and renders the dot.
 */
export default function CustomCursor() {
  const pathname = usePathname()
  const isAdmin = (pathname ?? "").startsWith("/admin")

  // Detect mobile/tablet (coarse pointer OR small viewport)
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const update = () => {
      const coarse = typeof window !== "undefined" && window.matchMedia &&
        (window.matchMedia("(pointer:coarse)").matches || window.matchMedia("(hover: none)").matches)
      setIsMobile(coarse || window.innerWidth < 1024)
    }
    update()
    window.addEventListener("resize", update)
    return () => window.removeEventListener("resize", update)
  }, [])

  // Toggle a body class only for admin pages (for CSS overrides if needed)
  useEffect(() => {
    if (!document?.body) return
    if (isAdmin) document.body.classList.add("admin-page")
    else document.body.classList.remove("admin-page")
    return () => document.body.classList.remove("admin-page")
  }, [isAdmin])

  // Toggle base cursor visibility globally via body class
  useEffect(() => {
    const body = document?.body
    if (!body) return
    if (isAdmin || isMobile) {
      body.classList.remove('cursor-hidden')
    } else {
      body.classList.add('cursor-hidden')
    }
    return () => {
      // on unmount, always ensure native cursor comes back
      body.classList.remove('cursor-hidden')
    }
  }, [isAdmin, isMobile])

  // Do not render the custom cursor on admin routes or mobile/tablet
  if (isAdmin || isMobile) return null

  return <CursorInner />
}

function CursorInner() {
  const [pos, setPos] = useState({ x: 0, y: 0 })
  const [isLink, setIsLink] = useState(false)
  const [hidden, setHidden] = useState(true)

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
      aria-hidden
      className={`fixed top-0 left-0 z-[9999] pointer-events-none -translate-x-1/2 -translate-y-1/2 rounded-full transition-[opacity,background-color,transform] duration-150 ease-out w-2.5 h-2.5 ${
        hidden ? "opacity-0" : "opacity-100"
      } ${isLink ? "bg-accent-600" : "bg-accent"}`}
      style={{ transform: `translate(${pos.x}px, ${pos.y}px)` }}
    />
  )
}