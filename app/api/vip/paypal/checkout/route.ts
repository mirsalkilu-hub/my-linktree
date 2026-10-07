import { NextResponse } from "next/server";
import {
  getPayPalAccessToken,
  paypalRequest,
} from "@/lib/paypal-server";
import {
  getAuthenticatedUser,
  getSupabaseAdminClient,
} from "@/lib/vip-server";

interface PayPalSubscriptionResponse {
  id?: string;
  links?: Array<{ href: string; rel: string }>;
}

export async function POST(request: Request) {
  let user;
  let admin;
  try {
    user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: "Please sign in to continue." }, { status: 401 });
    }
    admin = getSupabaseAdminClient();
  } catch (error) {
    console.error("PayPal VIP checkout configuration error:", error);
    return NextResponse.json(
      { error: "PayPal checkout is not configured. Please contact support." },
      { status: 500 }
    );
  }

  const { data: subscription, error } = await admin
    .from("vip_subscriptions")
    .select("status, current_period_end")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    console.error("Could not check VIP subscription:", error.message);
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

  let returnUrl: string;
  let cancelUrl: string;
  try {
    const siteUrl = new URL(
      process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin
    );
    if (!["http:", "https:"].includes(siteUrl.protocol)) throw new Error("Invalid protocol");
    returnUrl = new URL("/dashboard/vip?paypal=success", siteUrl).toString();
    cancelUrl = new URL("/dashboard/vip?paypal=cancelled", siteUrl).toString();
  } catch (error) {
    console.error("Invalid NEXT_PUBLIC_SITE_URL:", error);
    return NextResponse.json({ error: "The site URL is not configured correctly." }, { status: 500 });
  }

  try {
    const { accessToken, config } = await getPayPalAccessToken();
    const created = await paypalRequest<PayPalSubscriptionResponse>(
      config.apiBaseUrl,
      accessToken,
      "/v1/billing/subscriptions",
      {
        method: "POST",
        headers: { Prefer: "return=representation" },
        body: JSON.stringify({
          plan_id: config.planId,
          custom_id: user.id,
          subscriber: user.email ? { email_address: user.email } : undefined,
          application_context: {
            brand_name: "urlyu.com",
            user_action: "SUBSCRIBE_NOW",
            shipping_preference: "NO_SHIPPING",
            return_url: returnUrl,
            cancel_url: cancelUrl,
          },
        }),
      }
    );

    const approvalUrl = created.links?.find((link) => link.rel === "approve")?.href;
    if (!created.id || !approvalUrl) {
      console.error("PayPal subscription response did not include an approval link.");
      return NextResponse.json({ error: "Could not start PayPal checkout." }, { status: 502 });
    }
    return NextResponse.json({ url: approvalUrl });
  } catch (error) {
    console.error("Could not create PayPal VIP subscription:", error);
    return NextResponse.json({ error: "Could not start PayPal checkout." }, { status: 502 });
  }
}
