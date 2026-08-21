"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
import { TrendingUp, MousePointer, Layers, ArrowLeft, LogOut } from "lucide-react";

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
  const [pages, setPages] = useState<BioProfile[]>([]);
  const [selectedPageId, setSelectedPageId] = useState<string>("");
  const [dailyData, setDailyData] = useState<DailyStat[]>([]);
  const [linkData, setLinkData] = useState<LinkStat[]>([]);
  const [totalClicks, setTotalClicks] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  const router = useRouter();

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
      {/* Header */}
      <header className="flex items-center justify-between px-8 py-5 border-b border-slate-800">
        <div className="flex items-center space-x-4">
          <Link
            href="/dashboard/bio"
            className="p-2 bg-slate-900 hover:bg-slate-800 rounded-xl border border-slate-800 text-slate-400 hover:text-white transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <span className="text-2xl font-black tracking-wider text-white">
            mr<span className="text-indigo-500">.id</span>
          </span>
        </div>

        {/* Navigation Links & Logout */}
        <div className="flex items-center space-x-6 text-sm font-semibold">
          <Link href="/dashboard" className="text-slate-400 hover:text-white transition-all">
            Dashboard
          </Link>
          <Link href="/dashboard/bio" className="text-slate-400 hover:text-white transition-all">
            Kelola Halaman
          </Link>
          <span className="text-indigo-400">Analytics Grafik</span>

          {/* Tombol Keluar */}
          <button
            onClick={handleLogout}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-xs font-semibold text-red-400 hover:text-red-300 transition-all duration-200"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Keluar</span>
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-10 w-full flex-1">
        {/* Selector Halaman */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <TrendingUp className="text-indigo-500" /> Analisis Performa & Grafik Klik
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Pantau tren trafik dan performa tombol di setiap halaman bio Anda.
            </p>
          </div>

          {pages.length > 0 && (
            <div className="flex items-center space-x-3">
              <span className="text-xs text-slate-400">Pilih Halaman:</span>
              <select
                value={selectedPageId}
                onChange={(e) => setSelectedPageId(e.target.value)}
                className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:border-indigo-500"
              >
                {pages.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title} (/b/{p.username})
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
                {dailyData.reduce((acc, curr) => acc + curr.clicks, 0)} <span className="text-xs text-slate-500 font-normal">klik</span>
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

      <footer className="text-center py-6 border-t border-slate-900 text-slate-600 text-sm">
        © 2026 KiluLink. All rights reserved.
      </footer>
    </div>
  );
}