-- Frais de livraison stockés séparément
ALTER TABLE "Order"
    ADD COLUMN "shippingAmount" INTEGER NOT NULL DEFAULT 0;
