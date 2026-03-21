import { NextResponse } from "next/server";
import { getStripeClient } from "@/lib/stripe/stripeClient";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { plan: "monthly" | "yearly"; userId: string; email: string };
    const { plan, userId, email } = body;

    if (!plan || !userId || !email) {
      return NextResponse.json({ error: "Missing plan/userId/email." }, { status: 400 });
    }

    const stripe = getStripeClient();

    const priceIdMonthly = process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_MONTHLY;
    const priceIdYearly = process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_YEARLY;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

    const priceId = plan === "monthly" ? priceIdMonthly : priceIdYearly;
    if (!priceId) {
      return NextResponse.json({ error: "Missing Stripe price id env vars." }, { status: 500 });
    }

    // Create the checkout session for subscription.
    // Note: for production, you may want to store/reuse stripe customer ids per user.
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer_email: email,
      line_items: [{ price: priceId, quantity: 1 }],
      allow_promotion_codes: true,
      success_url: `${appUrl}/dashboard?checkout=success`,
      cancel_url: `${appUrl}/auth/signup?checkout=cancel`,
      client_reference_id: userId,
      metadata: {
        user_id: userId,
        plan,
      },
    });

    if (!session.url) {
      return NextResponse.json({ error: "Stripe session URL missing." }, { status: 500 });
    }

    return NextResponse.json({ url: session.url });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Failed to create checkout session." }, { status: 500 });
  }
}

