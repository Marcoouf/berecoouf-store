'use client'

import NextImage from 'next/image'
import type { ComponentProps, CSSProperties } from 'react'

type BaseImageProps = ComponentProps<typeof NextImage>

/**
 * Props supplémentaires :
 * - protect: active la protection anti-clic droit / anti-drag
 * - imageOverlay: ajoute une couche transparente au-dessus (utile pour galerie / pages œuvres)
 * - wrapperClass: classes à appliquer au wrapper (positionnement, ratio, etc.)
 */
type Props = BaseImageProps & {
  protect?: boolean
  imageOverlay?: boolean
  wrapperClass?: string
}

// Petit SVG 1x1 super léger encodé en base64 pour le flou
const BLUR =
  "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0nMScgaGVpZ2h0PScxJyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnPjxyZWN0IHdpZHRoPScxJyBoZWlnaHQ9JzEnIGZpbGw9JyNlZWUnLz48L3N2Zz4="

export default function SmartImage(props: Props) {
  const {
    // anti-vol
    protect = false,
    imageOverlay = false,
    wrapperClass = '',
    // next/image props
    placeholder = 'blur',
    blurDataURL = BLUR,
    className,
    style,
    draggable,
    width,
    height,
    ...rest
  } = props

  // Désactive automatiquement le blur pour les toutes petites images (< 40px)
  const allowBlur =
    placeholder === 'blur' &&
    ((typeof width === 'number' && width >= 40) ||
      (typeof height === 'number' && height >= 40))

  const resolvedPlaceholder = allowBlur ? 'blur' : undefined
  const resolvedBlurDataURL = allowBlur ? blurDataURL : undefined

  // Style renforcé quand protection active
  const protectedStyle: CSSProperties | undefined = protect
    ? { userSelect: 'none', ...style }
    : style

  return (
    <span
      className={`relative group select-none ${wrapperClass}`}
      onContextMenu={protect ? (e) => e.preventDefault() : undefined}
      onDragStart={protect ? (e) => e.preventDefault() : undefined}
    >
      <NextImage
        placeholder={resolvedPlaceholder}
        blurDataURL={resolvedBlurDataURL}
        // Empêche le drag d'image (et laisse prioritaire au flag si défini explicitement)
        draggable={protect ? false : draggable}
        className={className}
        style={protectedStyle}
        width={width}
        height={height}
        {...rest}
      />

      {(imageOverlay || protect) && (
        <span aria-hidden="true" className="pointer-events-none absolute inset-0" />
      )}
    </span>
  )
}
