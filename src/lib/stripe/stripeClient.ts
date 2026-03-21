import Stripe from "stripe";

export function getStripeClient(): Stripe {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    // Avoid crashing during build; real requests will fail with a clear error.
    throw new Error("Missing STRIPE_SECRET_KEY env var.");
  }
  return new Stripe(secretKey);
}

