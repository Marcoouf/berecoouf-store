// src/app/api/stripe/webhook/route.ts
import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { getCatalog } from "@/lib/getCatalog";
import type Stripe from "stripe";

// --- Resend (optionnel) ---
let resend: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { Resend } = require("resend");
  const key = process.env.RESEND_API_KEY;
  if (key) resend = new Resend(key);
} catch {
  // paquet non installé → on continuera sans email
}

export const runtime = "nodejs";

export async function POST(req: Request) {
  const sig = req.headers.get("stripe-signature");
  const whSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!sig || !whSecret) {
    // En dev, ne rien casser si non configuré
    return NextResponse.json({ ok: true });
  }

  const rawBody = await req.text();
  let event: any;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, whSecret);
  } catch (err: any) {
    console.error("Webhook signature failed:", err?.message);
    // On répond 400 pour signaler la mauvaise signature
    return new NextResponse("Bad signature", { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const sessionObj = event.data.object as { id: string };

    // 1) Récupère la session SANS expand shipping_details (interdit sur ta version)
    const full = (await stripe.checkout.sessions.retrieve(sessionObj.id)) as unknown as Stripe.Checkout.Session;

    // 2) Récupère les lignes avec le product expandé (méthode sûre)
    const lineItems = await stripe.checkout.sessions.listLineItems(sessionObj.id, {
      expand: ["data.price.product"],
      limit: 100,
    });

    const shipping: any = (full as any).shipping_details; // peut être undefined
    const customerEmail = full.customer_details?.email ?? full.customer_email ?? "";
    const currency = (full.currency ?? "eur").toUpperCase();
    const amountTotal = (full.amount_total ?? 0) / 100;

    const items = (lineItems.data ?? []).map((li: any) => {
      const qty = li.quantity ?? 1;
      const unit = (li.price?.unit_amount ?? 0) / 100;
      const name =
        li.description ||
        (typeof li.price?.product !== "string" ? li.price?.product?.name : "Œuvre");
      const meta =
        typeof li.price?.product !== "string" ? li.price?.product?.metadata ?? {} : {};
      return { name, qty, unit, total: unit * qty, metadata: meta };
    });

    // Cherche emails artistes depuis le catalogue (par workId)
    let recipients: string[] = [];
    try {
      const catalog = await getCatalog();
      const artistEmails = new Set<string>();
      for (const it of items) {
        const workId = (it.metadata?.workId as string) || "";
        const work = catalog.artworks?.find((w: any) => w.id === workId);
        const artist = work && catalog.artists?.find((a: any) => a.id === work.artistId);
        const email: string | undefined =
          (artist as any)?.email || (artist as any)?.contact?.email;
        if (email) artistEmails.add(email);
      }
      recipients = Array.from(artistEmails);
    } catch (e) {
      console.warn("getCatalog() failed for webhook artist lookup:", e);
    }

    // Override (toujours appliqué en dernier)
    const override = process.env.SALES_NOTIF_OVERRIDE;
    if (override) recipients = [override];

    // Adresse lisible (si renseignée)
    const addr = shipping?.address as any;
    const name = shipping?.name ?? addr?.name ?? "";
    const phone = shipping?.phone ?? "";
    const addressText = addr
      ? [name, addr.line1, addr.line2, `${addr.postal_code ?? ""} ${addr.city ?? ""}`.trim(), addr.country, phone]
          .filter(Boolean)
          .join("\n")
      : "(adresse non fournie)";

    // Rendu des articles pour l’email
    const lines = items
      .map((it) => `• ${it.name} × ${it.qty} — ${it.total.toFixed(2)} ${currency}`)
      .join("\n");

    // Envoi email via Resend si configuré
    const from = process.env.RESEND_FROM || "Acme <onboarding@resend.dev>";

    if (!resend) {
      console.log("Webhook OK, email NON envoyé (Resend désactivé)", {
        reason: !process.env.RESEND_API_KEY ? "RESEND_API_KEY missing" : "package not installed",
        recipients,
        from,
        customerEmail,
        amountTotal,
        currency,
        addressText,
        items,
      });
      return NextResponse.json({ received: true });
    }

    if (recipients.length === 0) {
      console.log("Webhook OK, email NON envoyé (aucun destinataire)", {
        recipients,
        hint: "Définir SALES_NOTIF_OVERRIDE=ton@email.com pour tester",
      });
      return NextResponse.json({ received: true });
    }

    try {
      const html = `
        <h2>Nouvelle commande confirmée</h2>
        <p><strong>Session Stripe :</strong> ${full.id}</p>
        <p><strong>Email client :</strong> ${customerEmail}</p>
        <h3>Articles</h3>
        <pre>${lines}</pre>
        <h3>Adresse de livraison</h3>
        <pre>${addressText}</pre>
      `;
      await resend.emails.send({
        from,
        to: recipients,
        subject: "Nouvelle commande – œuvre physique",
        html,
      });
      console.log("Email envoyé via Resend →", { to: recipients, from });
    } catch (e) {
      console.error("Resend send failed:", e);
    }
  }

  // Toujours répondre 200 pour éviter les retries agressifs du CLI en dev
  return NextResponse.json({ received: true });
}