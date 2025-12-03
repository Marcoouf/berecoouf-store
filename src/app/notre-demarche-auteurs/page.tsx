// src/app/notre-demarche-auteurs/page.tsx
import Link from 'next/link'
import type { ReactNode } from 'react'

export const dynamic = 'force-static'

export const metadata = {
  title: 'Vendre vos œuvres sans céder vos droits d’auteur | VAGUE',
  description:
    'VAGUE est une galerie en ligne qui permet à des auteurs de vendre leurs œuvres sans céder leurs droits, avec une commission limitée et annoncée à l’avance.',
}

const Paragraph = ({ children }: { children: ReactNode }) => (
  <p className="text-neutral-700 leading-relaxed">{children}</p>
)

export default function NotreDemarchePage() {
  return (
    <main className="relative overflow-hidden bg-neutral-50">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[10%] top-10 h-64 w-64 rounded-full bg-accent/10 blur-3xl" />
        <div className="absolute right-[5%] bottom-10 h-72 w-72 rounded-full bg-ink/5 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-5xl px-4 sm:px-6 py-14 sm:py-18">
        <header className="space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full bg-accent/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-accent">
            Approche VAGUE
          </div>
          <h1 className="text-4xl sm:text-5xl font-semibold leading-tight text-neutral-900">Notre démarche</h1>
          <p className="max-w-3xl text-base text-neutral-600">
            VAGUE est une galerie en ligne qui permet à des auteurs de vendre leurs œuvres sans céder leurs droits, avec une commission limitée et annoncée à l’avance.
          </p>
        </header>

        <section className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-3xl bg-neutral-900 text-white px-6 py-6 shadow-lg ring-4 ring-neutral-900/10">
            <h3 className="text-lg font-semibold">En résumé</h3>
            <ul className="mt-3 space-y-2 text-sm text-neutral-100">
              <li>• Droits d’auteur conservés, autorisations limitées</li>
              <li>• Commission connue à l’avance, sans frais cachés</li>
              <li>• Contrat clair : usages d’image, prix, paiements</li>
              <li>• Auteurs identifiés, galerie à taille humaine</li>
            </ul>
          </div>

          <div className="rounded-3xl bg-white/80 px-6 py-5 shadow-lg ring-1 ring-neutral-200/70 backdrop-blur">
            <h3 className="text-lg font-semibold text-neutral-900">Pour qui ?</h3>
            <p className="mt-2 text-sm text-neutral-700 leading-relaxed">
              Illustrateurs, graphistes, photographes, peintres qui cherchent un cadre simple pour vendre sans céder leurs droits. Sélection affinée sur rendez-vous.
            </p>
          </div>

          <div className="rounded-3xl bg-white/80 px-6 py-5 shadow-lg ring-1 ring-neutral-200/70 backdrop-blur">
            <h3 className="text-lg font-semibold text-neutral-900">Comment ça se passe ?</h3>
            <ol className="mt-2 space-y-2 text-sm text-neutral-700 list-decimal list-inside">
              <li>Prise de contact et revue du portfolio.</li>
              <li>Choix des œuvres, formats et prix.</li>
              <li>Signature du contrat-cadre.</li>
              <li>Mise en ligne et accompagnement ventes.</li>
            </ol>
          </div>
        </section>

        <section className="mt-12 space-y-12 text-base">
          <div className="space-y-3">
            <div className="h-1 w-16 rounded-full bg-accent" />
            <h2 className="text-2xl font-semibold text-neutral-900">Vendre vos œuvres sans céder vos droits d’auteur</h2>
            <Paragraph>VAGUE est née d’un malaise assez simple.</Paragraph>
            <Paragraph>
              Je travaille comme juriste en droit des affaires et du numérique, et j’ai autour de moi beaucoup d’illustrateurs, de graphistes, de photographes et d’artistes en général qui peinent à trouver une solution claire et respectueuse pour vendre leurs œuvres. Les dispositifs existent, mais ils sont souvent difficiles à manier, peu transparents juridiquement, ou trop éloignés de leurs besoins réels.
            </Paragraph>
            <Paragraph>
              À force de voir ce décalage, l’idée s’est imposée de mettre en place une galerie en ligne qui parte d’un principe inverse : les auteurs gardent leurs droits, et le site ne fait que ce qui est nécessaire pour présenter les œuvres et organiser la vente.
            </Paragraph>
            <Paragraph>VAGUE est ce lieu-là.</Paragraph>
          </div>

          <div className="space-y-3">
            <div className="h-1 w-16 rounded-full bg-accent" />
            <h2 className="text-2xl font-semibold text-neutral-900">Une galerie en ligne à taille humaine</h2>
            <Paragraph>
              VAGUE n’est pas une grande plateforme, ni un catalogue industriel. C’est un site qui rassemble quelques auteurs dont j’apprécie le travail, autour d’un même fil : des illustrations et des images avec une identité visuelle marquée, un regard singulier ou une forme d’originalité graphique.
            </Paragraph>
            <Paragraph>
              Chaque œuvre est rattachée à un auteur identifié, avec une courte présentation et un contexte. L’idée n’est pas d’optimiser un flux d’images, mais de donner un cadre propre, lisible, où l’on sait qui crée et ce que l’on achète.
            </Paragraph>
          </div>

          <div className="space-y-3">
            <div className="h-1 w-16 rounded-full bg-accent" />
            <h2 className="text-2xl font-semibold text-neutral-900">Vos droits d’auteur restent les vôtres</h2>
            <Paragraph>Le point de départ est clair : les œuvres restent juridiquement les vôtres.</Paragraph>
            <Paragraph>
              Vous conservez vos droits d’auteur, patrimoniaux comme moraux. Aucune cession générale ou illimitée ne vous est demandée. Vous pouvez continuer à exploiter votre travail ailleurs, le montrer sur d’autres sites, collaborer avec d’autres galeries, éditer des tirages dans d’autres circuits, sauf accord spécifique, discuté et écrit.
            </Paragraph>
            <Paragraph>
              La galerie n’a pas vocation à accumuler des droits d’exploitation. Elle se limite à ce qui est strictement nécessaire pour que vos œuvres puissent être vues, choisies et achetées.
            </Paragraph>
          </div>

          <div className="space-y-3">
            <div className="h-1 w-16 rounded-full bg-accent" />
            <h2 className="text-2xl font-semibold text-neutral-900">Une commission limitée et annoncée</h2>
            <Paragraph>
              Pour faire fonctionner le site, une commission est prélevée sur le prix payé par l’acheteur. Elle sert à couvrir les frais techniques, les paiements en ligne et le temps de gestion des ventes et des échanges avec les acheteurs.
            </Paragraph>
            <Paragraph>
              Cette commission est volontairement contenue et annoncée à l’avance aux auteurs, avant toute mise en ligne. Il n’y a pas de frais annexes qui apparaissent ensuite. La répartition entre la part qui vous revient et la part qui couvre le fonctionnement du site est fixée puis respectée.
            </Paragraph>
          </div>

          <div className="space-y-3">
            <div className="h-1 w-16 rounded-full bg-accent" />
            <h2 className="text-2xl font-semibold text-neutral-900">Ce que j’utilise de vos œuvres pour faire tourner le site</h2>
            <Paragraph>Pour pouvoir présenter les œuvres, VAGUE a besoin d’une autorisation limitée sur les images.</Paragraph>
            <Paragraph>
              Concrètement, cette autorisation permet d’afficher les œuvres sur le site, dans la galerie, sur les pages artistes et sur les fiches consacrées à chaque travail. Elle permet aussi, de manière raisonnable, d’utiliser certaines images dans la communication autour du site : par exemple un visuel dans une newsletter, une mise en avant sur la page d’accueil ou une publication sur un compte dédié, avec mention de votre nom.
            </Paragraph>
            <Paragraph>
              Cette autorisation reste encadrée, non exclusive, et liée à la vie du site. Si une œuvre est retirée, elle n’est plus proposée à la vente. L’usage des images pour l’avenir est ajusté dans ce sens. Vous gardez la possibilité de décider ce que vous souhaitez rendre visible, et à quel moment.
            </Paragraph>
          </div>

          <div className="space-y-3">
            <div className="h-1 w-16 rounded-full bg-accent" />
            <h2 className="text-2xl font-semibold text-neutral-900">Un cadre écrit, sans effets de style</h2>
            <Paragraph>La relation entre la galerie et les auteurs est formalisée par un contrat.</Paragraph>
            <Paragraph>
              Ce n’est pas un document marketing, ni un texte à rallonge : il rappelle que vous restez titulaire de vos droits d’auteur, précise ce que VAGUE est autorisé à faire avec les images, indique comment le prix de vente est fixé, comment la commission est calculée et dans quels délais vous êtes payé après une vente. Il explique aussi comment retirer une œuvre, faire évoluer la sélection ou mettre fin à la collaboration.
            </Paragraph>
            <Paragraph>
              Le but est de rendre les choses claires, pas de les complexifier. Le contrat est rédigé avec une attention particulière à la protection de vos droits, parce que c’est mon métier et parce que c’est la logique même de ce site.
            </Paragraph>
          </div>

          <div className="space-y-3">
            <div className="h-1 w-16 rounded-full bg-accent" />
            <h2 className="text-2xl font-semibold text-neutral-900">Pour les personnes qui achètent</h2>
            <Paragraph>
              Du point de vue des acheteurs, cette démarche signifie que la somme versée ne part pas uniquement dans la structure intermédiaire. Une part importante revient à l’auteur, qui reste libre de l’usage de ses œuvres.
            </Paragraph>
            <Paragraph>
              Acheter sur VAGUE, c’est donc choisir une image, mais aussi la manière dont elle est produite et encadrée : un travail signé, issu d’un auteur identifié, qui conserve ses droits et sa liberté de diffusion.
            </Paragraph>
          </div>

          <div className="space-y-3">
            <div className="h-1 w-16 rounded-full bg-accent" />
            <h2 className="text-2xl font-semibold text-neutral-900">Si vous souhaitez proposer vos œuvres</h2>
            <Paragraph>
              Si vous êtes auteur, illustrateur, graphiste, peintre ou photographe, et que cette approche vous convient, vous pouvez prendre contact.
            </Paragraph>
            <Paragraph>
              La suite est simple : on discute de votre travail, des œuvres que vous souhaitez mettre en avant, des formats, des tirages, des prix. Si cela a du sens pour vous comme pour moi, les œuvres sont mises en ligne dans le cadre décrit ici, avec un texte clair et un contrat lisible.
            </Paragraph>
            <div className="pt-1">
              <Link
                href="/proposer-oeuvres"
                className="inline-flex items-center gap-2 rounded-full bg-neutral-900 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-neutral-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900"
              >
                Proposer mes œuvres à VAGUE
                <span aria-hidden>→</span>
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
