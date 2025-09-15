// src/app/page.tsx
import Site from "@/components/UI";
import { getCatalog as fetchCatalog } from "@/lib/getCatalog";

export const dynamic = "force-dynamic";

/**
 * Page d'accueil
 * - Reprend 100% de l'UI/UX définie dans `src/components/UI.tsx`.
 * - Passe le catalogue et l'état d'ouverture du panier (via ?cart=1).
 * - Tolérante aux erreurs : si le chargement du catalogue échoue, on envoie un objet vide.
 */
export default async function Page({
  searchParams,
}: {
  searchParams?: { cart?: string };
}) {
  const openCart = searchParams?.cart === "1";

  // Chargement robuste du catalogue
  let catalog: any = null;
  try {
    catalog = await fetchCatalog();
  } catch (_) {
    // Fallback minimal pour éviter de casser le rendu de l'UI
    catalog = {
      artworks: [],
      artists: [],
      collections: [],
    } as any;
  }

  return <Site openCartOnLoad={openCart} catalog={catalog} />;
}