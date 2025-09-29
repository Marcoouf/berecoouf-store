import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Livraison & retours — Vague",
  description:
    "Informations sur la livraison des tirages, les téléchargements numériques, les modalités de retour et la rétractation éventuelle.",
  alternates: { canonical: "/livraison-retours" },
};

export default function ShippingReturnsPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12 prose prose-neutral dark:prose-invert">
      <h1>Livraison & retours</h1>

      <h2>Livraison (tirages)</h2>
      <ul>
        <li>
          <strong>Zones</strong> : France métropolitaine et Union européenne
          (nous consulter pour autres destinations).
        </li>
        <li>
          <strong>Transporteurs</strong> : [Colissimo/DPD/…] – colis suivis.
        </li>
        <li>
          <strong>Délais</strong> : fabrication <strong>[●]</strong> j ouvrés +
          livraison <strong>[●]</strong> j. Les cadres / grands formats peuvent
          rallonger le délai.
        </li>
        <li>
          <strong>Frais</strong> : calculés au panier selon format/poids/
          destination.
        </li>
        <li>
          <strong>Réception</strong> : ouvrez et vérifiez le colis ; en cas
          d’avarie, émettez des <em>réserves précises</em> au transporteur sous
          48 h et écrivez-nous à [email] avec photos.
        </li>
      </ul>

      <h2>Téléchargements (achats numériques)</h2>
      <ul>
        <li>Email avec lien(s) de téléchargement <strong>temporaire(s)</strong> après paiement.</li>
        <li>Nombre de téléchargements : <strong>[X]</strong>.</li>
        <li>Validité du lien : <strong>[X jours]</strong>.</li>
        <li>Problème ? Contact : [email] (nous réémettrons un lien si besoin).</li>
      </ul>

      <h2>Retours</h2>
      <ul>
        <li>
          <strong>Tirages sur mesure</strong> : pas de rétractation après
          lancement (art. L221-28 3°).
        </li>
        <li>
          <strong>Produits standard</strong> (si vendus) : rétractation 14 jours
          (voir CGV).
        </li>
        <li>
          <strong>Produit endommagé / non conforme</strong> : écrivez-nous sous{" "}
          <strong>[●]</strong> jours avec photos ; prise en charge et
          réexpédition après accord.
        </li>
      </ul>

      <p className="text-sm opacity-70">
        Dernière mise à jour : 29 septembre 2025.
      </p>
    </main>
  );
}
