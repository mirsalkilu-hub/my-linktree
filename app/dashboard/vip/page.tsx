"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Crown, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import DashboardHeader from "@/components/DashboardHeader";
import SiteFooter from "@/components/SiteFooter";
import type { User } from "@supabase/supabase-js";

interface VipSubscription {
  status: string;
  current_period_end: string | null;
  stripe_customer_id: string | null;
  payment_provider: "stripe" | null;
}

export default function VipMembershipPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [subscription, setSubscription] = useState<VipSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [isVip, setIsVip] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const loadSubscription = async () => {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) {
        router.push("/login");
        return;
      }
      setUser(currentUser);

      const { data, error } = await supabase
        .from("vip_subscriptions")
        .select("status, current_period_end, stripe_customer_id, payment_provider")
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

  const startCheckout = async () => {
    if (!user || checkoutLoading) return;
    setCheckoutLoading(true);
    setErrorMessage("");
    setStatusMessage("");

    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session?.access_token) {
      setErrorMessage(sessionError?.message || "Your session could not be found. Please sign in again.");
      setCheckoutLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/vip/checkout", {
        method: "POST",
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const result = await response.json();
      if (!response.ok || !result.url) {
        setErrorMessage(result.error || "Could not start Stripe checkout.");
        setCheckoutLoading(false);
        return;
      }
      window.location.assign(result.url);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Could not start Stripe checkout.");
      setCheckoutLoading(false);
    }
  };

  const openBillingPortal = async () => {
    if (!user || checkoutLoading) return;
    setCheckoutLoading(true);
    setErrorMessage("");

    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session?.access_token) {
      setErrorMessage(sessionError?.message || "Your session could not be found. Please sign in again.");
      setCheckoutLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/vip/portal", {
        method: "POST",
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const result = await response.json();
      if (!response.ok || !result.url) {
        setErrorMessage(result.error || "Could not open subscription management.");
        setCheckoutLoading(false);
        return;
      }
      window.location.assign(result.url);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Could not open subscription management.");
      setCheckoutLoading(false);
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
          <h1 className="mt-3 text-3xl font-black text-white">Enjoy an ad-free bio page</h1>
          <p className="mt-3 text-sm leading-6 text-slate-300">
            VIP members can turn off ads on their bio pages.
          </p>

          <div className="my-7 rounded-2xl border border-slate-700 bg-slate-950/50 p-5">
            <p className="text-4xl font-black text-white">$20<span className="text-base font-semibold text-slate-400"> / year</span></p>
            <p className="mt-2 text-xs text-slate-400">Automatically renews annually. Cancel anytime.</p>
          </div>

          <ul className="mb-7 space-y-3 text-left text-sm text-slate-200">
            <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-400" /> Turn off ads on your bio pages</li>
            <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-400" /> Secure payments through Stripe</li>
            <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-400" /> Automatic annual renewal</li>
          </ul>

          {isVip && subscription?.current_period_end && (
            <p className="mb-5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm font-semibold text-emerald-300">
              VIP is active until {new Date(subscription.current_period_end).toLocaleDateString()}.
            </p>
          )}
          <p className="mb-4 text-xs text-slate-400">
            Secure checkout with Stripe. VIP activates automatically after payment is confirmed.
          </p>
          {statusMessage && <p className="mb-4 text-sm text-emerald-300">{statusMessage}</p>}
          {errorMessage && <p role="alert" className="mb-4 text-sm text-rose-300">{errorMessage}</p>}

          <button
            type="button"
            onClick={startCheckout}
            disabled={isVip || checkoutLoading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-5 py-3.5 text-sm font-bold text-slate-950 transition hover:from-amber-400 hover:to-orange-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {checkoutLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            {isVip ? "VIP is active" : checkoutLoading ? "Opening checkout..." : "Pay with Stripe — $20/year"}
          </button>
          {subscription?.stripe_customer_id && (
            <button
              type="button"
              onClick={openBillingPortal}
              disabled={checkoutLoading}
              className="mt-3 w-full rounded-xl border border-slate-700 px-5 py-3 text-sm font-semibold text-slate-200 transition hover:border-slate-500 hover:text-white disabled:opacity-60"
            >
              Manage or cancel subscription
            </button>
          )}
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
