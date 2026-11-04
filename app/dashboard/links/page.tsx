"use client";

import NextImage from "next/image";
import { QRCodeSVG } from "qrcode.react";
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import DashboardHeader from "@/components/DashboardHeader";
import SiteFooter from "@/components/SiteFooter";
import {
  LogOut,
  Menu,
  X,
  Link2,
  MousePointerClick,
  Copy,
  Trash2,
  Download,
  ExternalLink,
  Plus,
  Loader2,
  LayoutDashboard,
  FileText,
  BarChart3,
  BarChart2,
  CalendarDays,
  ChevronDown,
  CopyCheck,
  Filter,
  Search,
  ShieldCheck,
} from "lucide-react";
import type { User } from "@supabase/supabase-js";

interface LinkItem {
  id: string;
  original_url: string;
  short_code: string;
  clicks: number;
  created_at: string;
  expires_at: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  custom_domain_id: string | null;
  password_protected: boolean;
}

interface CustomDomain {
  id: string;
  domain: string;
  verified_at: string | null;
}

// Custom Modal Component Bergaya Bio Page
function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirm deletion",
  message = "Are you sure you want to delete this item? This action cannot be undone.",
  confirmText = "Delete",
  cancelText = "Cancel",
  loading = false,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  loading?: boolean;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900/90 border border-white/10 rounded-3xl p-6 w-full max-w-sm text-center relative shadow-2xl backdrop-blur-2xl transition-all scale-100">

        {/* Top Accent Line */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-[2px] bg-gradient-to-r from-transparent via-rose-500 to-transparent rounded-full" />

        {/* Warning Icon Container */}
        <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto mb-4 shadow-inner">
          <Trash2 className="w-6 h-6" />
        </div>

        {/* Title & Description */}
        <h3 className="text-base font-extrabold text-white mb-1 tracking-wider uppercase">
          {title}
        </h3>
        <p className="text-xs text-slate-400 mb-6 leading-relaxed">
          {message}
        </p>

        {/* Action Buttons */}
        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="w-1/2 py-2.5 px-4 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-white/10 text-xs font-bold text-slate-300 hover:text-white transition-all active:scale-95 disabled:opacity-50"
          >
            {cancelText}
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="w-1/2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-xs font-black text-white shadow-lg shadow-rose-600/30 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center space-x-1.5"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <span>{confirmText}</span>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [clickStats, setClickStats] = useState<{ today: number; last30Days: number } | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [destinationUrl, setDestinationUrl] = useState("");
  const [customCode, setCustomCode] = useState("");
  const [linkPassword, setLinkPassword] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [utmSource, setUtmSource] = useState("");
  const [utmMedium, setUtmMedium] = useState("");
  const [utmCampaign, setUtmCampaign] = useState("");
  const [utmContent, setUtmContent] = useState("");
  const [utmTerm, setUtmTerm] = useState("");
  const [customDomainId, setCustomDomainId] = useState("");
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [customDomains, setCustomDomains] = useState<CustomDomain[]>([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [linkSearch, setLinkSearch] = useState("");
  const [linkStatusFilter, setLinkStatusFilter] = useState<"all" | "active" | "expired">("all");
  const [isCreateFormOpen, setIsCreateFormOpen] = useState(false);
  const createFormRef = useRef<HTMLDivElement>(null);

  const router = useRouter();
  const pathname = usePathname();

  // Custom delete modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedLinkId, setSelectedLinkId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const updateTime = () => setCurrentTime(Date.now());
    updateTime();
    const intervalId = window.setInterval(updateTime, 60_000);
    return () => window.clearInterval(intervalId);
  }, []);

  const loadClickStats = useCallback(async (linkIds: string[]) => {
    if (linkIds.length === 0) {
      setClickStats({ today: 0, last30Days: 0 });
      return;
    }

    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session?.access_token) {
      console.error("Could not load short-link click statistics:", sessionError?.message || "No active session.");
      setClickStats(null);
      return;
    }

    try {
      const response = await fetch("/api/analytics/short-links?days=30", {
        headers: { Authorization: `Bearer ${session.access_token}` },
        cache: "no-store",
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not load click statistics.");
      const today = new Date().toISOString().slice(0, 10);
      setClickStats({
        today: (result.daily || []).find((entry: { date: string; clicks: number }) => entry.date === today)?.clicks || 0,
        last30Days: result.totalClicks || 0,
      });
    } catch (error) {
      console.error("Could not load short-link click statistics:", error);
      setClickStats(null);
    }
  }, []);

  const refreshLinks = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    const { data, error } = await supabase
      .from("links")
      .select("id, original_url, short_code, clicks, created_at, expires_at, utm_source, utm_medium, utm_campaign, custom_domain_id, password_protected")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Could not fetch links:", error.message);
      return;
    }

    setUser(user);
    if (data) {
      setLinks(data);
      await loadClickStats(data.map((link) => link.id));
    }
  }, [loadClickStats, router]);

  useEffect(() => {
    let isMounted = true;

    const loadLinks = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      if (!isMounted) return;
      setUser(user);

      const { data, error } = await supabase
        .from("links")
        .select("id, original_url, short_code, clicks, created_at, expires_at, utm_source, utm_medium, utm_campaign, custom_domain_id, password_protected")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (!isMounted) return;
      if (error) {
        console.error("Could not fetch links:", error.message);
        return;
      }

      if (data) {
        setLinks(data);
        await loadClickStats(data.map((link) => link.id));
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        const domainResponse = await fetch("/api/custom-domains", {
          headers: { Authorization: `Bearer ${session.access_token}` },
          cache: "no-store",
        });
        const domainResult = await domainResponse.json();
        if (!domainResponse.ok) {
          console.error("Could not load custom domains:", domainResult.error);
        } else if (isMounted) {
          setCustomDomains((domainResult.domains || []).filter(
            (domain: CustomDomain) => !!domain.verified_at
          ));
        }
      }
    };

    void loadLinks();

    return () => {
      isMounted = false;
    };
  }, [loadClickStats, router]);

  const validateUrl = (url: string) => {
    try {
      const formatted = url.startsWith("http://") || url.startsWith("https://")
        ? url
        : `https://${url}`;
      new URL(formatted);
      return formatted;
    } catch {
      return null;
    }
  };

  const handleCreateLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const formattedUrl = validateUrl(destinationUrl);
    if (!formattedUrl) {
      setErrorMessage("Invalid URL format. Please check and try again.");
      return;
    }

    const slug = customCode.trim().toLowerCase() || Math.random().toString(36).substring(2, 7);
    if (!/^[a-z0-9_-]{3,48}$/.test(slug)) {
      setErrorMessage("Short codes must be 3–48 letters, numbers, dashes, or underscores.");
      return;
    }

    let expiryIso: string | null = null;
    if (expiresAt) {
      const expiryDate = new Date(expiresAt);
      if (Number.isNaN(expiryDate.getTime()) || expiryDate.getTime() <= Date.now()) {
        setErrorMessage("Choose an expiration date in the future.");
        return;
      }
      expiryIso = expiryDate.toISOString();
    }

    setLoading(true);
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw new Error(sessionError.message);
      if (!session?.access_token) throw new Error("Please sign in again before creating a link.");

      const response = await fetch("/api/links", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          original_url: formattedUrl,
          short_code: slug,
          password: linkPassword,
          expires_at: expiryIso,
          utm_source: utmSource,
          utm_medium: utmMedium,
          utm_campaign: utmCampaign,
          utm_content: utmContent,
          utm_term: utmTerm,
          custom_domain_id: customDomainId || null,
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not create the short link.");

      setDestinationUrl("");
      setCustomCode("");
      setLinkPassword("");
      setExpiresAt("");
      setUtmSource("");
      setUtmMedium("");
      setUtmCampaign("");
      setUtmContent("");
      setUtmTerm("");
      setCustomDomainId("");
      setIsCreateFormOpen(false);
      void refreshLinks();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Could not create the short link.");
    } finally {
      setLoading(false);
    }
  };

  // Open the custom confirmation modal
  const promptDeleteLink = (id: string) => {
    setSelectedLinkId(id);
    setDeleteModalOpen(true);
  };

  // Execute deletion from the modal
  const handleConfirmDelete = async () => {
    if (!selectedLinkId) return;

    setIsDeleting(true);
    const { error } = await supabase.from("links").delete().eq("id", selectedLinkId);

    setIsDeleting(false);
    setDeleteModalOpen(false);
    setSelectedLinkId(null);

    if (!error) {
      void refreshLinks();
    } else {
      setErrorMessage("Could not delete link: " + error.message);
    }
  };

  const copyToClipboard = async (id: string, url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      console.error("Could not copy short link:", error);
      setErrorMessage("Could not copy link to clipboard.");
    }
  };

  const downloadQRCode = (id: string, shortCode: string) => {
    const svgElement = document.getElementById(
      `qr-${id}`
    ) as SVGSVGElement | null;
    if (!svgElement) return;

    const svgData = new XMLSerializer().serializeToString(svgElement);
    const svgBlob = new Blob([svgData], {
      type: "image/svg+xml;charset=utf-8",
    });
    const URLObject = window.URL || window.webkitURL;
    const blobURL = URLObject.createObjectURL(svgBlob);

    const image = new window.Image();
    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 256;
      canvas.height = 256;
      const context = canvas.getContext("2d");
      if (context) {
        context.fillStyle = "#FFFFFF";
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.drawImage(image, 0, 0, canvas.width, canvas.height);

        const png = canvas.toDataURL("image/png");
        const downloadLink = document.createElement("a");
        downloadLink.href = png;
        downloadLink.download = `qrcode-${shortCode}.png`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
      }
    };
    image.src = blobURL;
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  const totalClicks = links.reduce((acc, curr) => acc + (curr.clicks || 0), 0);
  const filteredLinks = useMemo(() => {
    const query = linkSearch.trim().toLowerCase();
    return links.filter((link) => {
      const isExpired = !!link.expires_at && new Date(link.expires_at).getTime() <= currentTime;
      const matchesStatus =
        linkStatusFilter === "all" ||
        (linkStatusFilter === "expired" ? isExpired : !isExpired);
      const matchesSearch =
        !query ||
        `${link.short_code} ${link.original_url}`.toLowerCase().includes(query);
      return matchesStatus && matchesSearch;
    });
  }, [currentTime, linkSearch, linkStatusFilter, links]);

  const openCreateForm = () => {
    setErrorMessage(null);
    setIsCreateFormOpen(true);
    window.setTimeout(() => {
      createFormRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 0);
  };

  return (
    <div className="site-shell min-h-screen text-white font-sans flex flex-col justify-between relative">

      {/* Custom Confirm Modal */}
      <ConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        loading={isDeleting}
        title="Delete link"
        message="Are you sure you want to delete this link? Visitors will no longer be able to use this short URL."
        confirmText="Delete link"
      />

      {/* Header Sticky */}
      <DashboardHeader user={user} />
      {false && (
      <header className="app-header sticky top-0 z-40 border-b transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 flex items-center justify-between h-16">
          <div className="flex items-center space-x-3">
      <NextImage
        src="/logo.png"
        alt="urlyu.com logo"
        width={32}
        height={32}
        className="w-8 h-8 object-contain rounded-lg"
      />
      <span className="text-2xl font-black tracking-wider text-white">
        urlyu<span className="text-indigo-500">.com</span>
      </span>

            {/* Navigasi Desktop */}
            <nav className="hidden md:flex items-center space-x-6 h-full text-sm font-semibold">
              <Link
                href="/dashboard"
                className={`flex items-center gap-2 h-full border-b-2 transition-all ${
                  pathname === "/dashboard"
                    ? "border-indigo-500 text-indigo-400 font-bold"
                    : "border-transparent text-slate-400 hover:text-slate-200"
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Dashboard</span>
              </Link>
              <Link
                href="/dashboard/pages"
                className={`flex items-center gap-2 h-full border-b-2 transition-all ${
                  pathname.startsWith("/dashboard/pages")
                    ? "border-indigo-500 text-indigo-400 font-bold"
                    : "border-transparent text-slate-400 hover:text-slate-200"
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>Manage Pages</span>
              </Link>
              <Link
                href="/dashboard/analytics"
                className={`flex items-center gap-2 h-full border-b-2 transition-all ${
                  pathname.startsWith("/dashboard/analytics")
                    ? "border-indigo-500 text-indigo-400 font-bold"
                    : "border-transparent text-slate-400 hover:text-slate-200"
                }`}
              >
                <BarChart3 className="w-4 h-4" />
                <span>Analytics</span>
              </Link>
            </nav>
          </div>

          <div className="flex items-center space-x-3">
            {user && (
              <div className="hidden sm:flex items-center space-x-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center font-bold text-xs uppercase text-white shrink-0 shadow-md shadow-indigo-500/20">
                  {user?.email?.[0] || "M"}
                </div>
              </div>
            )}

            <button
              onClick={handleLogout}
              className="hidden md:flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-300 bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-slate-600 rounded-full transition-all duration-200"
            >
              <LogOut className="w-4 h-4 text-slate-400" />
              <span>Log out</span>
            </button>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 focus:outline-none transition-all"
              aria-label="Toggle Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-[#0a0d18] border-b border-slate-800/80 px-4 pt-4 pb-6 space-y-2 font-sans">
            <Link
              href="/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-3 px-5 py-3 rounded-2xl text-sm font-semibold transition-all ${
                pathname === "/dashboard"
                  ? "bg-[#181c42] text-indigo-300 border border-indigo-500/40"
                  : "text-slate-300 hover:bg-slate-900 hover:text-white"
              }`}
            >
              <LayoutDashboard className="w-4 h-4 text-indigo-400" />
              <span>Dashboard</span>
            </Link>

            <Link
              href="/dashboard/pages"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-3 px-5 py-3 rounded-2xl text-sm font-semibold transition-all ${
                pathname.startsWith("/dashboard/pages")
                  ? "bg-[#181c42] text-indigo-300 border border-indigo-500/40"
                  : "text-slate-300 hover:bg-slate-900 hover:text-white"
              }`}
            >
              <FileText className="w-4 h-4 text-indigo-400" />
              <span>Manage Pages</span>
            </Link>

            <Link
              href="/dashboard/analytics"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-3 px-5 py-3 rounded-2xl text-sm font-semibold transition-all ${
                pathname.startsWith("/dashboard/analytics")
                  ? "bg-[#181c42] text-indigo-300 border border-indigo-500/40"
                  : "text-slate-300 hover:bg-slate-900 hover:text-white"
              }`}
            >
              <BarChart3 className="w-4 h-4 text-indigo-400" />
              <span>Analytics</span>
            </Link>

            <div className="pt-4 mt-3 border-t border-slate-800/80 flex items-center justify-between">
              <div className="flex items-center space-x-3 overflow-hidden pr-2">
                <div className="w-9 h-9 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-sm text-white shrink-0">
                  {user?.email?.[0]?.toUpperCase() || "R"}
                </div>
                <span className="text-sm font-medium text-slate-200 truncate">
                  {user?.email || "rrhmii@yahoo.co.id"}
                </span>
              </div>

              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 rounded-full border border-slate-800 bg-slate-950/60 hover:bg-slate-800 text-slate-200 text-xs font-semibold shrink-0 transition-all"
              >
                <LogOut className="w-3.5 h-3.5 text-slate-300" />
                <span>Log out</span>
              </button>
            </div>
          </div>
        )}
      </header>)}

      {/* Main content */}
      <main className="mx-auto w-full max-w-7xl flex-1 space-y-7 px-4 py-8 sm:px-6 lg:px-8">
        <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-indigo-300">Link management</p>
            <h1 className="text-3xl font-bold tracking-tight text-white">My Links</h1>
            <p className="mt-1 text-sm text-slate-400">Create, organize, and track your short links.</p>
          </div>
          <button
            type="button"
            onClick={openCreateForm}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-950/30 transition hover:bg-indigo-500"
          >
            <Plus className="h-4 w-4" />
            Create Link
          </button>
        </section>

        <section aria-label="Link statistics" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { label: "Total links", value: links.length.toLocaleString(), detail: "All links created", icon: Link2, iconClass: "border-indigo-500/20 bg-indigo-500/10 text-indigo-300" },
            { label: "Total clicks", value: totalClicks.toLocaleString(), detail: "Lifetime clicks", icon: MousePointerClick, iconClass: "border-violet-500/20 bg-violet-500/10 text-violet-300" },
            { label: "Clicks today", value: clickStats?.today.toLocaleString() ?? "—", detail: "Since midnight", icon: CalendarDays, iconClass: "border-sky-500/20 bg-sky-500/10 text-sky-300" },
            { label: "Clicks (30 days)", value: clickStats?.last30Days.toLocaleString() ?? "—", detail: "Last 30 days", icon: BarChart2, iconClass: "border-emerald-500/20 bg-emerald-500/10 text-emerald-300" },
          ].map(({ label, value, detail, icon: Icon, iconClass }) => (
            <div key={label} className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-sm transition hover:border-indigo-500/40">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-400">{label}</p>
                  <p className="mt-3 text-3xl font-bold tracking-tight text-white">{value}</p>
                </div>
                <span className={`rounded-xl border p-3 ${iconClass}`}>
                  <Icon className="h-5 w-5" />
                </span>
              </div>
              <p className="mt-3 text-xs text-slate-500">{detail}</p>
            </div>
          ))}
        </section>

        {isCreateFormOpen && <div ref={createFormRef} className="scroll-mt-24">
        <div className="relative overflow-hidden bg-slate-900/90 border border-slate-800 hover:border-slate-700 p-6 sm:p-8 rounded-3xl shadow-xl transition-all">
          <div className="mb-2 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-indigo-600/20 p-2 text-indigo-400">
                <Plus className="h-5 w-5" />
              </div>
              <h2 className="text-xl font-bold">Create a new short link</h2>
            </div>
            <button type="button" onClick={() => { setIsCreateFormOpen(false); setErrorMessage(null); }} className="rounded-lg px-3 py-2 text-sm text-slate-400 transition hover:bg-slate-800 hover:text-white">
              Cancel
            </button>
          </div>
          <p className="text-slate-400 text-xs sm:text-sm mb-6">
            Enter a destination URL and choose a custom code if you like.
          </p>

          {errorMessage && isCreateFormOpen && (
            <div className="mb-4 p-3 bg-red-950/50 border border-red-500/40 text-red-400 text-xs rounded-xl font-medium">
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleCreateLink} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                DESTINATION URL
              </label>
              <input
                type="text"
                required
                placeholder="Paste url here... (https://mywebsite.com)"
                value={destinationUrl}
                onChange={(e) => setDestinationUrl(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-3 text-sm focus:outline-none transition-all placeholder:text-slate-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                CUSTOM SHORT CODE (OPTIONAL)
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-4 text-xs font-semibold text-slate-500 select-none">
                  /
                </span>
                <input
                  type="text"
                  placeholder="custom-url"
                  value={customCode}
                  onChange={(e) => setCustomCode(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl pl-8 pr-4 py-3 text-sm focus:outline-none transition-all placeholder:text-slate-600"
                />
              </div>
            </div>

            <details className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
              <summary className="cursor-pointer text-xs font-semibold text-slate-300">
                Security, campaign, and domain options
              </summary>
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-300">
                    PASSWORD (OPTIONAL)
                  </label>
                  <input
                    type="password"
                    autoComplete="new-password"
                    maxLength={128}
                    value={linkPassword}
                    onChange={(event) => setLinkPassword(event.target.value)}
                    placeholder="Visitors must enter this password"
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-300">
                    UTM CONTENT (OPTIONAL)
                  </label>
                  <input
                    type="text"
                    maxLength={100}
                    value={utmContent}
                    onChange={(event) => setUtmContent(event.target.value)}
                    placeholder="e.g. hero-button"
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-300">
                    UTM TERM (OPTIONAL)
                  </label>
                  <input
                    type="text"
                    maxLength={100}
                    value={utmTerm}
                    onChange={(event) => setUtmTerm(event.target.value)}
                    placeholder="e.g. brand-keyword"
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-300">
                    EXPIRATION (OPTIONAL)
                  </label>
                  <input
                    type="datetime-local"
                    value={expiresAt}
                    onChange={(event) => setExpiresAt(event.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-300">
                    UTM SOURCE
                  </label>
                  <input
                    type="text"
                    maxLength={100}
                    value={utmSource}
                    onChange={(event) => setUtmSource(event.target.value)}
                    placeholder="e.g. newsletter"
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-300">
                    UTM MEDIUM
                  </label>
                  <input
                    type="text"
                    maxLength={100}
                    value={utmMedium}
                    onChange={(event) => setUtmMedium(event.target.value)}
                    placeholder="e.g. email"
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-300">
                    UTM CAMPAIGN
                  </label>
                  <input
                    type="text"
                    maxLength={100}
                    value={utmCampaign}
                    onChange={(event) => setUtmCampaign(event.target.value)}
                    placeholder="e.g. product-launch"
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-300">
                    SHORT-LINK DOMAIN
                  </label>
                  <select
                    value={customDomainId}
                    onChange={(event) => setCustomDomainId(event.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="">urlyu.com</option>
                    {customDomains.map((domain) => (
                      <option key={domain.id} value={domain.id}>{domain.domain}</option>
                    ))}
                  </select>
                  <Link href="/dashboard/domains" className="mt-1.5 inline-block text-[11px] text-indigo-300 hover:text-indigo-200">
                    Manage custom domains
                  </Link>
                </div>
              </div>
              <p className="mt-4 text-[11px] leading-5 text-slate-500">
                UTM values are added to the destination and recorded with clicks. Passwords are stored as salted hashes.
              </p>
            </details>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-indigo-600/20 active:scale-[0.99] disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Creating...</span>
                </>
              ) : (
                "Create short link"
              )}
            </button>
          </form>
        </div>
        </div>}

        <section className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/80 shadow-sm">
          <div className="flex flex-col gap-4 border-b border-slate-800 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white">Links List</h2>
              <p className="mt-1 text-sm text-slate-400">
                Showing {filteredLinks.length} of {links.length} links
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <label className="relative block sm:w-64">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input
                  type="search"
                  value={linkSearch}
                  onChange={(event) => setLinkSearch(event.target.value)}
                  placeholder="Search links..."
                  aria-label="Search links"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 py-2.5 pl-9 pr-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-indigo-500"
                />
              </label>
              <button
                type="button"
                onClick={() => setShowFilters((visible) => !visible)}
                aria-expanded={showFilters}
                className={`inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition ${showFilters ? "border-indigo-500/50 bg-indigo-500/10 text-indigo-200" : "border-slate-700 bg-slate-950 text-slate-300 hover:bg-slate-800"}`}
              >
                <Filter className="h-4 w-4" />
                Advanced Filters
                <ChevronDown className={`h-4 w-4 transition-transform ${showFilters ? "rotate-180" : ""}`} />
              </button>
            </div>
          </div>

          {showFilters && (
            <div className="flex flex-col gap-3 border-b border-slate-800 bg-slate-950/40 px-5 py-4 sm:flex-row sm:items-center">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Status</span>
              <div className="flex flex-wrap gap-2">
                {(["all", "active", "expired"] as const).map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setLinkStatusFilter(status)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition ${linkStatusFilter === status ? "bg-indigo-500/15 text-indigo-200 ring-1 ring-inset ring-indigo-500/30" : "bg-slate-800 text-slate-400 hover:text-white"}`}
                  >
                    {status === "all" ? "All links" : status}
                  </button>
                ))}
              </div>
            </div>
          )}

          {errorMessage && !isCreateFormOpen && (
            <div role="alert" className="m-5 rounded-xl border border-red-500/30 bg-red-950/40 px-4 py-3 text-sm text-red-300">
              {errorMessage}
            </div>
          )}

          {links.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <Link2 className="mx-auto h-8 w-8 text-slate-600" />
              <p className="mt-3 font-medium text-slate-200">No links yet</p>
              <p className="mt-1 text-sm text-slate-500">Create your first short link to see it here.</p>
              <button type="button" onClick={openCreateForm} className="mt-5 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500">
                Create Link
              </button>
            </div>
          ) : filteredLinks.length === 0 ? (
            <div className="px-6 py-14 text-center text-sm text-slate-400">
              No links match your search or filters.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[850px] text-left text-sm">
                <thead className="bg-slate-950/50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th scope="col" className="px-5 py-3.5 font-semibold">Short link</th>
                    <th scope="col" className="px-5 py-3.5 font-semibold">Destination</th>
                    <th scope="col" className="px-5 py-3.5 font-semibold">Clicks</th>
                    <th scope="col" className="px-5 py-3.5 font-semibold">Status</th>
                    <th scope="col" className="px-5 py-3.5 font-semibold">Created</th>
                    <th scope="col" className="px-5 py-3.5 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {filteredLinks.map((item) => {
                    const customDomain = customDomains.find((domain) => domain.id === item.custom_domain_id);
                    const shortUrl = `${customDomain ? `https://${customDomain.domain}` : origin}/${item.short_code}`;
                    const isExpired = !!item.expires_at && new Date(item.expires_at).getTime() <= currentTime;

                    return (
                      <tr key={item.id} className="transition hover:bg-slate-800/30">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <span className="rounded-lg bg-white p-1.5">
                              <QRCodeSVG id={`qr-${item.id}`} value={shortUrl} size={34} />
                            </span>
                            <div className="min-w-0">
                              <a href={shortUrl} target="_blank" rel="noreferrer" className="flex max-w-[220px] items-center gap-1 font-semibold text-indigo-300 hover:text-indigo-200">
                                <span className="truncate">{shortUrl}</span>
                                <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                              </a>
                              {item.password_protected && (
                                <span className="mt-1 inline-flex items-center gap-1 text-[11px] text-amber-300">
                                  <ShieldCheck className="h-3 w-3" /> Password protected
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="max-w-[260px] px-5 py-4">
                          <p className="truncate text-slate-300" title={item.original_url}>{item.original_url}</p>
                          {item.utm_campaign && <p className="mt-1 truncate text-xs text-slate-500">Campaign: {item.utm_campaign}</p>}
                        </td>
                        <td className="px-5 py-4 font-medium text-slate-200">{(item.clicks || 0).toLocaleString()}</td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${isExpired ? "bg-slate-800 text-slate-400" : "bg-emerald-500/10 text-emerald-300"}`}>
                            {isExpired ? "Expired" : "Active"}
                          </span>
                          {item.expires_at && !isExpired && <p className="mt-1 whitespace-nowrap text-[11px] text-slate-500">Until {new Date(item.expires_at).toLocaleDateString()}</p>}
                        </td>
                        <td className="whitespace-nowrap px-5 py-4 text-slate-400">{new Date(item.created_at).toLocaleDateString()}</td>
                        <td className="px-5 py-4">
                          <div className="flex items-center justify-end gap-1">
                            <button type="button" onClick={() => copyToClipboard(item.id, shortUrl)} aria-label="Copy short link" title={copiedId === item.id ? "Copied!" : "Copy link"} className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-700 hover:text-white">
                              {copiedId === item.id ? <CopyCheck className="h-4 w-4 text-emerald-300" /> : <Copy className="h-4 w-4" />}
                            </button>
                            <button type="button" onClick={() => downloadQRCode(item.id, item.short_code)} aria-label="Download QR code" title="Download QR code" className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-700 hover:text-white">
                              <Download className="h-4 w-4" />
                            </button>
                            <button type="button" onClick={() => promptDeleteLink(item.id)} aria-label="Delete link" title="Delete link" className="rounded-lg p-2 text-slate-400 transition hover:bg-red-500/10 hover:text-red-300">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>

      {/* Footer */}
      <SiteFooter />
    </div>
  );
}