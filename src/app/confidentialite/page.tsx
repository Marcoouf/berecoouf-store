import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Politique de confidentialité — Vague",
  description:
    "Politique de confidentialité RGPD : données collectées, finalités, bases légales, sous-traitants, transferts hors UE, durées, droits, cookies.",
  alternates: { canonical: "/confidentialite" },
};

const SITE_NAME = "Vague";

export default function ConfidentialitePage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "PrivacyPolicy",
    name: `Politique de confidentialité — ${SITE_NAME}`,
    url: "/confidentialite",
    publisher: { "@type": "Organization", name: SITE_NAME },
  };

  return (
    <main className="mx-auto max-w-3xl px-4 py-12 prose prose-neutral dark:prose-invert">
      <h1>Politique de confidentialité</h1>

      <p>
        Responsable de traitement : <strong>{SITE_NAME}</strong> — [forme],
        [adresse], SIREN [●], contact : [email DPO ou privacy].
      </p>

      <h2>1. Données collectées</h2>
      <ul>
        <li>
          <strong>Compte / commande</strong> : email, nom, adresse,
          téléphone, livraison, détails commande, montants, statut de paiement,
          historiques de téléchargements.
        </li>
        <li>
          <strong>Paiement</strong> : identifiants de paiement gérés par{" "}
          <strong>Stripe</strong> (nous ne stockons pas vos numéros de carte).
        </li>
        <li>
          <strong>Support</strong> : contenus des messages, pièces jointes, logs
          techniques.
        </li>
        <li>
          <strong>Analytics / cookies</strong> : mesure d’audience
          [Plausible/GA4], préférences cookies (voir § Cookies).
        </li>
      </ul>

      <h2>2. Finalités & bases légales</h2>
      <ul>
        <li>
          <strong>Exécution du contrat</strong> (art. 6-1-b) : panier, commande,
          livraison, téléchargement, facturation, licence PDF.
        </li>
        <li>
          <strong>Obligations légales</strong> (6-1-c) : comptabilité,
          facturation, lutte contre la fraude.
        </li>
        <li>
          <strong>Intérêt légitime</strong> (6-1-f) : amélioration du site,
          sécurité, prévention des abus, relation client B2B.
        </li>
        <li>
          <strong>Consentement</strong> (6-1-a) : newsletters, cookies non
          essentiels.
        </li>
      </ul>

      <h2>3. Destinataires / sous-traitants</h2>
      <p>
        Stripe (paiement), [Resend/Sendgrid] (emails), [Sanity/Strapi] (CMS),
        [R2/S3] (stockage), [Vercel] (hébergement), [Plausible/GA4] (analytics),
        [Cloudflare] (CDN). Des engagements conformes à l’art. 28 RGPD sont en
        place.
      </p>

      <h2>4. Transferts hors UE</h2>
      <p>
        Certains prestataires sont situés hors UE (ex. USA). Les transferts
        reposent sur des <em>clauses contractuelles types</em> ou mécanismes
        équivalents.
      </p>

      <h2>5. Durées de conservation</h2>
      <ul>
        <li>Données de commande : <strong>10 ans</strong> (obligations comptables).</li>
        <li>Comptes inactifs : <strong>3 ans</strong> après dernier contact.</li>
        <li>Tickets support : <strong>3 ans</strong>.</li>
        <li>Logs techniques : <strong>6 mois</strong>.</li>
        <li>Cookies : voir § Cookies.</li>
      </ul>

      <h2>6. Vos droits</h2>
      <p>
        Accès, rectification, effacement, limitation, opposition, portabilité,
        directives post-mortem, retrait du consentement. Exercice des droits :
        [email DPO]. Réclamation : CNIL (cnil.fr).
      </p>

      <h2>7. Sécurité</h2>
      <p>
        Chiffrement en transit (HTTPS), contrôle d’accès, journalisation des
        liens de téléchargement, URLs signées/expirantes.
      </p>

      <h2>8. Cookies & traceurs</h2>
      <p>
        Un bandeau de consentement permet d’accepter/refuser par finalité.
        Catégories :
      </p>
      <ul>
        <li>
          <strong>Essentiels</strong> (exemption) : session, panier, anti-CSRF,
          consent storage.
        </li>
        <li>
          <strong>Mesure d’audience</strong> : [Plausible/GA4] – durée [13/25
          mois].
        </li>
        <li>
          <strong>Marketing</strong> : [●] (si applicable).
        </li>
      </ul>
      <p>Vous pouvez modifier vos choix via « Gérer mes cookies ».</p>

      <h2>9. Contact</h2>
      <p>[Email DPO] — [adresse postale].</p>

      <p className="text-sm opacity-70">
        Dernière mise à jour : 29 septembre 2025.
      </p>

      <script
        type="application/ld+json"
        // @ts-ignore
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </main>
  );
}
