import { NextResponse } from "next/server";
import {
  getAuthenticatedUser,
  getStripeClient,
  getSupabaseAdminClient,
} from "@/lib/vip-server";

export async function POST(request: Request) {
  let user;
  let stripe;
  let admin;

  try {
    user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: "Please sign in to continue." }, { status: 401 });
    }
    stripe = getStripeClient();
    admin = getSupabaseAdminClient();
  } catch (error) {
    console.error("VIP portal configuration error:", error);
    return NextResponse.json(
      { error: "VIP subscription management is not configured." },
      { status: 500 }
    );
  }

  const { data: subscription, error } = await admin
    .from("vip_subscriptions")
    .select("stripe_customer_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    console.error("Could not load VIP customer:", error.message);
    return NextResponse.json({ error: "Could not load VIP subscription." }, { status: 500 });
  }
  if (!subscription?.stripe_customer_id) {
    return NextResponse.json({ error: "No Stripe subscription was found." }, { status: 404 });
  }

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin;
  try {
    const returnUrl = new URL("/dashboard/vip", baseUrl);
    const session = await stripe.billingPortal.sessions.create({
      customer: subscription.stripe_customer_id,
      return_url: returnUrl.toString(),
    });
    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Could not create Stripe billing portal session:", error);
    return NextResponse.json(
      { error: "Could not open subscription management. Please contact support." },
      { status: 502 }
    );
  }
}
