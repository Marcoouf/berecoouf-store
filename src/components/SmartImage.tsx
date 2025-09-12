import NextImage from 'next/image'
import type { ComponentProps } from 'react'

type Props = ComponentProps<typeof NextImage>

// Petit SVG 1x1 super léger encodé en base64 pour le flou
const BLUR =
  "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0nMScgaGVpZ2h0PScxJyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnPjxyZWN0IHdpZHRoPScxJyBoZWlnaHQ9JzEnIGZpbGw9JyNlZWUnLz48L3N2Zz4="

export default function SmartImage(props: Props) {
  const { placeholder = 'blur', blurDataURL = BLUR, ...rest } = props
  return (
    <div className="relative group select-none">
      <NextImage
        placeholder={placeholder}
        blurDataURL={blurDataURL}
        draggable={false}
        {...rest}
      />
      <span
        className="absolute inset-0 bg-transparent cursor-default"
        onContextMenu={(e) => e.preventDefault()}
        onDragStart={(e) => e.preventDefault()}
      />
    </div>
  )
}
