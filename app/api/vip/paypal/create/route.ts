import { NextResponse } from "next/server";
import {
  getPayPalAccessToken,
  PayPalRequestError,
  paypalRequest,
} from "@/lib/paypal-server";
import {
  getAuthenticatedUser,
  getSupabaseAdminClient,
} from "@/lib/vip-server";

type VipPlan = "monthly" | "annual";

interface PayPalSubscription {
  id?: string;
  plan_id?: string;
  status?: string;
  links?: Array<{ href?: string; rel?: string }>;
}

function getApprovalUrl(subscription: PayPalSubscription) {
  const approvalUrl = subscription.links?.find((link) => link.rel === "approve")?.href;
  if (!approvalUrl) return null;

  try {
    const url = new URL(approvalUrl);
    if (
      url.protocol !== "https:" ||
      (url.hostname !== "paypal.com" && !url.hostname.endsWith(".paypal.com"))
    ) {
      return null;
    }
    return url.toString();
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return NextResponse.json({ error: "Please sign in to continue." }, { status: 401 });
  }

  let requestBody: unknown;
  try {
    requestBody = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }
  if (
    typeof requestBody !== "object" ||
    requestBody === null ||
    !("plan" in requestBody) ||
    (requestBody.plan !== "monthly" && requestBody.plan !== "annual")
  ) {
    return NextResponse.json({ error: "Choose a valid VIP plan." }, { status: 400 });
  }
  const plan = requestBody.plan as VipPlan;

  let admin;
  try {
    admin = getSupabaseAdminClient();
  } catch (error) {
    console.error("PayPal checkout configuration error:", error);
    return NextResponse.json({ error: "PayPal checkout is not configured." }, { status: 503 });
  }

  const { data: currentSubscription, error: lookupError } = await admin
    .from("vip_subscriptions")
    .select("status, current_period_end, paypal_subscription_id, payment_provider")
    .eq("user_id", user.id)
    .maybeSingle();

  if (lookupError) {
    console.error("Could not check existing VIP subscription:", lookupError.message);
    return NextResponse.json({ error: "Could not check your VIP status." }, { status: 500 });
  }

  if (
    currentSubscription &&
    ["active", "trialing"].includes(currentSubscription.status) &&
    currentSubscription.current_period_end &&
    new Date(currentSubscription.current_period_end).getTime() > Date.now()
  ) {
    return NextResponse.json({ error: "You already have an active VIP membership." }, { status: 409 });
  }

  try {
    const { accessToken, config } = await getPayPalAccessToken();
    const planId = plan === "monthly" ? config.monthlyPlanId : config.annualPlanId;
    if (!planId) {
      console.error(`PayPal ${plan} VIP plan is not configured.`);
      return NextResponse.json({ error: "This PayPal plan is not configured yet." }, { status: 503 });
    }

    if (
      currentSubscription?.payment_provider === "paypal" &&
      currentSubscription.status === "approval_pending" &&
      currentSubscription.paypal_subscription_id
    ) {
      try {
        const pending = await paypalRequest<PayPalSubscription>(
          config.apiBaseUrl,
          accessToken,
          `/v1/billing/subscriptions/${encodeURIComponent(currentSubscription.paypal_subscription_id)}`
        );
        if (pending.status === "APPROVAL_PENDING" && pending.plan_id === planId) {
          const approvalUrl = getApprovalUrl(pending);
          if (!approvalUrl) {
            console.error("PayPal pending subscription did not include a valid approval URL.");
            return NextResponse.json({ error: "Could not resume PayPal approval." }, { status: 502 });
          }
          return NextResponse.json({ approvalUrl });
        }
        if (pending.status === "APPROVAL_PENDING") {
          await paypalRequest<null>(
            config.apiBaseUrl,
            accessToken,
            `/v1/billing/subscriptions/${encodeURIComponent(currentSubscription.paypal_subscription_id)}/cancel`,
            {
              method: "POST",
              body: JSON.stringify({ reason: "The customer selected a different VIP plan" }),
            }
          );
        }
      } catch (error) {
        if (
          !(error instanceof PayPalRequestError) ||
          error.status !== 404 ||
          !error.issueCodes.includes("INVALID_RESOURCE_ID")
        ) {
          throw error;
        }
        console.warn("PayPal no longer recognizes the pending VIP subscription; creating a new checkout.");
      }
    }

    const siteUrlValue = process.env.NEXT_PUBLIC_SITE_URL;
    if (!siteUrlValue) {
      console.error("NEXT_PUBLIC_SITE_URL is not configured.");
      return NextResponse.json({ error: "The checkout return URL is not configured." }, { status: 503 });
    }

    let siteUrl: URL;
    try {
      siteUrl = new URL(siteUrlValue);
    } catch {
      console.error("NEXT_PUBLIC_SITE_URL is invalid.");
      return NextResponse.json({ error: "The checkout return URL is not configured." }, { status: 503 });
    }
    if (
      (siteUrl.protocol !== "https:" && siteUrl.hostname !== "localhost") ||
      siteUrl.username ||
      siteUrl.password
    ) {
      console.error("NEXT_PUBLIC_SITE_URL must be a secure site URL.");
      return NextResponse.json({ error: "The checkout return URL is not configured." }, { status: 503 });
    }

    const subscription = await paypalRequest<PayPalSubscription>(
      config.apiBaseUrl,
      accessToken,
      "/v1/billing/subscriptions",
      {
        method: "POST",
        body: JSON.stringify({
          plan_id: planId,
          custom_id: user.id,
          application_context: {
            brand_name: "urlyu.com",
            user_action: "SUBSCRIBE_NOW",
            shipping_preference: "NO_SHIPPING",
            return_url: new URL("/dashboard/vip?paypal=success", siteUrl).toString(),
            cancel_url: new URL("/dashboard/vip?paypal=cancelled", siteUrl).toString(),
          },
        }),
      }
    );

    const approvalUrl = getApprovalUrl(subscription);
    if (!subscription.id || !approvalUrl) {
      console.error("PayPal did not return a valid subscription approval URL.");
      return NextResponse.json({ error: "PayPal could not start the subscription." }, { status: 502 });
    }

    const { error: saveError } = await admin.from("vip_subscriptions").upsert(
      {
        user_id: user.id,
        paypal_subscription_id: subscription.id,
        paypal_payer_id: null,
        payment_provider: "paypal",
        status: "approval_pending",
        current_period_end: null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );

    if (saveError) {
      console.error("Could not save pending PayPal VIP subscription:", saveError.message);
      try {
        await paypalRequest<null>(
          config.apiBaseUrl,
          accessToken,
          `/v1/billing/subscriptions/${encodeURIComponent(subscription.id)}/cancel`,
          {
            method: "POST",
            body: JSON.stringify({ reason: "Could not save the VIP subscription" }),
          }
        );
      } catch (cancelError) {
        console.error("Could not cancel unsaved PayPal subscription:", cancelError);
      }
      return NextResponse.json({ error: "Could not save the pending VIP subscription." }, { status: 500 });
    }

    return NextResponse.json({ approvalUrl });
  } catch (error) {
    console.error("Could not create PayPal VIP subscription:", error);
    if (
      error instanceof PayPalRequestError &&
      error.status === 404 &&
      error.issueCodes.includes("INVALID_RESOURCE_ID")
    ) {
      return NextResponse.json(
        { error: "PayPal could not find this subscription plan. Check the selected plan ID and PayPal mode." },
        { status: 502 }
      );
    }
    return NextResponse.json({ error: "Could not start PayPal checkout." }, { status: 502 });
  }
}
