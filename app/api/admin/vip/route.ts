import { NextResponse } from "next/server";
import { getVipAdminContext } from "@/lib/vip-admin-server";

function getNextPeriodEnd(currentPeriodEnd: string | null, plan: "monthly" | "annual") {
  const now = new Date();
  const currentEnd = currentPeriodEnd ? new Date(currentPeriodEnd) : null;
  const base = currentEnd && currentEnd.getTime() > now.getTime() ? currentEnd : now;
  const dayOfMonth = base.getUTCDate();
  const monthsToAdd = plan === "monthly" ? 1 : 12;

  const nextEnd = new Date(base);
  nextEnd.setUTCDate(1);
  nextEnd.setUTCMonth(nextEnd.getUTCMonth() + monthsToAdd);
  const lastDayOfMonth = new Date(
    Date.UTC(nextEnd.getUTCFullYear(), nextEnd.getUTCMonth() + 1, 0)
  ).getUTCDate();
  nextEnd.setUTCDate(Math.min(dayOfMonth, lastDayOfMonth));

  return nextEnd;
}

export async function GET(request: Request) {
  const context = await getVipAdminContext(request);
  if (!context.ok) return context.response;

  const query = new URL(request.url).searchParams.get("q")?.trim() || "";
  if (!query) return NextResponse.json({ accounts: [] });
  if (query.length < 2 || query.length > 100) {
    return NextResponse.json({ error: "Search must be between 2 and 100 characters." }, { status: 400 });
  }

  const { data, error } = await context.admin.rpc("admin_search_vip_accounts", {
    search_query: query,
  });
  if (error) {
    console.error("Could not search VIP accounts:", error.message);
    return NextResponse.json({ error: "Could not search VIP accounts." }, { status: 500 });
  }

  return NextResponse.json(
    { accounts: data },
    { headers: { "Cache-Control": "private, no-store" } }
  );
}

export async function POST(request: Request) {
  const context = await getVipAdminContext(request);
  if (!context.ok) return context.response;

  let body: Record<string, unknown>;
  try {
    const parsed: unknown = await request.json();
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
      return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
    }
    body = parsed as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const userId = body.userId;
  const action = body.action;
  const plan = body.plan;
  if (typeof userId !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId)) {
    return NextResponse.json({ error: "Choose a valid account." }, { status: 400 });
  }
  if (action !== "grant" && action !== "revoke") {
    return NextResponse.json({ error: "Choose a valid VIP action." }, { status: 400 });
  }
  const { data: target, error: targetError } = await context.admin.auth.admin.getUserById(userId);
  if (targetError) {
    if (targetError.status === 404) {
      return NextResponse.json({ error: "Account not found." }, { status: 404 });
    }
    console.error("Could not load VIP account:", targetError.message);
    return NextResponse.json({ error: "Could not load the selected account." }, { status: 500 });
  }
  if (!target.user) {
    return NextResponse.json({ error: "Account not found." }, { status: 404 });
  }

  const { data: current, error: lookupError } = await context.admin
    .from("vip_subscriptions")
    .select("status, current_period_end, payment_provider, paypal_subscription_id, stripe_subscription_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (lookupError) {
    console.error("Could not load current VIP membership:", lookupError.message);
    return NextResponse.json({ error: "Could not load the account's VIP status." }, { status: 500 });
  }

  if (action === "grant") {
    if (plan !== "monthly" && plan !== "annual") {
      return NextResponse.json({ error: "Choose a valid VIP period." }, { status: 400 });
    }

    const activeExternalSubscription =
      (current?.payment_provider === "paypal" &&
        !!current.paypal_subscription_id &&
        !["cancelled", "canceled", "expired"].includes(current.status)) ||
      (!!current?.stripe_subscription_id && !["cancelled", "canceled", "expired"].includes(current.status));
    if (activeExternalSubscription) {
      return NextResponse.json(
        { error: "Cancel the existing PayPal subscription before switching this account to manual VIP." },
        { status: 409 }
      );
    }

    const periodEnd = getNextPeriodEnd(current?.current_period_end ?? null, plan).toISOString();
    const { error: saveError } = await context.admin.from("vip_subscriptions").upsert(
      {
        user_id: userId,
        status: "active",
        payment_provider: "manual",
        current_period_end: periodEnd,
        updated_at: new Date().toISOString(),
        paypal_subscription_id: null,
        paypal_payer_id: null,
        stripe_subscription_id: null,
      },
      { onConflict: "user_id" }
    );

    if (saveError) {
      console.error("Could not grant manual VIP membership:", saveError.message);
      return NextResponse.json({ error: "Could not activate VIP for this account." }, { status: 500 });
    }

    return NextResponse.json({ currentPeriodEnd: periodEnd });
  }

  if (current?.payment_provider !== "manual") {
    return NextResponse.json(
      { error: "Only manually managed VIP memberships can be revoked here." },
      { status: 409 }
    );
  }

  const revokedAt = new Date().toISOString();
  const { error: revokeError } = await context.admin
    .from("vip_subscriptions")
    .update({ status: "cancelled", current_period_end: revokedAt, updated_at: revokedAt })
    .eq("user_id", userId)
    .eq("payment_provider", "manual");

  if (revokeError) {
    console.error("Could not revoke manual VIP membership:", revokeError.message);
    return NextResponse.json({ error: "Could not revoke VIP for this account." }, { status: 500 });
  }

  const { error: adsError } = await context.admin
    .from("bio_profiles")
    .update({ ads_enabled: true })
    .eq("user_id", userId);
  if (adsError) {
    console.error("Could not re-enable ads after VIP was revoked:", adsError.message);
    return NextResponse.json(
      { error: "VIP was revoked, but page ads could not be re-enabled." },
      { status: 500 }
    );
  }

  return NextResponse.json({ revoked: true });
}
