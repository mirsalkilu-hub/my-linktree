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
  paypal_subscription_id: string | null;
  payment_provider: string | null;
}

export default function VipMembershipPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [subscription, setSubscription] = useState<VipSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
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
    if (!window.confirm("Cancel your PayPal VIP subscription? Ads will be re-enabled on your bio pages.")) {
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
            <p className="text-4xl font-black text-white">Rp100.000<span className="text-base font-semibold text-slate-400"> / year</span></p>
            <p className="mt-2 text-xs text-slate-400">Manual payment. No automatic renewal.</p>
          </div>

          <ul className="mb-7 space-y-3 text-left text-sm text-slate-200">
            <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-400" /> Turn off ads on your bio pages</li>
            <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-400" /> Pay by bank transfer or QRIS</li>
            <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-400" /> VIP activates after payment verification</li>
          </ul>

          {isVip && subscription?.current_period_end && (
            <p className="mb-5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm font-semibold text-emerald-300">
              VIP is active until {new Date(subscription.current_period_end).toLocaleDateString()}.
            </p>
          )}
          {!isVip && (
            <p className="mb-4 text-xs text-slate-400">
              Message us on WhatsApp for bank transfer or QRIS instructions. Send your payment receipt in the chat;
              VIP will be activated after we verify your payment.
            </p>
          )}
          {statusMessage && <p className="mb-4 text-sm text-emerald-300">{statusMessage}</p>}
          {errorMessage && <p role="alert" className="mb-4 text-sm text-rose-300">{errorMessage}</p>}

          {!isVip && user && (
            <a
              href={`https://wa.me/6285397685933?text=${encodeURIComponent(
                `Halo, saya ingin berlangganan VIP 1 tahun seharga Rp100.000. Email akun saya: ${user.email || "(belum tersedia)"}. Mohon kirim instruksi pembayaran bank transfer atau QRIS.`
              )}`}
              target="_blank"
              rel="noreferrer"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-5 py-3.5 text-sm font-bold text-slate-950 transition hover:from-amber-400 hover:to-orange-400"
            >
              Chat WhatsApp for payment instructions
            </a>
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
