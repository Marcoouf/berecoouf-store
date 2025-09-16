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

export async function POST(req: Request) {
  try {
    const { items, email } = (await req.json()) as { items: CartItem[]; email?: string };

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Panier vide" }, { status: 400 });
    }

    const line_items = items.map((i) => {
      const qty = Number.isFinite(i.qty) && i.qty > 0 ? Math.floor(i.qty) : 1;
      const unit = toCents(Number(i.price || 0));
      if (!Number.isFinite(unit) || unit <= 0) {
        throw new Error("Prix invalide");
      }
      return {
        quantity: qty,
        price_data: {
          currency: "eur",
          unit_amount: unit,
          product_data: {
            name: i.title || "Œuvre",
            description: i.artistName ? `par ${i.artistName}` : undefined,
            // Stripe accepte des URLs absolues uniquement; si ce n'est pas le cas, on ignore l'image
            images: i.image && /^https?:\/\//.test(i.image) ? [i.image] : undefined,
            metadata: {
              workId: i.workId,
              variantId: i.variantId,
            },
          },
        },
      } as const;
    });

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
      metadata: {
        cart: JSON.stringify(
          items.map(({ qty, workId, variantId }) => ({ qty, workId, variantId }))
        ),
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (e) {
    console.error("checkout error", e);
    return NextResponse.json({ error: "Erreur création session" }, { status: 500 });
  }
}