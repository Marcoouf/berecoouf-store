export default function Footer() {
  return (
    <footer id="about" className="bg-neutral-50/60">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 py-8 sm:py-10 md:py-16 text-sm text-neutral-600">
        <div className="grid gap-6 sm:gap-8 md:grid-cols-4">
          <div className="md:col-span-2">
            <div className="text-sm tracking-widest uppercase text-neutral-800">
              Point Bleu
            </div>
            <p className="mt-3 max-w-sm">
              Éditions d&apos;art et galerie en ligne. Tirages numérotés, impression fine art.
            </p>
          </div>
          <div>
            <div className="font-medium text-neutral-800">Aide</div>
            <ul className="mt-3 space-y-2">
              <li><a href="#" className="hover:text-accent">FAQ</a></li>
              <li><a href="#" className="hover:text-accent">Livraison &amp; retours</a></li>
              <li><a href="#" className="hover:text-accent">Contact</a></li>
            </ul>
          </div>
          <div>
            <div className="font-medium text-neutral-800">Légal</div>
            <ul className="mt-3 space-y-2">
              <li><a href="#" className="hover:text-accent">Mentions légales</a></li>
              <li><a href="#" className="hover:text-accent">CGV</a></li>
              <li><a href="#" className="hover:text-accent">Confidentialité</a></li>
            </ul>
          </div>
        </div>
        <div className="mt-10 text-xs text-neutral-500">
          © {new Date().getFullYear()} Point Bleu. Tous droits réservés.
        </div>
      </div>
    </footer>
  )
}