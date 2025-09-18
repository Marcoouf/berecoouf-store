import type { Metadata } from 'next'
import './globals.css'
import Providers from './providers'
import { Inter, EB_Garamond } from 'next/font/google'
import HeaderGlobal from '@/components/Header'
import CustomCursor from '@/components/CustomCursor'
import GlobalCartDrawer from '@/components/GlobalCartDrawer'
import ScrollManager from '@/components/ScrollManager'
import ClientLayout from '@/components/ClientLayout'
import { Suspense } from 'react'
import Footer from '@/components/Footer'

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' })
const garamond = EB_Garamond({ subsets: ['latin'], variable: '--font-serif' })

export const metadata: Metadata = {
  title: 'Point Bleu — Éditions d’art',
  description: 'Galerie en ligne d’illustrations contemporaines en séries limitées.',
  icons: {
    icon: '/favicon.png',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className={`${inter.variable} ${garamond.variable} font-sans bg-white text-neutral-900 antialiased`}>
        <Providers>
          {/* Frontière Suspense globale pour tous les composants client qui utilisent
             useSearchParams / usePathname (ScrollManager, ClientLayout, GlobalCartDrawer, etc.) */}
          <Suspense fallback={<div className="sr-only" aria-hidden="true">Chargement…</div>}>
            <ScrollManager />
            <HeaderGlobal />
            <CustomCursor />
            <ClientLayout>{children}</ClientLayout>
            <GlobalCartDrawer />
          </Suspense>
        </Providers>
        <Footer />
      </body>
    </html>
  )
}
