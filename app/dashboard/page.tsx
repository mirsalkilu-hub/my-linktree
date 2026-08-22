"use client";

import { QRCodeSVG } from "qrcode.react";
import { useState, useEffect, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import {
  LogOut,
  Menu,
  X,
  Link2,
  MousePointerClick,
  ArrowUpRight,
  TrendingUp,
  Sparkles,
  Copy,
  Trash2,
  Download,
  ExternalLink,
  Plus,
  Layers,
  Loader2,
  LayoutDashboard,
  FileText,
  BarChart3,
} from "lucide-react";
import type { User } from "@supabase/supabase-js";

interface LinkItem {
  id: string;
  original_url: string;
  short_code: string;
  clicks: number;
  created_at: string;
}

export default function DashboardPage() {
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [destinationUrl, setDestinationUrl] = useState("");
  const [customCode, setCustomCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [origin, setOrigin] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window !== "undefined") {
      setOrigin(window.location.origin);
    }
  }, []);

  const fetchUserAndLinks = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }
    setUser(user);

    const { data, error } = await supabase
      .from("links")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Gagal mengambil data link:", error.message);
      return;
    }

    if (data) setLinks(data);
  }, [router]);

  useEffect(() => {
    fetchUserAndLinks();
  }, [fetchUserAndLinks]);

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
      setErrorMessage("Format URL tidak valid. Harap periksa kembali.");
      return;
    }

    setLoading(true);

    const slug =
      customCode.trim().toLowerCase().replace(/\s+/g, "-") ||
      Math.random().toString(36).substring(2, 7);

    const { error } = await supabase.from("links").insert([
      {
        original_url: formattedUrl,
        short_code: slug,
        user_id: user?.id,
      },
    ]);

    if (error) {
      if (error.code === "23505") {
        setErrorMessage("Short code tersebut sudah digunakan, coba kode lain.");
      } else {
        setErrorMessage("Gagal membuat link: " + error.message);
      }
    } else {
      setDestinationUrl("");
      setCustomCode("");
      fetchUserAndLinks();
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Yakin ingin menghapus link ini?")) return;
    const { error } = await supabase.from("links").delete().eq("id", id);
    if (!error) {
      fetchUserAndLinks();
    } else {
      alert("Gagal menghapus link: " + error.message);
    }
  };

  const copyToClipboard = (id: string, url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
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
    
    // Perbaikan kompatibilitas URL object di TypeScript
    const blobURL = window.URL.createObjectURL(svgBlob);

    const image = new Image();
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
      window.URL.revokeObjectURL(blobURL);
    };
    image.src = blobURL;
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  const totalClicks = links.reduce((acc, curr) => acc + (curr.clicks || 0), 0);

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans flex flex-col justify-between">
      {/* Header Sticky */}
      <header className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-slate-800 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 flex items-center justify-between h-16">
          <div className="flex items-center space-x-8 h-full">
            <span className="text-xl sm:text-2xl font-black tracking-wider text-white shrink-0">
              mr<span className="text-indigo-500">.id</span>
            </span>

            <nav className="hidden md:flex items-center space-x-8 h-full text-sm font-semibold">
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
                <span>Kelola Halaman</span>
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
                  {user.email?.[0] || "M"}
                </div>
              </div>
            )}

            {/* Tombol Keluar (Desktop Only) */}
            <button
              onClick={handleLogout}
              className="hidden md:flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-300 bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-slate-600 rounded-full transition-all duration-200"
            >
              <LogOut className="w-4 h-4 text-slate-400" />
              <span>Keluar</span>
            </button>

            {/* Hamburger Button (Mobile Only) */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 focus:outline-none transition-all"
              aria-label="Toggle Menu"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-[#0a0d18] border-b border-slate-800/80 px-4 pt-4 pb-6 space-y-2 font-sans">
            <Link
              href="/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-semibold transition-all ${
                pathname === "/dashboard"
                  ? "bg-[#181c42] text-indigo-300 border border-indigo-500/40"
                  : "text-slate-300 hover:bg-slate-900 hover:text-white"
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Dashboard</span>
            </Link>

            <Link
              href="/dashboard/pages"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-semibold transition-all ${
                pathname.startsWith("/dashboard/pages")
                  ? "bg-[#181c42] text-indigo-300 border border-indigo-500/40"
                  : "text-slate-300 hover:bg-slate-900 hover:text-white"
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Kelola Halaman</span>
            </Link>

            <Link
              href="/dashboard/analytics"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-semibold transition-all ${
                pathname.startsWith("/dashboard/analytics")
                  ? "bg-[#181c42] text-indigo-300 border border-indigo-500/40"
                  : "text-slate-300 hover:bg-slate-900 hover:text-white"
              }`}
            >
              <BarChart3 className="w-4 h-4" />
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
                <span>Keluar</span>
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Konten Utama */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-10 w-full flex-1 space-y-8">
        {/* Banner Welcome */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-950/60 via-slate-900 to-slate-900 border border-indigo-500/20 p-6 sm:p-8 shadow-2xl">
          <div className="absolute top-0 right-0 -mt-12 -mr-12 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold mb-3">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Shortener & Bio Link Suite</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Selamat Datang Kembali! 👋
              </h1>
              <p className="text-sm text-slate-400 mt-1 max-w-lg">
                Kelola tautan pendek, pantau performa statistik klik, dan optimalkan branding linimasa Anda dalam satu tempat.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <Link
                href="/dashboard/pages"
                className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs sm:text-sm px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-indigo-600/30 hover:scale-105"
              >
                <Layers className="w-4 h-4" />
                <span>Kelola Halaman Bio</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Ringkasan Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="relative overflow-hidden bg-slate-900/80 backdrop-blur-xl border border-slate-800 hover:border-indigo-500/40 p-6 rounded-2xl transition-all duration-300 group shadow-lg shadow-indigo-950/20">
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Total Tautan Dibuat
              </span>
              <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20 group-hover:scale-110 transition-transform shadow-[0_0_15px_rgba(99,102,241,0.25)]">
                <Link2 className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-baseline justify-between">
              <strong className="text-3xl font-black text-white tracking-tight">
                {links.length}
              </strong>
              <div className="flex items-center text-xs font-semibold text-emerald-400 bg-emerald-950/40 border border-emerald-800/50 px-2.5 py-1 rounded-full">
                <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
                <span>Aktif</span>
              </div>
            </div>
          </div>

          <div className="relative overflow-hidden bg-slate-900/80 backdrop-blur-xl border border-slate-800 hover:border-rose-500/40 p-6 rounded-2xl transition-all duration-300 group shadow-lg shadow-rose-950/20">
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-rose-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Total Klik Diterima
              </span>
              <div className="p-3 bg-rose-500/10 text-rose-400 rounded-xl border border-rose-500/20 group-hover:scale-110 transition-transform shadow-[0_0_15px_rgba(244,63,94,0.25)]">
                <MousePointerClick className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-baseline justify-between">
              <strong className="text-3xl font-black text-white tracking-tight">
                {totalClicks}
              </strong>
              <div className="flex items-center text-xs font-semibold text-indigo-400 bg-indigo-950/40 border border-indigo-800/50 px-2.5 py-1 rounded-full">
                <TrendingUp className="w-3.5 h-3.5 mr-1" />
                <span>Realtime Log</span>
              </div>
            </div>
          </div>
        </div>

        {/* Form Buat Link Baru */}
        <div className="relative overflow-hidden bg-slate-900/90 border border-slate-800 hover:border-slate-700 p-6 sm:p-8 rounded-3xl shadow-xl transition-all">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-indigo-600/20 text-indigo-400 rounded-lg">
              <Plus className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold">Buat Short Link Baru</h2>
          </div>
          <p className="text-slate-400 text-xs sm:text-sm mb-6">
            Masukkan URL tujuan Anda dan tentukan kode kustom jika diinginkan.
          </p>

          {errorMessage && (
            <div className="mb-4 p-3 bg-red-950/50 border border-red-500/40 text-red-400 text-xs rounded-xl font-medium">
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleCreateLink} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                URL Asli (Destination URL)
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
                Custom Short Code (Opsional)
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-4 text-xs font-semibold text-slate-500 select-none">
                  /s/
                </span>
                <input
                  type="text"
                  placeholder="custom-url"
                  value={customCode}
                  onChange={(e) => setCustomCode(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl pl-20 pr-4 py-3 text-sm focus:outline-none transition-all placeholder:text-slate-600"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-indigo-600/25 active:scale-[0.99] disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Memproses...</span>
                </>
              ) : (
                "Pendekkan Link"
              )}
            </button>
          </form>
        </div>

        {/* Daftar Link */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <span>Daftar Link Anda</span>
              <span className="bg-indigo-950 border border-indigo-500/30 text-indigo-400 text-xs font-extrabold px-2.5 py-0.5 rounded-full">
                {links.length}
              </span>
            </h3>
          </div>

          <div className="space-y-4">
            {links.length === 0 ? (
              <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-10 text-center text-slate-500 text-sm">
                Belum ada link yang dibuat. Mulai buat short link pertama Anda di atas!
              </div>
            ) : (
              links.map((item) => {
                const shortUrl = `${origin}/s/${item.short_code}`;

                return (
                  <div
                    key={item.id}
                    className="bg-slate-900 border border-slate-800 hover:border-slate-700 p-5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-5 transition-all shadow-md hover:shadow-indigo-950/10"
                  >
                    {/* QR Code */}
                    <div className="flex sm:flex-col items-center gap-2 shrink-0">
                      <div className="bg-white p-2 rounded-xl shadow-sm">
                        <QRCodeSVG
                          id={`qr-${item.id}`}
                          value={shortUrl}
                          size={64}
                        />
                      </div>
                      <button
                        onClick={() => downloadQRCode(item.id, item.short_code)}
                        className="inline-flex items-center gap-1 text-[11px] text-indigo-400 hover:text-indigo-300 font-semibold transition-colors"
                      >
                        <Download className="w-3 h-3" />
                        <span>PNG</span>
                      </button>
                    </div>

                    {/* Detail URL & Statistik */}
                    <div className="flex-1 w-full overflow-hidden text-left space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <a
                          href={shortUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-indigo-400 font-bold hover:underline text-base truncate flex items-center gap-1.5 max-w-full"
                        >
                          <span className="truncate">{shortUrl}</span>
                          <ExternalLink className="w-3.5 h-3.5 text-indigo-400/70 shrink-0" />
                        </a>
                        <span className="bg-indigo-950/80 border border-indigo-500/30 text-indigo-300 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full whitespace-nowrap">
                          {item.clicks || 0} Klik
                        </span>
                      </div>
                      <p className="text-slate-400 text-xs truncate">
                        {item.original_url}
                      </p>
                    </div>

                    {/* Tombol Aksi */}
                    <div className="flex items-center space-x-2 shrink-0 w-full sm:w-auto justify-end">
                      <button
                        onClick={() => copyToClipboard(item.id, shortUrl)}
                        className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition-all"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>{copiedId === item.id ? "Tersalin!" : "Salin"}</span>
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="inline-flex items-center justify-center p-2.5 bg-red-950/30 hover:bg-red-900/50 text-red-400 border border-red-500/20 rounded-xl text-xs font-semibold transition-all"
                        title="Hapus Link"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center py-6 border-t border-slate-900 text-slate-600 text-xs">
        © 2026 mr.id. All rights reserved.
      </footer>
    </div>
  );
}