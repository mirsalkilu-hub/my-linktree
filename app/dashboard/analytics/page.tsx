"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
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
import { TrendingUp, MousePointer, Layers, LogOut, Menu, X } from "lucide-react";

interface BioProfile {
  id: string;
  title: string;
  username: string;
}

interface DailyStat {
  date: string;
  clicks: number;
}

interface LinkStat {
  name: string;
  clicks: number;
}

const BAR_COLORS = ["#6366f1", "#3b82f6", "#10b981", "#f43f5e", "#f59e0b", "#8b5cf6"];

export default function AnalyticsPage() {
  const pathname = usePathname();
  const router = useRouter();

  const [user, setUser] = useState<any>(null);
  const [pages, setPages] = useState<BioProfile[]>([]);
  const [selectedPageId, setSelectedPageId] = useState<string>("");
  const [dailyData, setDailyData] = useState<DailyStat[]>([]);
  const [linkData, setLinkData] = useState<LinkStat[]>([]);
  const [totalClicks, setTotalClicks] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  // Fungsi Logout
  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  useEffect(() => {
    loadPages();
  }, []);

  useEffect(() => {
    if (selectedPageId) {
      loadAnalyticsData(selectedPageId);
    }
  }, [selectedPageId]);

  const loadPages = async () => {
    const { data: { user } } = await supabase.auth.getUser();
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
  };

  const loadAnalyticsData = async (bioId: string) => {
    setLoading(true);

    // 1. Ambil data link & total klik
    const { data: links } = await supabase
      .from("bio_links")
      .select("id, title, clicks")
      .eq("bio_id", bioId);

    const formattedLinks: LinkStat[] = (links || []).map((l) => ({
      name: l.title.length > 15 ? l.title.substring(0, 15) + "..." : l.title,
      clicks: l.clicks || 0,
    }));

    setLinkData(formattedLinks);

    const sumClicks = formattedLinks.reduce((acc, item) => acc + item.clicks, 0);
    setTotalClicks(sumClicks);

    // 2. Ambil log statistik 7 hari terakhir
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

    const { data: logs } = await supabase
      .from("bio_link_analytics")
      .select("created_at")
      .eq("bio_id", bioId)
      .gte("created_at", sevenDaysAgo.toISOString());

    // Kelompokkan tren per hari
    const daysMap: Record<string, number> = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateKey = d.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
      daysMap[dateKey] = 0;
    }

    if (logs) {
      logs.forEach((log) => {
        const dateKey = new Date(log.created_at).toLocaleDateString("id-ID", {
          day: "numeric",
          month: "short",
        });
        if (daysMap[dateKey] !== undefined) {
          daysMap[dateKey] += 1;
        }
      });
    }

    const chartData: DailyStat[] = Object.keys(daysMap).map((key) => ({
      date: key,
      clicks: daysMap[key],
    }));

    setDailyData(chartData);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans flex flex-col justify-between">
      {/* Header Navigasi */}
      <header className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-slate-800 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 flex items-center justify-between h-16">
          
          {/* Logo & Desktop Nav */}
          <div className="flex items-center space-x-8 h-full">
            <span className="text-xl sm:text-2xl font-black tracking-wider text-white shrink-0">
              mr<span className="text-indigo-500">.id</span>
            </span>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center space-x-8 h-full text-sm font-semibold">
              <Link
                href="/dashboard"
                className={`flex items-center h-full border-b-2 transition-all ${
                  pathname === "/dashboard"
                    ? "border-indigo-500 text-indigo-400 font-bold"
                    : "border-transparent text-slate-400 hover:text-slate-200"
                }`}
              >
                Dashboard
              </Link>
              <Link
                href="/dashboard/pages"
                className={`flex items-center h-full border-b-2 transition-all ${
                  pathname.startsWith("/dashboard/pages")
                    ? "border-indigo-500 text-indigo-400 font-bold"
                    : "border-transparent text-slate-400 hover:text-slate-200"
                }`}
              >
                Kelola Halaman
              </Link>
              <Link
                href="/dashboard/analytics"
                className={`flex items-center h-full border-b-2 transition-all ${
                  pathname.startsWith("/dashboard/analytics")
                    ? "border-indigo-500 text-indigo-400 font-bold"
                    : "border-transparent text-slate-400 hover:text-slate-200"
                }`}
              >
                Analytics
              </Link>
            </nav>
          </div>

          {/* Right Side: Desktop Profile/Logout + Mobile Hamburger Button */}
          <div className="flex items-center space-x-3">
            {/* User Profile Badge (Desktop) */}
            {user && (
              <div className="hidden sm:flex items-center space-x-2">
                <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-xs uppercase text-white shrink-0">
                  {user.email?.[0] || "M"}
                </div>
              </div>
            )}

            {/* Logout Button (Desktop) */}
            <button
  onClick={handleLogout}
  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-300 bg-slate-900/50 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 rounded-full transition-all duration-200"
>
  <LogOut className="w-4 h-4 text-slate-400" />
  <span>Keluar</span>
</button>

            {/* Mobile Hamburger Button */}
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

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-slate-900/95 border-b border-slate-800 backdrop-blur-xl px-4 pt-3 pb-6 space-y-3">
            <Link
              href="/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className={`block px-3 py-2 rounded-xl text-sm font-semibold transition-all ${
                pathname === "/dashboard"
                  ? "bg-indigo-600/20 text-indigo-400 border border-indigo-500/30"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              }`}
            >
              Dashboard
            </Link>
            <Link
              href="/dashboard/pages"
              onClick={() => setMobileMenuOpen(false)}
              className={`block px-3 py-2 rounded-xl text-sm font-semibold transition-all ${
                pathname.startsWith("/dashboard/pages")
                  ? "bg-indigo-600/20 text-indigo-400 border border-indigo-500/30"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              }`}
            >
              Kelola Halaman
            </Link>
            <Link
              href="/dashboard/analytics"
              onClick={() => setMobileMenuOpen(false)}
              className={`block px-3 py-2 rounded-xl text-sm font-semibold transition-all ${
                pathname.startsWith("/dashboard/analytics")
                  ? "bg-indigo-600/20 text-indigo-400 border border-indigo-500/30"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              }`}
            >
              Analytics
            </Link>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
              {user && (
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-xs uppercase text-white shrink-0">
                    {user.email?.[0] || "M"}
                  </div>
                  <span className="text-xs text-slate-300 truncate max-w-[150px]">
                    {user.email}
                  </span>
                </div>
              )}

              <button
                onClick={handleLogout}
                className="flex items-center space-x-1.5 border border-red-600/80 bg-red-950/20 text-red-500 hover:bg-red-600 hover:text-white px-3 py-1.5 rounded-full text-xs font-bold transition-all"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Keluar</span>
              </button>
            </div>
          </div>
        )}
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10 w-full flex-1">
        {/* Selector Halaman */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
              <TrendingUp className="text-indigo-500" /> Analisis Performa & Grafik Klik
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Pantau tren trafik dan performa tombol di setiap halaman bio Anda.
            </p>
          </div>

          {pages.length > 0 && (
            <div className="flex items-center space-x-3">
              <span className="text-xs text-slate-400 shrink-0">Pilih Halaman:</span>
              <select
                value={selectedPageId}
                onChange={(e) => setSelectedPageId(e.target.value)}
                className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:border-indigo-500 w-full sm:w-auto"
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

        {/* Ringkasan Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center space-x-4">
            <div className="p-3 bg-indigo-600/20 text-indigo-400 rounded-xl border border-indigo-500/30">
              <MousePointer className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold block">
                Total Klik Semua Tombol
              </span>
              <strong className="text-2xl font-black text-white">{totalClicks}</strong>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center space-x-4">
            <div className="p-3 bg-emerald-600/20 text-emerald-400 rounded-xl border border-emerald-500/30">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold block">
                Trafik 7 Hari Terakhir
              </span>
              <strong className="text-2xl font-black text-white">
                {dailyData.reduce((acc, curr) => acc + curr.clicks, 0)}{" "}
                <span className="text-xs text-slate-500 font-normal">klik</span>
              </strong>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center space-x-4">
            <div className="p-3 bg-blue-600/20 text-blue-400 rounded-xl border border-blue-500/30">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold block">
                Total Tombol Link
              </span>
              <strong className="text-2xl font-black text-white">{linkData.length}</strong>
            </div>
          </div>
        </div>

        {/* Section Grafik */}
        {loading ? (
          <div className="bg-slate-900 border border-slate-800 p-12 rounded-2xl text-center text-slate-400 text-sm">
            Memuat data grafik analytics...
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Area Chart: Tren Klik 7 Hari Terakhir */}
            <div className="lg:col-span-2 bg-slate-900 border border-slate-800 p-6 rounded-2xl">
              <h3 className="text-sm font-bold text-white mb-1">Tren Klik 7 Hari Terakhir</h3>
              <p className="text-xs text-slate-400 mb-6">Aktivitas klik pengunjung harian</p>

              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dailyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="clickGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="date" stroke="#64748b" fontSize={12} tickLine={false} />
                    <YAxis stroke="#64748b" fontSize={12} tickLine={false} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "12px", color: "#fff" }}
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

            {/* Bar Chart: Perbandingan Klik per Tombol */}
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
              <h3 className="text-sm font-bold text-white mb-1">Klik per Tombol Link</h3>
              <p className="text-xs text-slate-400 mb-6">Perbandingan popularitas tombol link</p>

              <div className="h-72 w-full">
                {linkData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={linkData} layout="vertical" margin={{ top: 0, right: 10, left: 10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                      <XAxis type="number" stroke="#64748b" fontSize={11} allowDecimals={false} />
                      <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={11} tickLine={false} width={80} />
                      <Tooltip
                        contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "12px", color: "#fff" }}
                      />
                      <Bar dataKey="clicks" radius={[0, 8, 8, 0]}>
                        {linkData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={BAR_COLORS[index % BAR_COLORS.length]} />
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

      <footer className="text-center py-6 border-t border-slate-900 text-slate-600 text-xs">
        © 2026 mr.id. All rights reserved.
      </footer>
    </div>
  );
}