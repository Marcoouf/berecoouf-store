"use client"

import { useEffect, useState } from "react"

export default function CustomCursor() {
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [hovering, setHovering] = useState(false)

  useEffect(() => {
    const move = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY })
    }
    window.addEventListener("mousemove", move)

    // Surveille le survol d’éléments interactifs
    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (target.closest("a, button, [role='button'], label, input, select, textarea, summary, [tabindex]:not([tabindex='-1'])")) {
        setHovering(true)
      } else {
        setHovering(false)
      }
    }

    window.addEventListener("mouseover", handleMouseOver)

    return () => {
      window.removeEventListener("mousemove", move)
      window.removeEventListener("mouseover", handleMouseOver)
    }
  }, [])

  return (
    <div
      className={`pointer-events-none fixed top-0 left-0 z-[9999] h-4 w-4 rounded-full transform -translate-x-1/2 -translate-y-1/2 transition-colors duration-200 ${
        hovering ? "bg-blue-500" : "bg-[#a3d9ff]"
      }`}
      style={{
        transform: `translate(${position.x}px, ${position.y}px)`,
      }}
    />
  )
}