import type { Metadata } from 'next'
import './globals.css'
import Providers from './providers'
import { Inter, EB_Garamond } from 'next/font/google'
import HeaderGlobal from '@/components/Header'
import CustomCursor from '@/components/CustomCursor'
import GlobalCartDrawer from '@/components/GlobalCartDrawer'
import ScrollManager from '@/components/ScrollManager'
import ClientLayout from '@/components/ClientLayout'


const inter = Inter({ subsets: ['latin'], variable: '--font-sans' })
const garamond = EB_Garamond({ subsets: ['latin'], variable: '--font-serif' })

export const metadata: Metadata = {
  title: 'Point Bleu — Éditions d’art',
  description: 'Galerie en ligne d’illustrations contemporaines en séries limitées.',
  icons: {
    icon: "/favicon.png",
}
  }

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className={`${inter.variable} ${garamond.variable} font-sans bg-white text-neutral-900 antialiased`}>
        <Providers>
        <ScrollManager />
          <HeaderGlobal />
          <CustomCursor />
        <ClientLayout>{children}</ClientLayout>
          <GlobalCartDrawer />
          </Providers>
      </body>
    </html>
  )
}
