import { NextResponse } from "next/server";
import {
  getPayPalAccessToken,
  getPayPalConfig,
  paypalRequest,
} from "@/lib/paypal-server";
import { getSupabaseAdminClient } from "@/lib/vip-server";

interface PayPalWebhookEvent {
  event_type?: string;
  resource?: { id?: string };
}

interface PayPalVerificationResponse {
  verification_status?: string;
}

interface PayPalSubscription {
  id?: string;
  plan_id?: string;
  custom_id?: string;
  status?: string;
  subscriber?: { payer_id?: string };
  billing_info?: { next_billing_time?: string };
}

export async function POST(request: Request) {
  const webhookId = process.env.PAYPAL_WEBHOOK_ID;
  if (!webhookId) {
    console.error("PAYPAL_WEBHOOK_ID is not configured.");
    return NextResponse.json({ error: "PayPal webhook is not configured." }, { status: 500 });
  }

  let event: PayPalWebhookEvent;
  try {
    event = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid webhook payload." }, { status: 400 });
  }

  const transmissionHeaders = {
    auth_algo: request.headers.get("paypal-auth-algo"),
    cert_url: request.headers.get("paypal-cert-url"),
    transmission_id: request.headers.get("paypal-transmission-id"),
    transmission_sig: request.headers.get("paypal-transmission-sig"),
    transmission_time: request.headers.get("paypal-transmission-time"),
  };
  if (Object.values(transmissionHeaders).some((value) => !value)) {
    return NextResponse.json({ error: "PayPal signature headers are missing." }, { status: 400 });
  }

  let accessToken: string;
  let config: ReturnType<typeof getPayPalConfig>;
  try {
    ({ accessToken, config } = await getPayPalAccessToken());
  } catch (error) {
    console.error("PayPal webhook configuration error:", error);
    return NextResponse.json({ error: "Could not verify PayPal webhook." }, { status: 500 });
  }

  let verification: PayPalVerificationResponse;
  try {
    verification = await paypalRequest<PayPalVerificationResponse>(
      config.apiBaseUrl,
      accessToken,
      "/v1/notifications/verify-webhook-signature",
      {
        method: "POST",
        body: JSON.stringify({
          ...transmissionHeaders,
          webhook_id: webhookId,
          webhook_event: event,
        }),
      }
    );
  } catch (error) {
    console.error("PayPal webhook verification request failed:", error);
    return NextResponse.json({ error: "Could not verify PayPal webhook." }, { status: 502 });
  }

  if (verification.verification_status !== "SUCCESS") {
    console.error("PayPal webhook signature verification failed.");
    return NextResponse.json({ error: "Invalid webhook signature." }, { status: 400 });
  }

  const supportedEvents = new Set([
    "BILLING.SUBSCRIPTION.ACTIVATED",
    "BILLING.SUBSCRIPTION.UPDATED",
    "BILLING.SUBSCRIPTION.SUSPENDED",
    "BILLING.SUBSCRIPTION.CANCELLED",
    "BILLING.SUBSCRIPTION.EXPIRED",
  ]);
  if (!event.event_type || !supportedEvents.has(event.event_type)) {
    return NextResponse.json({ received: true });
  }
  if (!event.resource?.id) {
    console.error("PayPal subscription webhook does not include a subscription ID.");
    return NextResponse.json({ error: "Subscription ID is missing." }, { status: 400 });
  }

  let subscription: PayPalSubscription;
  try {
    subscription = await paypalRequest<PayPalSubscription>(
      config.apiBaseUrl,
      accessToken,
      `/v1/billing/subscriptions/${encodeURIComponent(event.resource.id)}`
    );
  } catch (error) {
    console.error("Could not retrieve PayPal subscription:", error);
    return NextResponse.json({ error: "Could not retrieve PayPal subscription." }, { status: 502 });
  }

  if (
    !subscription.id ||
    subscription.plan_id !== config.planId ||
    !subscription.custom_id
  ) {
    console.error("PayPal subscription is missing valid VIP metadata.");
    return NextResponse.json({ error: "Subscription metadata is invalid." }, { status: 400 });
  }

  const status = subscription.status?.toLowerCase();
  if (!status) {
    console.error("PayPal subscription does not include a status.");
    return NextResponse.json({ error: "Subscription status is missing." }, { status: 400 });
  }

  const currentPeriodEnd = subscription.billing_info?.next_billing_time
    ? new Date(subscription.billing_info.next_billing_time)
    : null;
  if (
    ["active", "suspended"].includes(status) &&
    (!currentPeriodEnd || !Number.isFinite(currentPeriodEnd.getTime()))
  ) {
    console.error("PayPal subscription does not include a valid next billing time.");
    return NextResponse.json({ error: "Subscription billing period is missing." }, { status: 400 });
  }

  let admin;
  try {
    admin = getSupabaseAdminClient();
  } catch (error) {
    console.error("Supabase VIP webhook configuration error:", error);
    return NextResponse.json({ error: "VIP webhook is not configured." }, { status: 500 });
  }

  const { error } = await admin.from("vip_subscriptions").upsert(
    {
      user_id: subscription.custom_id,
      stripe_subscription_id: null,
      stripe_customer_id: null,
      paypal_subscription_id: subscription.id,
      paypal_payer_id: subscription.subscriber?.payer_id || null,
      payment_provider: "paypal",
      status,
      current_period_end: currentPeriodEnd?.toISOString() || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );

  if (error) {
    console.error("Could not save PayPal VIP subscription:", error.message);
    return NextResponse.json({ error: "Could not update VIP subscription." }, { status: 500 });
  }

  if (!["active", "trialing"].includes(status)) {
    const { error: adsError } = await admin
      .from("bio_profiles")
      .update({ ads_enabled: true })
      .eq("user_id", subscription.custom_id);

    if (adsError) {
      console.error("Could not re-enable ads after VIP ended:", adsError.message);
      return NextResponse.json({ error: "Could not update page ad settings." }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}
