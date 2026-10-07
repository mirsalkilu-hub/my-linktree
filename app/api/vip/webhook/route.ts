import { NextResponse } from "next/server";
import Stripe from "stripe";
import {
  getStripeClient,
  getSupabaseAdminClient,
} from "@/lib/vip-server";

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!signature || !webhookSecret) {
    return NextResponse.json({ error: "Webhook signature or secret is missing." }, { status: 400 });
  }

  let stripe: Stripe;
  let event: Stripe.Event;
  let admin;

  try {
    stripe = getStripeClient();
    admin = getSupabaseAdminClient();
  } catch (error) {
    console.error("VIP webhook configuration error:", error);
    return NextResponse.json({ error: "VIP webhook is not configured." }, { status: 500 });
  }

  const rawBody = await request.text();
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (error) {
    console.error("Invalid Stripe webhook signature:", error);
    return NextResponse.json({ error: "Invalid webhook signature." }, { status: 400 });
  }

  let subscription: Stripe.Subscription | null = null;
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    if (session.mode === "subscription" && session.subscription) {
      const subscriptionId =
        typeof session.subscription === "string"
          ? session.subscription
          : session.subscription.id;
      try {
        subscription = await stripe.subscriptions.retrieve(subscriptionId);
      } catch (error) {
        console.error("Could not retrieve Stripe subscription:", error);
        return NextResponse.json({ error: "Could not retrieve subscription." }, { status: 500 });
      }
    }
  } else if (
    event.type === "customer.subscription.updated" ||
    event.type === "customer.subscription.deleted"
  ) {
    subscription = event.data.object as Stripe.Subscription;
  } else {
    return NextResponse.json({ received: true });
  }

  if (!subscription) return NextResponse.json({ received: true });

  const userId = subscription.metadata.user_id;
  if (!userId) {
    console.error("Stripe subscription is missing its user_id metadata.");
    return NextResponse.json({ error: "Subscription metadata is incomplete." }, { status: 400 });
  }

  const currentPeriodEnd = Math.max(
    ...subscription.items.data.map((item) => item.current_period_end)
  );
  if (!Number.isFinite(currentPeriodEnd) || currentPeriodEnd <= 0) {
    console.error("Stripe subscription does not include a valid billing period.");
    return NextResponse.json({ error: "Subscription billing period is missing." }, { status: 400 });
  }

  const customerId =
    typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer.id;
  const { error } = await admin.from("vip_subscriptions").upsert(
    {
      user_id: userId,
      stripe_subscription_id: subscription.id,
      stripe_customer_id: customerId,
      status: subscription.status,
      current_period_end: new Date(currentPeriodEnd * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );

  if (error) {
    console.error("Could not save VIP subscription:", error.message);
    return NextResponse.json({ error: "Could not update VIP subscription." }, { status: 500 });
  }

  if (
    !["active", "trialing"].includes(subscription.status) ||
    currentPeriodEnd * 1000 <= Date.now()
  ) {
    const { error: adsError } = await admin
      .from("bio_profiles")
      .update({ ads_enabled: true })
      .eq("user_id", userId);

    if (adsError) {
      console.error("Could not re-enable Adsterra ads after VIP ended:", adsError.message);
      return NextResponse.json({ error: "Could not update page ad settings." }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}
