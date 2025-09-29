import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Conditions Générales de Vente (CGV) — Vague",
  description:
    "CGV de Vague : commande, prix, paiement, livraison, téléchargements, licences d’usage, rétractation, garanties, responsabilités.",
  alternates: { canonical: "/cgv" },
};

const SITE_NAME = "Vague";

export default function CGVPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12 prose prose-neutral dark:prose-invert">
      <h1>Conditions Générales de Vente</h1>

      <h2>1. Objet</h2>
      <p>
        Les présentes CGV régissent les ventes réalisées sur {SITE_NAME} entre
        {` `}
        <strong>{SITE_NAME}</strong> (« nous ») et tout acheteur (« vous »).
      </p>

      <h2>2. Produits</h2>
      <p>
        <strong>Œuvres numériques</strong> : fichiers (JPG/PNG/TIFF, etc.)
        livrés via liens de téléchargement temporisés. <br />
        <strong>Tirages</strong> : impressions fine-art avec options (taille,
        papier, finition, cadre), pouvant être en <em>édition limitée</em>.
        L’affichage peut varier entre écran et impression.
      </p>

      <h2>3. Prix</h2>
      <p>
        Prix en euros TTC (sauf mention contraire), hors frais de livraison des
        tirages. {SITE_NAME} peut modifier les prix ; le prix applicable est
        celui affiché au moment de la validation de la commande. Facture envoyée
        par email ou disponible depuis le compte client.
      </p>

      <h2>4. Commande</h2>
      <p>
        Parcours : ajout au panier → récapitulatif → paiement sécurisé →
        confirmation. Nous pouvons refuser une commande pour motif légitime
        (fraude présumée, litige de paiement, indisponibilité…).
      </p>

      <h2>5. Paiement</h2>
      <p>
        Règlement via <strong>Stripe</strong> (CB, Apple Pay/Google Pay selon
        disponibilité). La commande est ferme après confirmation d’encaissement.
        3-D Secure peut être requis.
      </p>

      <h2>6. Livraison & téléchargements</h2>
      <ul>
        <li>
          <strong>Numérique</strong> : lien(s) de téléchargement expirable(s)
          envoyé(s) par email après paiement — délai immédiat à quelques
          minutes, quota par lien : <strong>[X]</strong>.
        </li>
        <li>
          <strong>Tirages</strong> : expédition à l’adresse fournie (FR/EU)
          avec suivi. Délais indicatifs : préparation <strong>[●]</strong> j
          ouvrés + transport <strong>[●]</strong> j. Frais calculés au panier.
        </li>
      </ul>

      <h2>7. Licences d’usage (contenus numériques)</h2>
      <p>
        Sauf mention contraire, la licence est <strong>non exclusive</strong> et{" "}
        <strong>non transférable</strong>.
      </p>
      <ul>
        <li>
          <strong>Licence personnelle</strong> : usage privé, affichage
          personnel, tirage privé (hors revente).
        </li>
        <li>
          <strong>Licence commerciale</strong> (si achetée) : usages pro dans le
          périmètre précisé (supports, territoire, durée) sur la fiche produit
          et la licence PDF.
        </li>
      </ul>
      <p>
        Interdits : revente/redistribution des fichiers, partage public,
        minting NFT, usage en marque/logo sans accord écrit, entraînement de
        modèles IA sans autorisation. Une <strong>licence PDF</strong> est
        fournie pour chaque achat numérique et accessible via{" "}
        <code>/licence/[orderItemId].pdf</code>.
      </p>

      <h2>8. Droit de rétractation</h2>
      <ul>
        <li>
          <strong>Tirages sur mesure</strong> : pas de rétractation après
          lancement de la production (art. L221-28 3° C. conso.).
        </li>
        <li>
          <strong>Fichiers numériques</strong> : si vous consentez à
          l’exécution immédiate et reconnaissez la perte du droit de
          rétractation (L221-28 13°), il n’y a pas de rétractation.
        </li>
        <li>
          <strong>Produits standard</strong> (le cas échéant) : rétractation
          sous 14 jours à réception ; vous supportez les frais de retour.
        </li>
      </ul>

      <h3>Formulaire type de rétractation</h3>
      <blockquote>
        À l’attention de {SITE_NAME}, [adresse], [email] <br />
        Je vous notifie ma rétractation du contrat portant sur la vente de
        [bien/service], commandé le [date], reçu le [date]. <br />
        Nom : […] — Adresse : […] — Signature (si papier) — Date : […]
      </blockquote>

      <h2>9. Conformité, garanties et retours</h2>
      <p>
        Garanties légales de conformité (L217-3 s.) et des vices cachés (1641
        C. civil). Pour anomalie de fichier ou avarie transport, contactez
        [email]. Demande de retour tirage sous <strong>[●]</strong> jours, avec
        photos ; renvoi après accord, dans l’emballage d’origine.
      </p>

      <h2>10. Disponibilités & éditions limitées</h2>
      <p>
        Le stock et les quotas d’édition limitée sont indicatifs. En cas
        d’indisponibilité post-commande : remboursement intégral.
      </p>

      <h2>11. Responsabilité</h2>
      <p>
        Nous ne sommes pas responsables des interruptions liées à la maintenance
        ou à des faits imprévisibles et irrésistibles d’un tiers, ni en cas de
        force majeure.
      </p>

      <h2>12. Données personnelles</h2>
      <p>
        Voir la <a href="/confidentialite">Politique de confidentialité</a>. Les
        traitements liés à la commande reposent sur l’exécution du contrat et
        sur nos obligations légales.
      </p>

      <h2>13. Propriété intellectuelle</h2>
      <p>
        Aucun transfert de droits d’auteur au-delà de la licence d’usage
        acquise. Un tirage confère seulement la propriété du support matériel.
      </p>

      <h2>14. Droit applicable — litiges</h2>
      <p>
        Droit français. Tentative de résolution amiable préalable. Médiation :{" "}
        <strong>[Nom du médiateur]</strong>. Plateforme RLL :{" "}
        <a href="https://ec.europa.eu/consumers/odr">
          ec.europa.eu/consumers/odr
        </a>
        .
      </p>

      <h2>15. Modifications</h2>
      <p>
        {SITE_NAME} peut modifier les présentes CGV ; la version applicable est
        celle en vigueur à la date de la commande.
      </p>

      <p className="text-sm opacity-70">
        Dernière mise à jour : 29 septembre 2025.
      </p>
    </main>
  );
}
