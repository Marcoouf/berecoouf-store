import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mentions légales — Vague",
  description:
    "Mentions légales du site Vague : éditeur, hébergeur, propriété intellectuelle, médiation, signalement, droit applicable.",
  alternates: { canonical: "/mentions-legales" },
};

const SITE_NAME = "Vague";

export default function MentionsLegalesPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12 prose prose-neutral dark:prose-invert">
      <h1>Mentions légales</h1>

      <h2>Éditeur du site</h2>
      <p>
        {SITE_NAME} — [forme juridique] au capital de [●] € <br />
        Siège : [adresse complète] – France <br />
        RCS / SIREN : [●] — N° TVA : [●]{" "}
        <em>(ou : “TVA non applicable, art. 293 B du CGI”)</em>
        <br />
        Contact : [email de contact] {` `}
        {`[téléphone facultatif]`}
      </p>

      <h2>Directeur de la publication</h2>
      <p>[Nom, fonction]</p>

      <h2>Hébergement</h2>
      <p>
        [Nom de l’hébergeur] — [adresse], [pays] — [site / téléphone]
        <br />
        (Ex. : Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, USA)
      </p>

      <h2>Activité</h2>
      <p>
        Vente en ligne d’illustrations et tirages d’art (multi-artistes), y
        compris des contenus numériques téléchargeables.
      </p>

      <h2>Propriété intellectuelle</h2>
      <p>
        Les œuvres, images, textes, logos et la charte graphique sont protégés
        par le droit d’auteur et le droit des marques. Les artistes restent
        titulaires de leurs droits. Toute reproduction ou diffusion sans
        autorisation est interdite. Les fichiers numériques vendus le sont sous
        licence d’usage (voir CGV — Licences).
      </p>

      <h2>Liens externes</h2>
      <p>
        {SITE_NAME} décline toute responsabilité relative aux contenus tiers
        accessibles via des liens sortants.
      </p>

      <h2>Signalement de contenu (LCEN art. 6)</h2>
      <p>
        Pour notifier un contenu manifestement illicite : écrivez à [email de
        contact] en précisant vos coordonnées, la description et l’URL du
        contenu, les motifs légaux du signalement et, si possible, la copie de
        la correspondance adressée à l’auteur.
      </p>

      <h2>Médiation à la consommation</h2>
      <p>
        Conformément à l’article L612-1 du Code de la consommation, vous pouvez
        recourir gratuitement au médiateur : <strong>[Nom du médiateur]</strong>{" "}
        — [site / contact]. Plateforme européenne de RLL :{" "}
        <a href="https://ec.europa.eu/consumers/odr" rel="noopener noreferrer">
          ec.europa.eu/consumers/odr
        </a>
        .
      </p>

      <h2>Droit applicable</h2>
      <p>
        Droit français. Compétence des tribunaux français sous réserve des
        règles d’ordre public.
      </p>

      <p className="text-sm opacity-70">
        Dernière mise à jour : 29 septembre 2025.
      </p>
    </main>
  );
}
