// src/app/api/checkout/route.ts
import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";

type CartItem = {
  workId: string;
  variantId: string;
  title: string;
  artistName?: string;
  image?: string;
  price: number; // euros OU centimes selon la source → normalisé ci-dessous
  qty: number;
};

export const runtime = "nodejs"; // Stripe SDK Node

// Normalise un prix potentiellement fourni en euros → centimes
// Heuristique: si < 1000 on considère que c'est des euros (160 → 16000), sinon déjà en centimes
const toCents = (n: number) => (n < 1000 ? Math.round(n * 100) : Math.round(n));

// Découpe une longue chaîne en segments compatibles metadata Stripe (<= 500 chars par valeur)
const chunk = (str: string, size = 450) => {
  const out: string[] = []
  for (let i = 0; i < str.length; i += size) out.push(str.slice(i, i + size))
  return out
}

export async function POST(req: Request) {
  try {
    const { items, email } = (await req.json()) as { items: CartItem[]; email?: string };

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Panier vide" }, { status: 400 });
    }

    // Normalise les lignes et BLOQUE si un prix est nul/invalid (on ne "filtre" pas silencieusement)
    const normalized = items.map((i) => {
      const qty = Number.isFinite(i.qty) && i.qty > 0 ? Math.floor(i.qty) : 1
      const unit = toCents(Number(i.price || 0))
      return { ...i, qty, unit }
    })

    const zeroItems = normalized.filter((n) => !Number.isFinite(n.unit) || n.unit <= 0)
    if (zeroItems.length) {
      return NextResponse.json(
        {
          error: "zero_price_item",
          message:
            "Un ou plusieurs articles ont un prix invalide (0€). Corrigez le prix dans l’admin puis réessayez.",
          items: zeroItems.map(({ workId, variantId }) => ({ workId, variantId })),
        },
        { status: 400 }
      )
    }

    const line_items = normalized.map((n) => ({
      quantity: n.qty,
      price_data: {
        currency: "eur",
        unit_amount: n.unit,
        product_data: {
          name: n.title || "Œuvre",
          description: n.artistName ? `par ${n.artistName}` : undefined,
          // Stripe accepte des URLs absolues uniquement; si ce n'est pas le cas, on ignore l'image
          images: n.image && /^https?:\/\//.test(n.image) ? [n.image] : undefined,
          // IDs utiles par ligne, lus dans le webhook
          metadata: {
            workId: n.workId,
            variantId: n.variantId,
          },
        },
      },
    } as const))

    const siteUrl = process.env.SITE_URL ?? "http://localhost:3000";

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items,
      success_url: `${siteUrl}/merci?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/cart?cancelled=1`,
      customer_email: email,
      // --- Adresse & livraison (vente physique) ---
      shipping_address_collection: {
        allowed_countries: ["FR", "BE", "CH", "DE", "ES", "IT", "NL", "LU"],
      },
      phone_number_collection: { enabled: true },
      shipping_options: [
        {
          shipping_rate_data: {
            type: "fixed_amount",
            fixed_amount: { amount: toCents(6), currency: "eur" },
            display_name: "Standard (3–6 j)",
            delivery_estimate: {
              minimum: { unit: "business_day", value: 3 },
              maximum: { unit: "business_day", value: 6 },
            },
          },
        },
        {
          shipping_rate_data: {
            type: "fixed_amount",
            fixed_amount: { amount: toCents(12), currency: "eur" },
            display_name: "Express (24–48h)",
            delivery_estimate: {
              minimum: { unit: "business_day", value: 1 },
              maximum: { unit: "business_day", value: 2 },
            },
          },
        },
      ],
      // Métadonnées compactes (évite la limite Stripe de 500 chars/valeur)
      // Exemple: "2*w-01:varA|1*w-05:varB|1*w-03:varC"
      payment_intent_data: {
        metadata: (() => {
          const compact = normalized
            .map((n) => `${n.qty}*${n.workId}${n.variantId ? ":" + n.variantId : ""}`)
            .join("|")
          const parts = chunk(compact, 450)
          const meta: Record<string, string> = { items_count: String(normalized.length) }
          parts.forEach((p, i) => (meta[`items_${i + 1}`] = p))
          return meta
        })(),
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (e) {
    console.error("checkout error", e);
    return NextResponse.json({ error: "checkout_failed" }, { status: 500 });
  }
}