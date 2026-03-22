import { NextResponse } from "next/server";
import { getStripeClient } from "@/lib/stripe/stripeClient";
import { supabaseAdmin } from "@/lib/supabase/serverClient";
import { PLAN_PRICES_CENTS } from "@/lib/pricing";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const sig = req.headers.get("stripe-signature");
  if (!sig) return NextResponse.json({ error: "Missing stripe-signature header." }, { status: 400 });

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return NextResponse.json({ error: "Missing STRIPE_WEBHOOK_SECRET env var." }, { status: 500 });
  }

  const stripe = getStripeClient();
  const body = await req.text();

  let event: unknown;
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Webhook signature verification failed." }, { status: 400 });
  }

  try {
    const eventTyped = event as { type: string; data: { object: unknown } };

    if (eventTyped.type === "checkout.session.completed") {
      const session = eventTyped.data.object as {
        mode?: string;
        metadata?: { user_id?: string; plan?: string };
        customer?: string | null;
        subscription?: string | null;
      };
      if (session.mode === "subscription" && session.metadata?.user_id) {
        const userId = session.metadata.user_id;
        const plan = session.metadata.plan === "yearly" ? "yearly" : "monthly";
        const subId = session.subscription ?? undefined;
        let renewalISODate: string | null = null;

        if (subId) {
          const sub = await stripe.subscriptions.retrieve(subId);
          const periodEnd = (sub as { current_period_end?: number }).current_period_end;
          renewalISODate = periodEnd ? new Date(periodEnd * 1000).toISOString().slice(0, 10) : null;
        }

        await supabaseAdmin.from("golf_subscriptions").upsert(
          {
            user_id: userId,
            plan,
            status: "active",
            renewal_date: renewalISODate ?? new Date().toISOString().slice(0, 10),
            price_cents: PLAN_PRICES_CENTS[plan],
            currency: "USD",
            stripe_customer_id: session.customer ?? null,
            stripe_subscription_id: subId ?? null,
          },
          { onConflict: "user_id" },
        );
      }
    }

    if (eventTyped.type === "customer.subscription.updated" || eventTyped.type === "customer.subscription.deleted") {
      const sub = eventTyped.data.object as {
        id: string;
        customer?: string | null;
        status?: string;
        metadata?: { user_id?: string; plan?: string };
        current_period_end?: number;
      };
      const userId = sub.metadata?.user_id;
      if (userId) {
        const plan = sub.metadata?.plan === "yearly" ? "yearly" : "monthly";
        const mappedStatus =
          sub.status === "active"
            ? "active"
            : sub.status === "past_due" || sub.status === "unpaid"
              ? "past_due"
              : sub.status === "canceled"
                ? "cancelled"
                : "inactive";

        await supabaseAdmin.from("golf_subscriptions").upsert(
          {
            user_id: userId,
            plan,
            status: mappedStatus,
            renewal_date: sub.current_period_end ? new Date(sub.current_period_end * 1000).toISOString().slice(0, 10) : null,
            price_cents: PLAN_PRICES_CENTS[plan],
            currency: "USD",
            stripe_customer_id: sub.customer ?? null,
            stripe_subscription_id: sub.id,
          },
          { onConflict: "user_id" },
        );
      }
    }
  } catch (e) {
    // If DB update fails, return 500 so Stripe retries.
    return NextResponse.json({ error: e instanceof Error ? e.message : "Webhook handling failed." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

