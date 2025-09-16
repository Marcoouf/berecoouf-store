// src/lib/stripe.ts
import Stripe from "stripe";

const key = process.env.STRIPE_SECRET_KEY;
if (!key) {
  throw new Error("STRIPE_SECRET_KEY manquant");
}

export const stripe = new Stripe(key, {});