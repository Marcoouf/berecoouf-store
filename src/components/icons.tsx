'use client'

import type { SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement> & { size?: number }

function createIcon(path: (props: IconProps) => JSX.Element) {
  return function Icon({ size = 20, className, ...rest }: IconProps) {
    return path({
      width: size,
      height: size,
      strokeWidth: 1.5,
      fill: 'none',
      stroke: 'currentColor',
      className,
      ...rest,
    })
  }
}

export const MailIcon = createIcon((props) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
    <path d="M4 6h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1z" />
    <path d="m4 7 8 6 8-6" />
  </svg>
))

export const GlobeIcon = createIcon((props) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
    <circle cx="12" cy="12" r="9" />
    <path d="M3 12h18" />
    <path d="M12 3a16 16 0 0 1 0 18" />
    <path d="M12 3a16 16 0 0 0 0 18" />
  </svg>
))

export const InstagramIcon = createIcon((props) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
    <rect x="4" y="4" width="16" height="16" rx="4" />
    <circle cx="12" cy="12" r="3.5" />
    <circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" stroke="none" />
  </svg>
))

export const PaletteIcon = createIcon((props) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
    <path d="M12 3a9 9 0 1 0 0 18 2 2 0 0 0 2-2v-1a2 2 0 0 1 2-2h1a2 2 0 1 0 0-4h-1a2 2 0 0 1-2-2V7a4 4 0 0 0-4-4z" />
    <path d="M7 12h.01" />
    <path d="M12 7h.01" />
    <path d="M16 9h.01" />
    <path d="M9 17h.01" />
  </svg>
))

export const MoonIcon = createIcon((props) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
    <path d="M21 12.79A9 9 0 1 1 11.21 3a7 7 0 1 0 9.79 9.79z" />
  </svg>
))

export const LoaderIcon = createIcon((props) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
    <path d="M12 2v4" />
    <path d="M12 18v4" />
    <path d="m4.93 4.93 2.83 2.83" />
    <path d="m16.24 16.24 2.83 2.83" />
    <path d="M2 12h4" />
    <path d="M18 12h4" />
    <path d="m4.93 19.07 2.83-2.83" />
    <path d="m16.24 7.76 2.83-2.83" />
  </svg>
))
