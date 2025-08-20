import type { Metadata } from 'next'
import './globals.css'
import Providers from './providers'
import { Inter, EB_Garamond } from 'next/font/google'
import ScrollProgress from '@/components/ScrollProgress'
import HeaderGlobal from '@/components/Header'

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' })
const garamond = EB_Garamond({ subsets: ['latin'], variable: '--font-serif' })

export const metadata: Metadata = {
  title: 'Berecoouf — Éditions d’art',
  description: 'Galerie en ligne d’illustrations contemporaines en séries limitées.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className={`${inter.variable} ${garamond.variable} font-sans bg-white text-neutral-900 antialiased`}>
        <Providers>
          <HeaderGlobal />
          {children}
          </Providers>
      </body>
    </html>
  )
}