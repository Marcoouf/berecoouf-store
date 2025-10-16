# Berecoouf — boutique d’illustrations (starter)

Ultra-épuré, Next.js (App Router) + Tailwind. Panier client-side et galeries.

## Démarrage

```bash
npm install
npm run dev
```

Ouvre http://localhost:3000

## Configuration Stripe & Resend

- `STRIPE_SECRET_KEY` — clé secrète côté serveur.
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` — clé publishable pour le checkout.
- `STRIPE_WEBHOOK_SECRET` — secret du webhook (endpoint `/api/stripe/webhook`).
- `NEXT_PUBLIC_BASE_URL` — URL publique du site, utilisée dans les emails.
- `RESEND_API_KEY` — clé API Resend (facultatif mais requis pour l’envoi d’emails).
- `RESEND_FROM` — expéditeur, ex. `Vague <noreply@vague.art>`.
- `SALES_NOTIF_OVERRIDE` — adresse email interne recevant le récapitulatif commande.

Le checkout crée une commande en base (status `pending`), Stripe redirige vers `/merci`, puis le webhook confirme la commande (`paid`) et déclenche les emails :

1. Récapitulatif par artiste (si `contactEmail` renseigné dans l’admin).
2. Email de synthèse interne (`SALES_NOTIF_OVERRIDE`).

Tous les envois passent par Resend ; si la config manque, les commandes restent enregistrées mais les notifications sont simplement journalisées.

## Administration

- Ajoute/édite un artiste via `/admin/artists`.
- Renseigne l’« Email de contact » pour permettre les notifications automatiques.
- Vérifie que tous les artistes possèdent un email avec :

```bash
pnpm run check:artists
```

Le script retourne un code de sortie non nul si un artiste n’a pas d’email (pratique pour les CI/CD).

## Déploiement (Vercel)

1. `git init` puis commit et push vers GitHub
2. Import du repo sur Vercel
3. Variables d'env Stripe/Resend (voir ci-dessus), puis Deploy

---
Généré le 2025-08-18.
