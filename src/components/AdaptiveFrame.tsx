// src/components/AdaptiveFrame.tsx
'use client'

import { useState } from 'react'
import Image from '@/components/SmartImage'

type Props = {
  src: string
  alt: string
  /** Ratio de secours tant que l'image n'est pas prête (ex: 4/5 = 0.8) */
  fallbackRatio?: number
  /** Classes utilitaires pour le conteneur (bordure, arrondi, etc.) */
  className?: string
  /** Forward vers <Image /> */
  sizes?: string
  priority?: boolean
}

export default function AdaptiveFrame({
  src,
  alt,
  fallbackRatio = 4 / 5,
  className = '',
  sizes = '(min-width:1024px) 50vw, 100vw',
  priority,
}: Props) {
  const [ratio, setRatio] = useState<number | null>(null)
  const [ready, setReady] = useState(false)

  return (
    <div
      className={[
        'relative overflow-hidden',
        // réserve la place avec un ratio de secours tant que l'on n’a pas les dimensions
        // puis passe au vrai ratio pour caler le cadre sur l’image
        ready && ratio ? '' : ``,
        className,
      ].join(' ')}
      style={{
        // tant qu'on ne connaît pas le ratio, on garde le fallback (évite le CLS)
        aspectRatio: (ratio ?? fallbackRatio) as number,
      }}
    >
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        className="object-contain"
        priority={priority}
        onLoadingComplete={(img) => {
          // récupère les dimensions natives pour calculer le vrai ratio
          const w = img.naturalWidth || 0
          const h = img.naturalHeight || 0
          if (w > 0 && h > 0) setRatio(w / h)
          setReady(true)
        }}
      />
    </div>
  )
}