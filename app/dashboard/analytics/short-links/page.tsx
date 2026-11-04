"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ArrowLeft, BarChart3, ExternalLink, Loader2, MousePointerClick } from "lucide-react";
import { supabase } from "@/lib/supabase";
import DashboardHeader from "@/components/DashboardHeader";
import SiteFooter from "@/components/SiteFooter";
import type { User } from "@supabase/supabase-js";

interface ClickGroup {
  name: string;
  clicks: number;
}

interface DailyClick {
  date: string;
  clicks: number;
}

interface ShortLinkAnalytics {
  totalClicks: number;
  daily: DailyClick[];
  campaigns: ClickGroup[];
  referrers: ClickGroup[];
}

export default function ShortLinkAnalyticsPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [analytics, setAnalytics] = useState<ShortLinkAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadAnalytics = async () => {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) {
        if (isMounted) {
          setErrorMessage(userError.message);
          setLoading(false);
        }
        return;
      }
      if (!userData.user) {
        router.push("/login");
        return;
      }

      if (isMounted) setUser(userData.user);

      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !sessionData.session?.access_token) {
        if (isMounted) {
          setErrorMessage(sessionError?.message || "Please sign in again to view analytics.");
          setLoading(false);
        }
        return;
      }

      try {
        const response = await fetch("/api/analytics/short-links?days=30", {
          headers: { Authorization: `Bearer ${sessionData.session.access_token}` },
          cache: "no-store",
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "Could not load short-link analytics.");
        if (isMounted) setAnalytics(result);
      } catch (error) {
        if (isMounted) {
          setErrorMessage(error instanceof Error ? error.message : "Could not load short-link analytics.");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    void loadAnalytics();
    return () => {
      isMounted = false;
    };
  }, [router]);

  return (
    <div className="site-shell flex min-h-screen flex-col text-white">
      <DashboardHeader user={user} />
      <main className="mx-auto w-full max-w-7xl flex-1 space-y-6 px-4 py-8 sm:px-6 sm:py-10">
        <section className="analytics-hero flex flex-col gap-5 rounded-2xl p-5 sm:flex-row sm:items-center sm:justify-between sm:p-7">
          <div>
            <Link href="/dashboard/analytics" className="mb-3 inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-300 hover:text-indigo-200">
              <ArrowLeft className="h-3.5 w-3.5" />
              Bio page analytics
            </Link>
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/15 text-indigo-300 ring-1 ring-indigo-400/20">
                <BarChart3 className="h-5 w-5" />
              </span>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-indigo-300">Short links</p>
                <h1 className="text-2xl font-black text-white sm:text-3xl">Click analytics</h1>
              </div>
            </div>
            <p className="mt-2 text-sm text-slate-400">Campaigns and referring sites for the last 30 days.</p>
          </div>
          <Link href="/dashboard/links" className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-900/60 px-4 py-3 text-xs font-semibold text-slate-200 transition hover:border-indigo-500/50 hover:text-white">
            Manage links
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        </section>

        {loading ? (
          <div className="analytics-panel flex items-center justify-center gap-3 rounded-2xl p-12 text-sm text-slate-400">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading short-link analytics...
          </div>
        ) : errorMessage ? (
          <div role="alert" className="rounded-2xl border border-rose-500/30 bg-rose-950/20 p-5 text-sm text-rose-200">
            {errorMessage}
          </div>
        ) : analytics ? (
          <>
            <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="analytics-stat rounded-2xl p-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Short-link clicks</span>
                  <MousePointerClick className="h-5 w-5 text-indigo-300" />
                </div>
                <strong className="mt-4 block text-3xl font-black text-white">{analytics.totalClicks}</strong>
                <span className="text-xs text-slate-500">Last 30 days</span>
              </div>
              <div className="analytics-stat rounded-2xl p-5">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Campaigns</span>
                <strong className="mt-4 block text-3xl font-black text-white">
                  {analytics.campaigns.filter((campaign) => campaign.name !== "Unattributed").length}
                </strong>
                <span className="text-xs text-slate-500">With recorded clicks</span>
              </div>
              <div className="analytics-stat rounded-2xl p-5">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Referring sources</span>
                <strong className="mt-4 block text-3xl font-black text-white">{analytics.referrers.length}</strong>
                <span className="text-xs text-slate-500">Including direct visits</span>
              </div>
            </section>

            {analytics.totalClicks === 0 ? (
              <div className="analytics-panel rounded-2xl p-10 text-center">
                <p className="font-semibold text-white">No short-link clicks recorded yet.</p>
                <p className="mt-2 text-sm text-slate-400">Clicks will appear here after visitors open your short links.</p>
              </div>
            ) : (
              <section className="grid grid-cols-1 gap-5 lg:grid-cols-3">
                <div className="analytics-panel rounded-2xl p-5 sm:p-7 lg:col-span-2">
                  <h2 className="text-base font-bold text-white">Daily clicks</h2>
                  <p className="mb-5 mt-1 text-xs text-slate-400">Short-link visits over the last 30 days</p>
                  <div className="h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={analytics.daily}>
                        <defs>
                          <linearGradient id="shortLinkClickGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#818cf8" stopOpacity={0.75} />
                            <stop offset="95%" stopColor="#818cf8" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                        <XAxis dataKey="date" stroke="#64748b" fontSize={11} tickLine={false} />
                        <YAxis stroke="#64748b" fontSize={11} tickLine={false} allowDecimals={false} />
                        <Tooltip
                          contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "12px", color: "#fff" }}
                        />
                        <Area type="monotone" dataKey="clicks" stroke="#818cf8" strokeWidth={2} fill="url(#shortLinkClickGradient)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="space-y-5">
                  <AnalyticsGroup title="Campaigns" groups={analytics.campaigns} />
                  <AnalyticsGroup title="Referrers" groups={analytics.referrers} />
                </div>
              </section>
            )}
          </>
        ) : null}
      </main>
      <SiteFooter />
    </div>
  );
}

function AnalyticsGroup({ title, groups }: { title: string; groups: ClickGroup[] }) {
  return (
    <section className="analytics-panel rounded-2xl p-5">
      <h2 className="text-sm font-bold text-white">{title}</h2>
      <ul className="mt-4 space-y-3">
        {groups.length === 0 ? (
          <li className="text-xs text-slate-500">No data yet.</li>
        ) : (
          groups.slice(0, 6).map((group) => (
            <li key={group.name} className="flex items-center justify-between gap-3 text-xs">
              <span className="truncate text-slate-300">{group.name}</span>
              <span className="shrink-0 font-semibold text-indigo-300">{group.clicks}</span>
            </li>
          ))
        )}
      </ul>
    </section>
  );
}
