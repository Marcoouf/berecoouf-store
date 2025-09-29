import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "FAQ — Vague",
  description:
    "Questions fréquentes sur les licences, téléchargements, délais de livraison, factures, commandes pro et support.",
  alternates: { canonical: "/faq" },
};

export default function FAQPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "Quels types d’achats puis-je faire ?",
        acceptedAnswer: {
          "@type": "Answer",
          text:
            "Des fichiers numériques (licence personnelle ou commerciale selon la variante) et des tirages fine-art (options de taille, papier, cadre, éditions limitées).",
        },
      },
      {
        "@type": "Question",
        name: "Puis-je utiliser un fichier pour un projet client ?",
        acceptedAnswer: {
          "@type": "Answer",
          text:
            "Oui si vous avez acheté une variante avec licence commerciale et dans son périmètre (supports, territoire, durée) indiqué sur la fiche et la licence PDF.",
        },
      },
      {
        "@type": "Question",
        name: "Combien de téléchargements et quelle durée ?",
        acceptedAnswer: {
          "@type": "Answer",
          text:
            "Par défaut [X] téléchargements par lien, valable [X jours]. En cas de souci, contactez le support pour réémission.",
        },
      },
      {
        "@type": "Question",
        name: "Quelle différence entre licence et propriété du tirage ?",
        acceptedAnswer: {
          "@type": "Answer",
          text:
            "Le tirage vous appartient matériellement ; les droits d’auteur restent à l’artiste. Les fichiers numériques ne peuvent pas être revendus ou partagés.",
        },
      },
      {
        "@type": "Question",
        name: "Quels sont les délais de livraison ?",
        acceptedAnswer: {
          "@type": "Answer",
          text:
            "Préparation [●] jours ouvrés + transport [●] jours. Un cadre ou grand format peut allonger le délai.",
        },
      },
      {
        "@type": "Question",
        name: "Comment obtenir une facture ?",
        acceptedAnswer: {
          "@type": "Answer",
          text:
            "La facture est envoyée par email après paiement et peut être accessible depuis votre compte si disponible.",
        },
      },
      {
        "@type": "Question",
        name: "Proposez-vous des commandes pro ou en quantité ?",
        acceptedAnswer: {
          "@type": "Answer",
          text:
            "Oui. Contactez-nous via /contact pour un devis personnalisé (licences commerciales, volumes, droits étendus).",
        },
      },
    ],
  };

  return (
    <main className="mx-auto max-w-3xl px-4 py-12 prose prose-neutral dark:prose-invert">
      <h1>FAQ</h1>

      <h2>Achats disponibles</h2>
      <p>
        Des <strong>fichiers numériques</strong> (licences au choix) et des{" "}
        <strong>tirages fine-art</strong> (taille, papier, cadre, éditions
        limitées).
      </p>

      <h2>Licences</h2>
      <p>
        Usage privé par défaut. La <strong>licence commerciale</strong> autorise
        certains usages pro (supports/territoire/durée) — voir la fiche œuvre et
        la licence PDF.
      </p>

      <h2>Téléchargements</h2>
      <p>
        Par défaut <strong>[X]</strong> téléchargements par lien, valable{" "}
        <strong>[X jours]</strong>. Support : [email].
      </p>

      <h2>Livraison</h2>
      <p>
        Préparation <strong>[●]</strong> j + transport <strong>[●]</strong> j
        (cadres et grands formats : délai supplémentaire possible).
      </p>

      <h2>Factures</h2>
      <p>Envoyées par email après paiement. Espace client si disponible.</p>

      <h2>Commandes pro</h2>
      <p>
        Besoin d’une licence élargie, d’un volume ou d’un contrat ?{" "}
        <a href="/contact">Contacte-nous</a>.
      </p>

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
