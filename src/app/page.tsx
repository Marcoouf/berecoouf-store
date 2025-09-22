// src/app/page.tsx
import Site from "@/components/UI";
import { getCatalog as fetchCatalog } from "@/lib/getCatalog";

export const dynamic = "force-dynamic";

/**
 * Page d'accueil
 * - Reprend 100% de l'UI/UX définie dans `src/components/UI.tsx`.
 * - Passe le catalogue et l'état d'ouverture du panier (via ?cart=1).
 * - Tolérante aux erreurs : si le chargement du catalogue échoue, on envoie un objet vide.
 * - Garantit la présence de `priceMin` et `variants` (tableau) sur chaque œuvre pour l'UI.
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

  // Normalisation minimale pour l'UI : s'assurer que variants[] existe et que priceMin est défini
  const normalizedCatalog = {
    ...catalog,
    artworks: Array.isArray(catalog?.artworks)
      ? catalog.artworks.map((w: any) => {
        const variants = Array.isArray(w?.variants)
          ? w.variants
          : Array.isArray(w?.formats)
            ? w.formats
            : [];
        const prices = variants
          .map((v: any) => Number(v?.price ?? 0))
          .filter((n: number) => Number.isFinite(n) && n >= 0);
        const base = Number(w?.basePrice ?? 0);
        const priceMin = prices.length > 0
          ? Math.min(...prices)
          : (Number.isFinite(base) && base > 0 ? base : Number(w?.price ?? 0) || 0);
        return {
          ...w,
          variants,
          priceMin,
        };
      })
      : [],
  };

  return <Site openCartOnLoad={openCart} catalog={normalizedCatalog} />;
}