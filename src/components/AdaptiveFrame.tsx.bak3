// src/components/AdaptiveFrame.tsx
'use client'

import { useState } from 'react'
import Image from 'next/image'

type Props = {
  src?: string
  alt?: string
  /** Ratio de secours tant que l'image n'est pas prête (ex: 4/5 = 0.8) */
  fallbackRatio?: number
  /** Classes utilitaires pour le conteneur (bordure, arrondi, etc.) */
  className?: string
  /** Forward vers <Image /> */
  sizes?: string
  /** Classes appliquées à l'image rendue (mockup) */
  imgClassName?: string
  priority?: boolean
  /** image utilisée uniquement pour mesurer le ratio */
  probeSrc?: string
  /** Marge intérieure appliquée au calque enfants (ex: "6%", "12px" ou 12). Permet d'aligner l'illustration à l'intérieur de la "fenêtre" du mockup. */
  contentInset?: number | string
  children?: React.ReactNode
}

export default function AdaptiveFrame({
  src,
  alt,
  fallbackRatio = 4 / 5,
  className = '',
  sizes = '(min-width:1024px) 50vw, 100vw',
  imgClassName,
  priority,
  probeSrc,
  contentInset,
  children,
}: Props) {
  const [ratio, setRatio] = useState<number | null>(null)
  const [ready, setReady] = useState(false)

  return (
    <div
      className={['relative overflow-hidden', className].join(' ')}
      style={{
        aspectRatio: (ratio ?? fallbackRatio) as number,
      }}
    >
      {probeSrc && ratio === null && (
        <Image
          src={probeSrc}
          alt=""
          width={10}
          height={10}
          sizes="10px"
          priority={false}
          onLoadingComplete={(img) => {
            const w = img.naturalWidth || 0;
            const h = img.naturalHeight || 0;
            if (w > 0 && h > 0) setRatio(w / h);
            setReady(true);
          }}
          style={{ position: 'absolute', width: 0, height: 0, opacity: 0, pointerEvents: 'none' }}
        />
      )}
      {src && (
        <>
          <Image
            src={src}
            alt={alt ?? ''}
            fill
            sizes={sizes}
            className={['object-contain', imgClassName].filter(Boolean).join(' ')}
            priority={priority}
            onLoadingComplete={(img) => {
              const w = img.naturalWidth || 0
              const h = img.naturalHeight || 0
              if (w > 0 && h > 0) setRatio(w / h)
              setReady(true)
            }}
            draggable={false}
            onContextMenu={(e) => e.preventDefault()}
          />
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 10,
              backgroundColor: 'transparent',
              userSelect: 'none',
            }}
            onContextMenu={(e) => e.preventDefault()}
            onDragStart={(e) => e.preventDefault()}
          />
        </>
      )}
      {children && (
        <div
          className="absolute"
          style={
            contentInset !== undefined
              ? // number => px, string => valeur CSS (ex: "6%")
                ({ inset: contentInset } as React.CSSProperties)
              : ({ inset: 0 } as React.CSSProperties)
          }
        >
          {children}
        </div>
      )}
    </div>
  )
}