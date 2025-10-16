export type FooterLink = {
  label: string
  href: string
  external?: boolean
}

export type FooterLinks = {
  help?: FooterLink[]
  legal?: FooterLink[]
  social?: FooterLink[]
}

const guaranteeItems = [
  'Certificat d’authenticité signé',
  'Éditions limitées numérotées',
  'Impression fine art & contrôle qualité',
  'Livraison assurée et suivie en 3 à 5 jours',
]

export default async function Footer() {
  let provided: FooterLinks = {}
  try {
    const mod: any = await import('@/lib/footerLinks')
    provided = (mod.footerLinks || mod.default || {}) as FooterLinks
  } catch {
    // pas de module → on utilisera les fallbacks
  }

  const fallbackHelp: FooterLink[] = [
    { label: 'FAQ', href: '/faq' },
    { label: 'Livraison & retours', href: '/livraison-retours' },
    { label: 'Contact', href: '/contact' },
  ]

  const fallbackLegal: FooterLink[] = [
    { label: 'Mentions légales', href: '/mentions-legales' },
    { label: 'CGV', href: '/cgv' },
    { label: 'Confidentialité', href: '/confidentialite' },
  ]

  const fallbackSocial: FooterLink[] = [
    { label: 'Instagram', href: 'https://www.instagram.com/', external: true },
    { label: 'Newsletter', href: '/newsletter' },
    { label: 'Presse', href: '/contact#presse' },
  ]

  const help = (Array.isArray(provided.help) && provided.help!.length > 0)
    ? provided.help!
    : fallbackHelp

  const legal = (Array.isArray(provided.legal) && provided.legal!.length > 0)
    ? provided.legal!
    : fallbackLegal

  const social = (Array.isArray(provided.social) && provided.social!.length > 0)
    ? provided.social!
    : fallbackSocial

  return (
    <footer id="about" className="bg-neutral-50/60">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 py-8 sm:py-10 md:py-16 text-sm text-neutral-600">
        <div className="grid gap-6 sm:gap-8 md:grid-cols-5">
          <div className="md:col-span-2">
            <div className="text-sm tracking-widest uppercase text-neutral-800">
              Vague
            </div>
            <p className="mt-3 max-w-sm">
              Galerie d’art en ligne — illustrations contemporaines, tirages numérotés et fichiers numériques sécurisés.
            </p>
            <p className="mt-3 text-xs text-neutral-500">
              Nous travaillons avec des ateliers partenaires certifiés (Hahnemühle) pour garantir une restitution fidèle des œuvres.
            </p>
          </div>

          <div>
            <div className="font-medium text-neutral-800">Aide</div>
            <ul className="mt-3 space-y-2">
              {help.map((l) => (
                <li key={`${l.label}-${l.href}`}>
                  <a
                    href={l.href}
                    {...(l.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                    className="hover:text-accent"
                  >
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <div className="font-medium text-neutral-800">Légal</div>
            <ul className="mt-3 space-y-2">
              {legal.map((l) => (
                <li key={`${l.label}-${l.href}`}>
                  <a
                    href={l.href}
                    {...(l.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                    className="hover:text-accent"
                  >
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <div className="font-medium text-neutral-800">Suivez-nous</div>
            <ul className="mt-3 space-y-2">
              {social.map((l) => (
                <li key={`${l.label}-${l.href}`}>
                  <a
                    href={l.href}
                    {...(l.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                    className="hover:text-accent"
                  >
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 grid gap-6 border-t border-neutral-200/60 pt-6 sm:grid-cols-2 md:grid-cols-4 text-xs text-neutral-500">
          {guaranteeItems.map((item) => (
            <div key={item} className="flex items-start gap-2">
              <span aria-hidden className="mt-[3px] inline-block h-[6px] w-[6px] rounded-full bg-accent" />
              <span>{item}</span>
            </div>
          ))}
        </div>

        <div className="mt-8 text-xs text-neutral-500">
          © {new Date().getFullYear()} Vague. Tous droits réservés.
        </div>
      </div>
    </footer>
  )
}