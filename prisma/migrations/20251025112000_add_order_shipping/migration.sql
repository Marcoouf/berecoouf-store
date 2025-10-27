-- Create enum for shipping status if not exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ShippingStatus') THEN
    CREATE TYPE "ShippingStatus" AS ENUM ('pending', 'packing', 'shipped', 'delivered');
  END IF;
END
$$;

ALTER TABLE "Order"
  ADD COLUMN IF NOT EXISTS "shippingStatus" "ShippingStatus" NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS "trackingUrl" TEXT;
