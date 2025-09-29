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

export default async function Footer() {
  // On n'importe qu'un SEUL nom canonique pour éviter les conflits de casse
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

  const help = (Array.isArray(provided.help) && provided.help!.length > 0)
    ? provided.help!
    : fallbackHelp

  const legal = (Array.isArray(provided.legal) && provided.legal!.length > 0)
    ? provided.legal!
    : fallbackLegal

  return (
    <footer id="about" className="bg-neutral-50/60">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 py-8 sm:py-10 md:py-16 text-sm text-neutral-600">
        <div className="grid gap-6 sm:gap-8 md:grid-cols-4">
          <div className="md:col-span-2">
            <div className="text-sm tracking-widest uppercase text-neutral-800">
              Vague
            </div>
            <p className="mt-3 max-w-sm">
              Galerie d’art en ligne — illustrations et tirages en éditions limitées.
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
        </div>

        <div className="mt-10 text-xs text-neutral-500">
          © {new Date().getFullYear()} Vague. Tous droits réservés.
        </div>
      </div>
    </footer>
  )
}