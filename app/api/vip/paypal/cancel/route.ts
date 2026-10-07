import { NextResponse } from "next/server";
import {
  getPayPalAccessToken,
  paypalRequest,
} from "@/lib/paypal-server";
import {
  getAuthenticatedUser,
  getSupabaseAdminClient,
} from "@/lib/vip-server";

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
    console.error("PayPal cancellation configuration error:", error);
    return NextResponse.json(
      { error: "PayPal subscription management is not configured." },
      { status: 500 }
    );
  }

  const { data: subscription, error: lookupError } = await admin
    .from("vip_subscriptions")
    .select("paypal_subscription_id, payment_provider, status")
    .eq("user_id", user.id)
    .maybeSingle();

  if (lookupError) {
    console.error("Could not load PayPal VIP subscription:", lookupError.message);
    return NextResponse.json({ error: "Could not load VIP subscription." }, { status: 500 });
  }
  if (
    subscription?.payment_provider !== "paypal" ||
    !subscription.paypal_subscription_id
  ) {
    return NextResponse.json({ error: "No PayPal subscription was found." }, { status: 404 });
  }

  try {
    const { accessToken, config } = await getPayPalAccessToken();
    await paypalRequest<null>(
      config.apiBaseUrl,
      accessToken,
      `/v1/billing/subscriptions/${encodeURIComponent(subscription.paypal_subscription_id)}/cancel`,
      {
        method: "POST",
        body: JSON.stringify({ reason: "Cancelled by the VIP member" }),
      }
    );
  } catch (error) {
    console.error("Could not cancel PayPal VIP subscription:", error);
    return NextResponse.json({ error: "Could not cancel PayPal subscription." }, { status: 502 });
  }

  const cancelledAt = new Date().toISOString();
  const { error: updateError } = await admin
    .from("vip_subscriptions")
    .update({ status: "cancelled", current_period_end: cancelledAt, updated_at: cancelledAt })
    .eq("user_id", user.id)
    .eq("paypal_subscription_id", subscription.paypal_subscription_id);

  if (updateError) {
    console.error("Could not update cancelled PayPal subscription:", updateError.message);
    return NextResponse.json({ error: "PayPal cancelled the subscription, but VIP status could not be updated." }, { status: 500 });
  }

  const { error: adsError } = await admin
    .from("bio_profiles")
    .update({ ads_enabled: true })
    .eq("user_id", user.id);
  if (adsError) {
    console.error("Could not re-enable ads after PayPal cancellation:", adsError.message);
    return NextResponse.json({ error: "Subscription was cancelled, but page ad settings could not be updated." }, { status: 500 });
  }

  return NextResponse.json({ cancelled: true });
}
