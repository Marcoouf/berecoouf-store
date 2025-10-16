// src/lib/stripe.ts
import Stripe from 'stripe'

const key = process.env.STRIPE_SECRET_KEY
if (!key) {
  throw new Error('STRIPE_SECRET_KEY manquant')
}

/**
 * On fige la version Stripe pour éviter les régressions lors de mises à jour côté API.
 * Tu peux la surcharger via STRIPE_API_VERSION dans `.env` (ex: 2024-06-20).
 * Si non définie, on utilise une version stable connue.
 */
const apiVersion = (process.env.STRIPE_API_VERSION ?? '2022-11-15') as Stripe.StripeConfig['apiVersion']

// Instance unique de Stripe, exportée une seule fois
export const stripe = new Stripe(key, {
  apiVersion,
  maxNetworkRetries: 2, // quelques retries réseau pour plus de robustesse
  appInfo: {
    name: 'Vague',
    version: process.env.npm_package_version ?? '0.1.0',
  },
})