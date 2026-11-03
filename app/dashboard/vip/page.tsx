"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Crown, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import DashboardHeader from "@/components/DashboardHeader";
import SiteFooter from "@/components/SiteFooter";
import type { User } from "@supabase/supabase-js";

interface VipSubscription {
  status: string;
  current_period_end: string | null;
  paypal_subscription_id: string | null;
  payment_provider: string | null;
}

type VipPlan = "monthly" | "annual";

export default function VipMembershipPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [subscription, setSubscription] = useState<VipSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [isVip, setIsVip] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<VipPlan>("monthly");

  useEffect(() => {
    let cancelled = false;
    const loadSubscription = async () => {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) {
        router.push("/login");
        return;
      }
      const checkoutResult = new URLSearchParams(window.location.search).get("paypal");
      if (checkoutResult === "success") {
        setStatusMessage("PayPal approval received. Your VIP membership will activate after PayPal confirms the subscription.");
      } else if (checkoutResult === "cancelled") {
        setStatusMessage("PayPal checkout was cancelled. You have not been charged.");
      }
      setUser(currentUser);

      const { data, error } = await supabase
        .from("vip_subscriptions")
        .select("status, current_period_end, paypal_subscription_id, payment_provider")
        .eq("user_id", currentUser.id)
        .maybeSingle<VipSubscription>();

      if (!cancelled) {
        if (error) {
          setErrorMessage("Could not load VIP status: " + error.message);
        } else {
          setSubscription(data);
          setIsVip(
            !!data &&
              ["active", "trialing"].includes(data.status) &&
              !!data.current_period_end &&
              new Date(data.current_period_end).getTime() > Date.now()
          );
        }
        setLoading(false);
      }
    };

    void loadSubscription();
    return () => {
      cancelled = true;
    };
  }, [router]);

  const cancelPayPalSubscription = async () => {
    if (!user || !subscription?.paypal_subscription_id || actionLoading) return;
    if (!window.confirm("Cancel your PayPal VIP subscription?")) {
      return;
    }
    setActionLoading(true);
    setErrorMessage("");

    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session?.access_token) {
      setErrorMessage(sessionError?.message || "Your session could not be found. Please sign in again.");
      setActionLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/vip/paypal/cancel", {
        method: "POST",
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const result = await response.json();
      if (!response.ok) {
        setErrorMessage(result.error || "Could not cancel your PayPal subscription.");
        setActionLoading(false);
        return;
      }
      setIsVip(false);
      setSubscription((current) =>
        current ? { ...current, status: "cancelled", current_period_end: new Date().toISOString() } : current
      );
      setStatusMessage("Your PayPal subscription has been cancelled and ads are enabled again.");
      setActionLoading(false);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Could not cancel your PayPal subscription.");
      setActionLoading(false);
    }
  };

  const startPayPalSubscription = async () => {
    if (!user || actionLoading || isVip) return;

    setActionLoading(true);
    setErrorMessage("");
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session?.access_token) {
        throw new Error(sessionError?.message || "Your session could not be found. Please sign in again.");
      }

      const response = await fetch("/api/vip/paypal/create", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ plan: selectedPlan }),
      });
      const result = await response.json() as { approvalUrl?: string; error?: string };
      if (!response.ok || !result.approvalUrl) {
        throw new Error(result.error || "Could not start PayPal checkout.");
      }

      window.location.assign(result.approvalUrl);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Could not start PayPal checkout.");
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="site-shell min-h-screen text-white flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
      </div>
    );
  }

  return (
    <div className="site-shell min-h-screen text-white font-sans flex flex-col">
      <DashboardHeader user={user} />
      <main className="mx-auto flex w-full max-w-4xl flex-1 items-center px-4 py-12">
        <section className="manager-panel mx-auto w-full max-w-xl rounded-3xl p-7 text-center sm:p-10">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-400/30 bg-amber-400/10 text-amber-300">
            <Crown className="h-7 w-7" />
          </div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-300">VIP Membership</p>
          <h1 className="mt-3 text-3xl font-black text-white">VIP membership</h1>
          <p className="mt-3 text-sm leading-6 text-slate-300">
            Enjoy an ad-free experience on your bio pages with a secure PayPal subscription.
          </p>

          <div
            role="radiogroup"
            aria-label="VIP billing frequency"
            className="my-7 grid gap-3 sm:grid-cols-2"
          >
            {([
              { id: "monthly", price: "$5", term: "per month", detail: "Billed monthly" },
              { id: "annual", price: "$50", term: "per year", detail: "Save $10 per year" },
            ] as const).map((plan) => (
              <button
                key={plan.id}
                type="button"
                role="radio"
                aria-checked={selectedPlan === plan.id}
                onClick={() => setSelectedPlan(plan.id)}
                disabled={actionLoading || isVip}
                className={`rounded-2xl border p-5 text-left transition ${
                  selectedPlan === plan.id
                    ? "border-indigo-400 bg-indigo-500/10 ring-1 ring-indigo-400/40"
                    : "border-slate-700 bg-slate-950/50 hover:border-slate-500"
                } disabled:cursor-not-allowed disabled:opacity-60`}
              >
                <span className="block text-2xl font-black text-white">{plan.price}</span>
                <span className="mt-1 block text-sm font-semibold text-slate-200">{plan.term}</span>
                <span className="mt-2 block text-xs text-slate-400">{plan.detail}</span>
              </button>
            ))}
          </div>

          <p className="mb-4 text-xs leading-5 text-slate-400">
            Subscriptions renew automatically until cancelled. Payment and billing are handled securely by PayPal.
          </p>
          {isVip && subscription?.current_period_end && (
            <p className="mb-5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm font-semibold text-emerald-300">
              VIP is active until {new Date(subscription.current_period_end).toLocaleDateString()}.
            </p>
          )}
          {subscription?.status === "approval_pending" && (
            <p className="mb-5 rounded-xl border border-amber-400/30 bg-amber-400/10 p-3 text-sm text-amber-200">
              Your PayPal subscription is awaiting approval. Continue to PayPal to complete checkout.
            </p>
          )}
          {statusMessage && <p className="mb-4 text-sm text-emerald-300">{statusMessage}</p>}
          {errorMessage && <p role="alert" className="mb-4 text-sm text-rose-300">{errorMessage}</p>}

          {!isVip && (
            <button
              type="button"
              onClick={startPayPalSubscription}
              disabled={actionLoading}
              className="w-full rounded-xl bg-[#0070ba] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#005ea6] disabled:cursor-wait disabled:opacity-60"
            >
              {actionLoading
                ? "Connecting to PayPal..."
                : subscription?.status === "approval_pending"
                  ? "Continue with PayPal"
                  : `Subscribe for ${selectedPlan === "monthly" ? "$5/month" : "$50/year"} with PayPal`}
            </button>
          )}

          {subscription?.payment_provider === "paypal" && subscription.paypal_subscription_id && isVip && (
            <button
              type="button"
              onClick={cancelPayPalSubscription}
              disabled={actionLoading}
              className="mt-3 w-full rounded-xl border border-rose-500/30 px-5 py-3 text-sm font-semibold text-rose-300 transition hover:bg-rose-500/10 disabled:opacity-60"
            >
              Cancel PayPal subscription
            </button>
          )}
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
