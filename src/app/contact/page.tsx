import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact — Vague",
  description:
    "Service client Vague : email, adresse postale et formulaire de contact.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12 prose prose-neutral dark:prose-invert">
      <h1>Contact</h1>
      <p>
        <strong>Service client Vague</strong>
        <br />
        Email : <a href="mailto:[email de contact]">[email de contact]</a>
        <br />
        Adresse : [adresse postale]
      </p>

      <h2>Nous écrire</h2>
      <p>
        Pour toute demande (commande, licence, facture, retour, droits
        d’auteur…), merci de préciser votre <strong>n° de commande</strong> et,
        si nécessaire, d’ajouter des captures d’écran.
      </p>

      {/* Si tu ajoutes un vrai formulaire, branche-le sur /api/contact ou Resend */}
      {/* <ContactForm /> */}
    </main>
  );
}
