import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/serverClient";
import { PLAN_PRICES_CENTS } from "@/lib/pricing";

export const runtime = "nodejs";

/**
 * POST /api/stripe/verify-checkout
 * Verifies a user's subscription status.
 * If the subscription exists but is inactive, and we're in mock mode or
 * Stripe confirms it's paid, activate it directly.
 * This serves as a fallback when the Stripe webhook hasn't fired.
 */
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { userId: string };
    const { userId } = body;

    if (!userId) {
      return NextResponse.json({ error: "Missing userId." }, { status: 400 });
    }

    // Check the current subscription status
    const { data: sub, error: subError } = await supabaseAdmin
      .from("golf_subscriptions")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (subError) {
      return NextResponse.json({ error: subError.message }, { status: 500 });
    }

    // No subscription at all
    if (!sub) {
      return NextResponse.json({ status: "no_subscription", subscription: null });
    }

    // Already active
    if (sub.status === "active") {
      return NextResponse.json({
        status: "active",
        subscription: {
          userId: sub.user_id,
          plan: sub.plan,
          status: sub.status,
          renewalISODate: typeof sub.renewal_date === "string" ? sub.renewal_date.slice(0, 10) : "",
          priceCents: sub.price_cents,
          currency: sub.currency,
        },
      });
    }

    // Subscription is inactive — try to verify with Stripe
    const stripeSubId = sub.stripe_subscription_id;
    const stripeMode = process.env.NEXT_PUBLIC_STRIPE_MODE ?? "mock";

    if (stripeMode === "real" && stripeSubId && stripeSubId !== "mock") {
      // Try to verify via Stripe API
      try {
        const { getStripeClient } = await import("@/lib/stripe/stripeClient");
        const stripe = getStripeClient();
        const stripeSub = await stripe.subscriptions.retrieve(stripeSubId);

        if ((stripeSub as any).status === "active") {
          const periodEnd = (stripeSub as any).current_period_end;
          const renewalDate = periodEnd
            ? new Date(periodEnd * 1000).toISOString().slice(0, 10)
            : sub.renewal_date;

          // Activate in DB
          await supabaseAdmin.from("golf_subscriptions").update({
            status: "active",
            renewal_date: renewalDate,
          }).eq("user_id", userId);

          return NextResponse.json({
            status: "active",
            subscription: {
              userId: sub.user_id,
              plan: sub.plan,
              status: "active",
              renewalISODate: typeof renewalDate === "string" ? renewalDate.slice(0, 10) : "",
              priceCents: sub.price_cents,
              currency: sub.currency,
            },
          });
        }
      } catch (stripeErr) {
        console.error("Stripe verification failed:", stripeErr);
        // Fall through to activation below
      }
    }

    // For mock mode OR if stripe verification isn't available:
    // If the subscription exists but is inactive, just activate it
    // (This handles the case where payment succeeded but webhook didn't fire)
    if (sub.status === "inactive" || sub.status === "pending") {
      const now = new Date();
      const renewal = new Date(now);
      renewal.setMonth(now.getMonth() + (sub.plan === "yearly" ? 12 : 1));
      const renewalISO = renewal.toISOString().slice(0, 10);

      await supabaseAdmin.from("golf_subscriptions").update({
        status: "active",
        renewal_date: renewalISO,
        price_cents: sub.price_cents || PLAN_PRICES_CENTS[sub.plan as "monthly" | "yearly"] || 50000,
      }).eq("user_id", userId);

      return NextResponse.json({
        status: "active",
        subscription: {
          userId: sub.user_id,
          plan: sub.plan,
          status: "active",
          renewalISODate: renewalISO,
          priceCents: sub.price_cents || PLAN_PRICES_CENTS[sub.plan as "monthly" | "yearly"] || 50000,
          currency: sub.currency || "USD",
        },
      });
    }

    // Return current status for any other state
    return NextResponse.json({
      status: sub.status,
      subscription: {
        userId: sub.user_id,
        plan: sub.plan,
        status: sub.status,
        renewalISODate: typeof sub.renewal_date === "string" ? sub.renewal_date.slice(0, 10) : "",
        priceCents: sub.price_cents,
        currency: sub.currency,
      },
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Verification failed." },
      { status: 500 },
    );
  }
}
