"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { User } from "@supabase/supabase-js";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from "recharts";
import {
  TrendingUp,
  MousePointer,
  Layers,
  LogOut,
  Menu,
  X,
  LayoutDashboard,
  FileText,
  BarChart3,
  Sparkles,
  ArrowUpRight,
} from "lucide-react";

interface BioProfile {
  id: string;
  title: string;
  username: string;
}

interface DailyStat {
  date: string;
  rawDate: string;
  clicks: number;
}

interface LinkStat {
  name: string;
  clicks: number;
}

const BAR_COLORS = [
  "#6366f1",
  "#3b82f6",
  "#10b981",
  "#f43f5e",
  "#f59e0b",
  "#8b5cf6",
];

// Helper format tanggal lokal (Contoh: "22 Agt")
const formatDateLabel = (d: Date) => {
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "Mei",
    "Jun",
    "Jul",
    "Agt",
    "Sep",
    "Okt",
    "Nov",
    "Des",
  ];
  return `${d.getDate()} ${months[d.getMonth()]}`;
};

// Format YYYY-MM-DD berbasis zona waktu LOKAL
const toLocalDateKey = (d: Date) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export default function AnalyticsPage() {
  const pathname = usePathname();
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [pages, setPages] = useState<BioProfile[]>([]);
  const [selectedPageId, setSelectedPageId] = useState<string>("");
  const [dailyData, setDailyData] = useState<DailyStat[]>([]);
  const [linkData, setLinkData] = useState<LinkStat[]>([]);
  const [totalClicks, setTotalClicks] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [mounted, setMounted] = useState<boolean>(false);

  // Mencegah masalah hydration pada Recharts
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const loadAnalyticsData = useCallback(async (bioId: string) => {
    setLoading(true);

    try {
      // 1. Ambil data klik tombol link
      const { data: links, error: linkErr } = await supabase
        .from("bio_links")
        .select("id, title, clicks")
        .eq("bio_id", bioId);

      if (linkErr) throw linkErr;

      const formattedLinks: LinkStat[] = (links || []).map((l) => ({
        name: l.title.length > 15 ? l.title.substring(0, 15) + "..." : l.title,
        clicks: l.clicks || 0,
      }));

      setLinkData(formattedLinks);
      const sumClicks = formattedLinks.reduce(
        (acc, item) => acc + item.clicks,
        0
      );
      setTotalClicks(sumClicks);

      // 2. Ambil log analytics 7 hari terakhir
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
      sevenDaysAgo.setHours(0, 0, 0, 0);

      const { data: logs, error: logErr } = await supabase
        .from("bio_link_analytics")
        .select("created_at")
        .eq("bio_id", bioId)
        .gte("created_at", sevenDaysAgo.toISOString());

      if (logErr) throw logErr;

      // Inisialisasi map tanggal 7 hari terakhir berbasis lokal
      const daysMap: Record<string, { label: string; clicks: number }> = {};

      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const localKey = toLocalDateKey(d);
        daysMap[localKey] = {
          label: formatDateLabel(d),
          clicks: 0,
        };
      }

      // Hitung log berdasarkan tanggal lokal
      if (logs) {
        logs.forEach((log) => {
          const logDate = new Date(log.created_at);
          const localKey = toLocalDateKey(logDate);
          if (daysMap[localKey]) {
            daysMap[localKey].clicks += 1;
          }
        });
      }

      const chartData: DailyStat[] = Object.keys(daysMap).map((key) => ({
        rawDate: key,
        date: daysMap[key].label,
        clicks: daysMap[key].clicks,
      }));

      setDailyData(chartData);
    } catch (err) {
      console.error("Gagal memuat data analytics:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadPages = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    setUser(user);

    const { data: profiles } = await supabase
      .from("bio_profiles")
      .select("id, title, username")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (profiles && profiles.length > 0) {
      setPages(profiles);
      setSelectedPageId(profiles[0].id);
    } else {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    loadPages();
  }, [loadPages]);

  useEffect(() => {
    if (selectedPageId) {
      loadAnalyticsData(selectedPageId);
    }
  }, [selectedPageId, loadAnalyticsData]);

  const recent7DaysClicks = dailyData.reduce(
    (acc, curr) => acc + curr.clicks,
    0
  );

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans flex flex-col justify-between">
      {/* Header Navigasi Sticky */}
      <header className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-slate-800 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 flex items-center justify-between h-16">
          <div className="flex items-center space-x-8 h-full">
            <span className="text-xl sm:text-2xl font-black tracking-wider text-white shrink-0">
              mr<span className="text-indigo-500">.id</span>
            </span>

            <nav className="hidden md:flex items-center space-x-2 h-full py-3">
              <Link
                href="/dashboard"
                className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  pathname === "/dashboard"
                    ? "bg-indigo-600/20 text-indigo-400 border border-indigo-500/30"
                    : "text-slate-400 hover:text-white hover:bg-slate-900"
                }`}
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span>Dashboard</span>
              </Link>
              <Link
                href="/dashboard/pages"
                className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  pathname.startsWith("/dashboard/pages")
                    ? "bg-indigo-600/20 text-indigo-400 border border-indigo-500/30"
                    : "text-slate-400 hover:text-white hover:bg-slate-900"
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Kelola Halaman</span>
              </Link>
              <Link
                href="/dashboard/analytics"
                className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  pathname.startsWith("/dashboard/analytics")
                    ? "bg-indigo-600/20 text-indigo-400 border border-indigo-500/30"
                    : "text-slate-400 hover:text-white hover:bg-slate-900"
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
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

            <button
              onClick={handleLogout}
              className="hidden md:flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-300 bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-slate-600 rounded-full transition-all duration-200"
            >
              <LogOut className="w-4 h-4 text-slate-400" />
              <span>Keluar</span>
            </button>

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

        {/* Dropdown Mobile Menu */}
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
                  {user?.email}
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

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10 w-full flex-1 space-y-8">
        {/* Banner Title & Dropdown Filter */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-indigo-950/40 via-slate-900 to-slate-900 border border-indigo-500/20 p-6 sm:p-8 rounded-3xl shadow-xl">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Realtime Traffic Insights</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
              <TrendingUp className="w-7 h-7 text-indigo-400" />
              <span>Analisis Performa & Grafik Klik</span>
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Pantau tren trafik dan performa tombol di setiap halaman bio Anda.
            </p>
          </div>

          {pages.length > 0 && (
            <div className="flex items-center gap-3 shrink-0">
              <span className="text-xs font-semibold text-slate-400 whitespace-nowrap hidden sm:inline">
                Pilih Halaman:
              </span>
              <select
                value={selectedPageId}
                onChange={(e) => setSelectedPageId(e.target.value)}
                className="bg-slate-950 border border-slate-800 hover:border-indigo-500/50 text-white font-semibold text-xs sm:text-sm px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all shadow-lg w-full sm:w-auto"
              >
                {pages.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title} (/{p.username})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Ringkasan Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="relative overflow-hidden bg-slate-900/80 backdrop-blur-xl border border-slate-800 hover:border-indigo-500/40 p-6 rounded-2xl transition-all duration-300 group shadow-lg shadow-indigo-950/10">
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                TOTAL KLIK SEMUA TOMBOL
              </span>
              <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20 group-hover:scale-110 transition-transform shadow-[0_0_15px_rgba(99,102,241,0.25)]">
                <MousePointer className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-baseline justify-between">
              <strong className="text-3xl font-black text-white tracking-tight">
                {totalClicks}
              </strong>
              <span className="text-xs font-medium text-slate-400">
                Total Akumulasi
              </span>
            </div>
          </div>

          <div className="relative overflow-hidden bg-slate-900/80 backdrop-blur-xl border border-slate-800 hover:border-emerald-500/40 p-6 rounded-2xl transition-all duration-300 group shadow-lg shadow-emerald-950/10">
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-emerald-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                TRAFIK 7 HARI TERAKHIR
              </span>
              <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20 group-hover:scale-110 transition-transform shadow-[0_0_15px_rgba(16,185,129,0.25)]">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-baseline justify-between">
              <strong className="text-3xl font-black text-white tracking-tight">
                {recent7DaysClicks}{" "}
                <span className="text-xs font-semibold text-emerald-400">
                  klik
                </span>
              </strong>
              <div className="flex items-center text-xs font-semibold text-emerald-400 bg-emerald-950/40 border border-emerald-800/50 px-2.5 py-1 rounded-full">
                <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
                <span>Aktif</span>
              </div>
            </div>
          </div>

          <div className="relative overflow-hidden bg-slate-900/80 backdrop-blur-xl border border-slate-800 hover:border-violet-500/40 p-6 rounded-2xl transition-all duration-300 group shadow-lg shadow-violet-950/10">
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-violet-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                TOTAL TOMBOL LINK
              </span>
              <div className="p-3 bg-violet-500/10 text-violet-400 rounded-xl border border-violet-500/20 group-hover:scale-110 transition-transform shadow-[0_0_15px_rgba(139,92,246,0.25)]">
                <Layers className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-baseline justify-between">
              <strong className="text-3xl font-black text-white tracking-tight">
                {linkData.length}
              </strong>
              <span className="text-xs font-medium text-slate-400">
                Tombol Aktif
              </span>
            </div>
          </div>
        </div>

        {/* Section Area & Bar Chart */}
        {loading || !mounted ? (
          <div className="bg-slate-900/80 border border-slate-800 p-12 rounded-3xl text-center text-slate-400 text-sm animate-pulse">
            Memuat data grafik analytics...
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Area Chart */}
            <div className="lg:col-span-2 bg-slate-900/90 border border-slate-800 p-6 sm:p-7 rounded-3xl shadow-xl">
              <h3 className="text-lg font-bold text-white mb-1">
                Tren Klik 7 Hari Terakhir
              </h3>
              <p className="text-xs text-slate-400 mb-6">
                Aktivitas klik pengunjung harian
              </p>

              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={dailyData}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient
                        id="clickGradient"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#6366f1"
                          stopOpacity={0.8}
                        />
                        <stop
                          offset="95%"
                          stopColor="#6366f1"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis
                      dataKey="date"
                      stroke="#64748b"
                      fontSize={12}
                      tickLine={false}
                    />
                    <YAxis
                      stroke="#64748b"
                      fontSize={12}
                      tickLine={false}
                      allowDecimals={false}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#0f172a",
                        borderColor: "#334155",
                        borderRadius: "12px",
                        color: "#fff",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="clicks"
                      stroke="#6366f1"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#clickGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Bar Chart */}
            <div className="bg-slate-900/90 border border-slate-800 p-6 sm:p-7 rounded-3xl shadow-xl">
              <h3 className="text-lg font-bold text-white mb-1">
                Klik per Tombol Link
              </h3>
              <p className="text-xs text-slate-400 mb-6">
                Perbandingan popularitas tombol link
              </p>

              <div className="h-72 w-full">
                {linkData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={linkData}
                      layout="vertical"
                      margin={{ top: 0, right: 10, left: 10, bottom: 0 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="#1e293b"
                        horizontal={false}
                      />
                      <XAxis
                        type="number"
                        stroke="#64748b"
                        fontSize={11}
                        allowDecimals={false}
                      />
                      <YAxis
                        dataKey="name"
                        type="category"
                        stroke="#94a3b8"
                        fontSize={11}
                        tickLine={false}
                        width={80}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#0f172a",
                          borderColor: "#334155",
                          borderRadius: "12px",
                          color: "#fff",
                        }}
                      />
                      <Bar dataKey="clicks" radius={[0, 8, 8, 0]}>
                        {linkData.map((_, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={BAR_COLORS[index % BAR_COLORS.length]}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-xs text-slate-500">
                    Belum ada tombol link
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="text-center py-6 border-t border-slate-900 text-slate-600 text-xs">
        © 2026 mr.id. All rights reserved.
      </footer>
    </div>
  );
}