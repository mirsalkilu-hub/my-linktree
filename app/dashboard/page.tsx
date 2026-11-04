"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Copy,
  ExternalLink,
  FileText,
  Globe,
  Link2,
  Loader2,
  MousePointerClick,
  Plus,
  Sparkles,
} from "lucide-react";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import DashboardHeader from "@/components/DashboardHeader";
import SiteFooter from "@/components/SiteFooter";
import { supabase } from "@/lib/supabase";

interface ShortLink {
  id: string;
  original_url: string;
  short_code: string;
  clicks: number | null;
  created_at: string;
  expires_at: string | null;
  custom_domain_id: string | null;
}

interface BioProfile {
  id: string;
  title: string;
  username: string;
}

interface BioLink {
  id: string;
  bio_id: string;
  title: string;
  clicks: number | null;
  is_active: boolean;
}

interface CustomDomain {
  id: string;
  domain: string;
  verified_at: string | null;
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [links, setLinks] = useState<ShortLink[]>([]);
  const [pages, setPages] = useState<BioProfile[]>([]);
  const [bioLinks, setBioLinks] = useState<BioLink[]>([]);
  const [domains, setDomains] = useState<CustomDomain[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [copied, setCopied] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const origin = typeof window !== "undefined" ? window.location.origin : "";

  useEffect(() => {
    const updateTime = () => setCurrentTime(Date.now());
    updateTime();
    const intervalId = window.setInterval(updateTime, 60_000);
    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadDashboard = async () => {
      const { data: userData, error: authError } = await supabase.auth.getUser();
      if (!userData.user) {
        router.push("/login");
        return;
      }
      if (authError) throw authError;

      const [linksResult, pagesResult, bioLinksResult, domainsResult] = await Promise.all([
        supabase
          .from("links")
          .select("id, original_url, short_code, clicks, created_at, expires_at, custom_domain_id")
          .eq("user_id", userData.user.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("bio_profiles")
          .select("id, title, username")
          .eq("user_id", userData.user.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("bio_links")
          .select("id, bio_id, title, clicks, is_active"),
        supabase
          .from("custom_domains")
          .select("id, domain, verified_at")
          .eq("user_id", userData.user.id),
      ]);

      if (linksResult.error) throw linksResult.error;
      if (pagesResult.error) throw pagesResult.error;
      if (bioLinksResult.error) throw bioLinksResult.error;
      if (domainsResult.error) throw domainsResult.error;
      if (!isMounted) return;

      setUser(userData.user);
      setLinks(linksResult.data || []);
      setPages(pagesResult.data || []);
      setBioLinks(bioLinksResult.data || []);
      setDomains(domainsResult.data || []);
    };

    void loadDashboard()
      .catch((error: unknown) => {
        console.error("Could not load dashboard:", error);
        if (isMounted) {
          setErrorMessage(error instanceof Error ? error.message : "Could not load dashboard data.");
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [router]);

  const totalClicks = useMemo(
    () => links.reduce((total, link) => total + (link.clicks || 0), 0),
    [links]
  );
  const totalBioClicks = useMemo(
    () => bioLinks.reduce((total, link) => total + (link.clicks || 0), 0),
    [bioLinks]
  );
  const recentLinks = links.slice(0, 5);
  const mostClickedLink = [...links].sort((a, b) => (b.clicks || 0) - (a.clicks || 0))[0];
  const mostClickedBioLink = [...bioLinks]
    .filter((link) => link.is_active)
    .sort((a, b) => (b.clicks || 0) - (a.clicks || 0))[0];
  const memberName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "there";

  const getShortUrl = (link: ShortLink) => {
    const domain = domains.find((item) => item.id === link.custom_domain_id);
    return `${domain ? `https://${domain.domain}` : origin}/${link.short_code}`;
  };

  const copyShortUrl = async (link: ShortLink) => {
    try {
      await navigator.clipboard.writeText(getShortUrl(link));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch (error) {
      console.error("Could not copy short link:", error);
      setErrorMessage("Could not copy the short link to clipboard.");
    }
  };

  const stats = [
    { label: "Short links", value: links.length, detail: "Created links", href: "/dashboard/links", icon: Link2 },
    { label: "Bio pages", value: pages.length, detail: "Published pages", href: "/dashboard/pages", icon: FileText },
    { label: "Total clicks", value: totalClicks + totalBioClicks, detail: "Across tracked links", href: "/dashboard/analytics", icon: MousePointerClick },
    { label: "Custom domains", value: domains.filter((domain) => !!domain.verified_at).length, detail: "Verified domains", href: "/dashboard/domains", icon: Globe },
  ];

  return (
    <div className="site-shell flex min-h-screen flex-col text-white">
      <DashboardHeader user={user} />
      <main className="mx-auto w-full max-w-7xl flex-1 space-y-7 px-4 py-8 sm:px-6 sm:py-10">
        <section className="relative overflow-hidden rounded-3xl border border-indigo-500/25 bg-gradient-to-r from-indigo-950/80 via-slate-900 to-violet-950/70 px-6 py-8 shadow-xl shadow-indigo-950/20 sm:px-10 sm:py-10">
          <div className="pointer-events-none absolute -right-10 -top-24 h-72 w-72 rounded-full bg-indigo-500/15 blur-3xl" />
          <div className="relative flex flex-col gap-7 md:flex-row md:items-center md:justify-between">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-indigo-400/20 bg-indigo-500/10 px-3 py-1 text-xs font-medium text-indigo-200">
                <Sparkles className="h-3.5 w-3.5" />
                Your Urlyu workspace
              </span>
              <h1 className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-4xl">
                Hello, {memberName}!
              </h1>
              <p className="mt-2 text-sm text-slate-300 sm:text-base">Welcome back to your dashboard.</p>
            </div>
            <Link
              href="/dashboard/links"
              className="inline-flex items-center justify-center gap-2 self-start rounded-xl border border-indigo-400/30 bg-indigo-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-950/30 transition hover:-translate-y-0.5 hover:bg-indigo-500 md:self-center"
            >
              <Plus className="h-4 w-4" />
              Create Link
            </Link>
          </div>
        </section>

        {errorMessage && (
          <div role="alert" className="rounded-2xl border border-rose-500/30 bg-rose-950/30 p-4 text-sm text-rose-200">
            {errorMessage}
          </div>
        )}

        {loading ? (
          <div className="analytics-panel flex items-center justify-center gap-3 rounded-2xl p-14 text-sm text-slate-400">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading your workspace...
          </div>
        ) : !errorMessage && (
          <>
            <section aria-label="Workspace statistics" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {stats.map(({ label, value, detail, href, icon: Icon }) => (
                <Link
                  key={label}
                  href={href}
                  className="group relative rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-lg shadow-indigo-950/10 transition hover:-translate-y-1 hover:border-indigo-500/40"
                >
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl border border-indigo-500/20 bg-indigo-500/10 text-indigo-300 shadow-lg shadow-indigo-950/20 transition group-hover:bg-indigo-500/15">
                    <Icon className="h-5 w-5" />
                  </div>
                  <p className="text-sm font-medium text-slate-400">{label}</p>
                  <div className="mt-1 flex items-end justify-between gap-3">
                    <strong className="text-3xl font-bold text-white">{value.toLocaleString()}</strong>
                    <span className="text-xs text-slate-500">{detail}</span>
                  </div>
                </Link>
              ))}
            </section>

            <section className="grid grid-cols-1 gap-5 lg:grid-cols-3">
              <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 sm:p-6 lg:col-span-2">
                <div className="mb-5">
                  <h2 className="text-lg font-bold text-white">Workspace overview</h2>
                  <p className="mt-1 text-sm text-slate-400">Your links and pages at a glance.</p>
                </div>
                <div className="space-y-5">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Link href="/dashboard/links" className="rounded-xl border border-slate-800 bg-slate-950/50 p-4 transition hover:border-indigo-500/40">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-slate-200">Short links</span>
                        <Link2 className="h-4 w-4 text-indigo-300" />
                      </div>
                      <strong className="mt-3 block text-2xl text-white">{links.length.toLocaleString()}</strong>
                      <span className="mt-1 block text-xs text-slate-500">{totalClicks.toLocaleString()} clicks recorded</span>
                    </Link>
                    <Link href="/dashboard/pages" className="rounded-xl border border-slate-800 bg-slate-950/50 p-4 transition hover:border-violet-500/40">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-slate-200">Bio pages</span>
                        <FileText className="h-4 w-4 text-violet-300" />
                      </div>
                      <strong className="mt-3 block text-2xl text-white">{pages.length.toLocaleString()}</strong>
                      <span className="mt-1 block text-xs text-slate-500">{totalBioClicks.toLocaleString()} clicks on page links</span>
                    </Link>
                  </div>
                  <div className="flex flex-wrap gap-3 pt-1">
                    <Link href="/dashboard/links" className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-300 hover:text-indigo-200">
                      Manage links <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                    <Link href="/dashboard/pages" className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-300 hover:text-indigo-200">
                      Manage pages <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              </div>

              <div>
                <h2 className="mb-3 text-lg font-bold text-white">Quick actions</h2>
                <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
                  <Link href="/dashboard/links" className="group flex items-center gap-4 rounded-2xl border border-indigo-400/20 bg-gradient-to-r from-indigo-600 to-indigo-500 p-4 text-white shadow-lg shadow-indigo-950/30 transition hover:-translate-y-0.5 hover:from-indigo-500 hover:to-indigo-400">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/15"><Link2 className="h-5 w-5" /></span>
                    <span><strong className="block text-sm">Create Link</strong><small className="text-xs text-white/75">Shorten a new URL</small></span>
                    <ArrowRight className="ml-auto h-4 w-4 opacity-70 transition group-hover:translate-x-1" />
                  </Link>
                  <Link href="/dashboard/pages" className="group flex items-center gap-4 rounded-2xl border border-violet-400/20 bg-gradient-to-r from-violet-700 to-indigo-600 p-4 text-white shadow-lg shadow-violet-950/30 transition hover:-translate-y-0.5 hover:from-violet-600 hover:to-indigo-500">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/15"><FileText className="h-5 w-5" /></span>
                    <span><strong className="block text-sm">Create Bio Page</strong><small className="text-xs text-white/75">Share your profile</small></span>
                    <ArrowRight className="ml-auto h-4 w-4 opacity-70 transition group-hover:translate-x-1" />
                  </Link>
                  <Link href="/dashboard/analytics" className="group flex items-center gap-4 rounded-2xl border border-indigo-400/20 bg-gradient-to-r from-indigo-700 to-violet-600 p-4 text-white shadow-lg shadow-indigo-950/30 transition hover:-translate-y-0.5 hover:from-indigo-600 hover:to-violet-500">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/15"><BarChart3 className="h-5 w-5" /></span>
                    <span><strong className="block text-sm">Analytics</strong><small className="text-xs text-white/75">View click insights</small></span>
                    <ArrowRight className="ml-auto h-4 w-4 opacity-70 transition group-hover:translate-x-1" />
                  </Link>
                </div>
              </div>
            </section>

            <section className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
                <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
                  <div>
                    <h2 className="font-bold text-white">Recent Links</h2>
                    <p className="mt-1 text-xs text-slate-500">Your latest short links</p>
                  </div>
                  <Link href="/dashboard/links" className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-300 hover:text-indigo-200">
                    View all <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
                {recentLinks.length ? (
                  <ul className="divide-y divide-slate-800/80">
                    {recentLinks.map((link) => {
                      const shortUrl = getShortUrl(link);
                      const expired = !!link.expires_at && new Date(link.expires_at).getTime() <= currentTime;
                      return (
                        <li key={link.id} className="flex items-center gap-3 px-5 py-4">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-300"><Link2 className="h-4 w-4" /></span>
                          <div className="min-w-0 flex-1">
                            <a href={shortUrl} target="_blank" rel="noreferrer" className="inline-flex max-w-full items-center gap-1 text-sm font-semibold text-slate-100 hover:text-indigo-300">
                              <span className="truncate">{link.short_code}</span><ExternalLink className="h-3 w-3 shrink-0" />
                            </a>
                            <p className="truncate text-xs text-slate-500">{link.original_url}</p>
                          </div>
                          <div className="hidden text-right sm:block">
                            <p className="text-xs font-semibold text-slate-200">{(link.clicks || 0).toLocaleString()} clicks</p>
                            <p className={`mt-1 text-[10px] ${expired ? "text-slate-500" : "text-emerald-300"}`}>{expired ? "Expired" : "Active"}</p>
                          </div>
                          <button type="button" onClick={() => void copyShortUrl(link)} aria-label="Copy short link" className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-800 hover:text-white">
                            <Copy className="h-4 w-4" />
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <div className="px-5 py-10 text-center">
                    <Link2 className="mx-auto h-7 w-7 text-slate-600" />
                    <p className="mt-2 text-sm text-slate-400">No short links yet.</p>
                    <Link href="/dashboard/links" className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-indigo-300 hover:text-indigo-200">Create your first link <ArrowRight className="h-3.5 w-3.5" /></Link>
                  </div>
                )}
                {copied && <p role="status" className="border-t border-slate-800 px-5 py-2 text-xs text-emerald-300">Short link copied.</p>}
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 sm:p-6">
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <h2 className="font-bold text-white">Performance Insights</h2>
                    <p className="mt-1 text-xs text-slate-500">Your top-performing links</p>
                  </div>
                  <Link href="/dashboard/analytics" className="text-xs font-semibold text-indigo-300 hover:text-indigo-200">View details</Link>
                </div>
                <div className="space-y-4">
                  <div className="border-l-2 border-blue-500 pl-3">
                    <p className="text-xs font-semibold text-slate-300">Most clicked short link</p>
                    {mostClickedLink ? (
                      <div className="mt-1 flex items-center justify-between gap-2">
                        <Link href="/dashboard/links" className="truncate text-xs text-slate-500 hover:text-indigo-300">{mostClickedLink.short_code}</Link>
                        <span className="shrink-0 text-xs font-semibold text-slate-300">{(mostClickedLink.clicks || 0).toLocaleString()} clicks</span>
                      </div>
                    ) : <p className="mt-1 text-xs text-slate-500">Create a short link to see its performance.</p>}
                  </div>
                  <div className="border-l-2 border-emerald-500 pl-3">
                    <p className="text-xs font-semibold text-slate-300">Most clicked bio page link</p>
                    {mostClickedBioLink ? (
                      <div className="mt-1 flex items-center justify-between gap-2">
                        <span className="truncate text-xs text-slate-500">{mostClickedBioLink.title}</span>
                        <span className="shrink-0 text-xs font-semibold text-slate-300">{(mostClickedBioLink.clicks || 0).toLocaleString()} clicks</span>
                      </div>
                    ) : <p className="mt-1 text-xs text-slate-500">No bio page link clicks recorded yet.</p>}
                  </div>
                  <div className="border-l-2 border-violet-500 pl-3">
                    <p className="text-xs font-semibold text-slate-300">Total clicks</p>
                    <p className="mt-1 text-xs text-slate-500">{(totalClicks + totalBioClicks).toLocaleString()} clicks across your tracked links.</p>
                  </div>
                </div>
              </div>
            </section>
          </>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
