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

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (
        target.closest(
          "a, button, [role='button'], label, input, select, textarea, summary, [tabindex]:not([tabindex='-1'])"
        )
      ) {
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
      className={`pointer-events-none fixed top-0 left-0 z-[9999] rounded-full -translate-x-1/2 -translate-y-1/2 transition-all duration-200 ease-out backdrop-blur-sm ${
        hovering
          ? "bg-blue-500/80 scale-150"
          : "bg-[#a3d9ff]/70 scale-100"
      }`}
      style={{
        width: "16px",
        height: "16px",
        transform: `translate(${position.x}px, ${position.y}px)`,
      }}
    />
  )
}