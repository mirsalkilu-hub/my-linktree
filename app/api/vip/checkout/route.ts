import { NextResponse } from "next/server";
import Stripe from "stripe";
import {
  getAuthenticatedUser,
  getStripeClient,
  getSupabaseAdminClient,
} from "@/lib/vip-server";

export async function POST(request: Request) {
  let user;
  let stripe: Stripe;
  let admin;

  try {
    user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: "Please sign in to continue." }, { status: 401 });
    }
    stripe = getStripeClient();
    admin = getSupabaseAdminClient();
  } catch (error) {
    console.error("VIP checkout configuration error:", error);
    return NextResponse.json(
      { error: "VIP checkout is not configured. Please contact support." },
      { status: 500 }
    );
  }

  const { data: subscription, error: subscriptionError } = await admin
    .from("vip_subscriptions")
    .select("status, current_period_end")
    .eq("user_id", user.id)
    .maybeSingle();

  if (subscriptionError) {
    console.error("Could not check VIP subscription:", subscriptionError.message);
    return NextResponse.json({ error: "Could not check VIP status." }, { status: 500 });
  }

  if (
    subscription &&
    ["active", "trialing"].includes(subscription.status) &&
    subscription.current_period_end &&
    new Date(subscription.current_period_end).getTime() > Date.now()
  ) {
    return NextResponse.json({ error: "Your VIP subscription is already active." }, { status: 409 });
  }

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin;
  let successUrl: string;
  let cancelUrl: string;
  try {
    const siteUrl = new URL(baseUrl);
    if (!["http:", "https:"].includes(siteUrl.protocol)) throw new Error("Invalid protocol");
    successUrl = new URL("/dashboard/vip?checkout=success", siteUrl).toString();
    cancelUrl = new URL("/dashboard/vip?checkout=cancelled", siteUrl).toString();
  } catch (error) {
    console.error("Invalid NEXT_PUBLIC_SITE_URL:", error);
    return NextResponse.json({ error: "The site URL is not configured correctly." }, { status: 500 });
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      client_reference_id: user.id,
      customer_email: user.email,
      line_items: [
        {
          price_data: {
            currency: "usd",
            unit_amount: 2000,
            recurring: { interval: "year" },
            product_data: { name: "VIP Membership" },
          },
          quantity: 1,
        },
      ],
      metadata: { user_id: user.id },
      subscription_data: { metadata: { user_id: user.id } },
      success_url: successUrl,
      cancel_url: cancelUrl,
    });

    if (!session.url) {
      console.error("Stripe did not return a checkout URL.");
      return NextResponse.json({ error: "Could not create the checkout session." }, { status: 502 });
    }

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Could not create Stripe VIP checkout session:", error);
    return NextResponse.json({ error: "Could not start VIP checkout." }, { status: 502 });
  }
}
