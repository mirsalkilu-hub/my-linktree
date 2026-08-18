"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { ExternalLink, Sparkles } from "lucide-react";

interface BioProfile {
  id: string;
  username: string;
  title: string;
  bio_description?: string;
  avatar_url?: string;
  theme_color?: string;
}

interface BioLinkItem {
  id: string;
  title: string;
  url: string;
  icon_type?: string;
}

const THEME_STYLES: Record<string, { bg: string; cardBorder: string; buttonBg: string; buttonHover: string; glow: string }> = {
  indigo: {
    bg: "from-slate-950 via-indigo-950/50 to-slate-950",
    cardBorder: "border-indigo-500/20",
    buttonBg: "bg-indigo-600/90 hover:bg-indigo-500 border-indigo-400/30",
    buttonHover: "hover:shadow-indigo-500/30 hover:scale-[1.02]",
    glow: "shadow-indigo-500/10",
  },
  blue: {
    bg: "from-slate-950 via-blue-950/50 to-slate-950",
    cardBorder: "border-blue-500/20",
    buttonBg: "bg-blue-600/90 hover:bg-blue-500 border-blue-400/30",
    buttonHover: "hover:shadow-blue-500/30 hover:scale-[1.02]",
    glow: "shadow-blue-500/10",
  },
  emerald: {
    bg: "from-slate-950 via-emerald-950/50 to-slate-950",
    cardBorder: "border-emerald-500/20",
    buttonBg: "bg-emerald-600/90 hover:bg-emerald-500 border-emerald-400/30",
    buttonHover: "hover:shadow-emerald-500/30 hover:scale-[1.02]",
    glow: "shadow-emerald-500/10",
  },
  rose: {
    bg: "from-slate-950 via-rose-950/50 to-slate-950",
    cardBorder: "border-rose-500/20",
    buttonBg: "bg-rose-600/90 hover:bg-rose-500 border-rose-400/30",
    buttonHover: "hover:shadow-rose-500/30 hover:scale-[1.02]",
    glow: "shadow-rose-500/10",
  },
  amber: {
    bg: "from-slate-950 via-amber-950/50 to-slate-950",
    cardBorder: "border-amber-500/20",
    buttonBg: "bg-amber-600/90 hover:bg-amber-500 border-amber-400/30",
    buttonHover: "hover:shadow-amber-500/30 hover:scale-[1.02]",
    glow: "shadow-amber-500/10",
  },
  dark: {
    bg: "from-slate-950 via-slate-900 to-slate-950",
    cardBorder: "border-slate-800",
    buttonBg: "bg-slate-800/90 hover:bg-slate-700 border-slate-700",
    buttonHover: "hover:shadow-slate-500/10 hover:scale-[1.02]",
    glow: "shadow-slate-500/5",
  },
};

const ICON_MAP: Record<string, string> = {
  link: "🔗",
  whatsapp: "💬",
  instagram: "📷",
  youtube: "▶️",
  drive: "📁",
  globe: "🌐",
  email: "✉️",
  tiktok: "🎵",
};

export default function PublicBioPage() {
  const params = useParams();
  const username = params?.username as string;

  const [profile, setProfile] = useState<BioProfile | null>(null);
  const [links, setLinks] = useState<BioLinkItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (username) loadPageData();
  }, [username]);

  const loadPageData = async () => {
    setLoading(true);
    const { data: pageProfile } = await supabase
      .from("bio_profiles")
      .select("*")
      .eq("username", username.toLowerCase())
      .single();

    if (pageProfile) {
      setProfile(pageProfile);
      const { data: linkData } = await supabase
        .from("bio_links")
        .select("*")
        .eq("bio_id", pageProfile.id)
        .order("created_at", { ascending: true });

      setLinks(linkData || []);
    }
    setLoading(false);
  };

  const handleLinkClick = async (linkId: string, url: string) => {
    await supabase.rpc("increment_bio_link_click", {
      link_id: linkId,
      user_agent_input: typeof navigator !== "undefined" ? navigator.userAgent : "Unknown",
    });
    window.open(url, "_blank");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
        <p className="text-slate-400 text-xs mt-4 font-medium">Memuat Halaman mr.id...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center px-4 text-center">
        <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 text-2xl font-bold mb-4">
          ?
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Halaman Tidak Ditemukan</h1>
        <p className="text-slate-400 text-xs max-w-xs">
            URL /b/{username} belum terdaftar di mr.id.
        </p>
      </div>
    );
  }

  const currentTheme = THEME_STYLES[profile.theme_color || "indigo"] || THEME_STYLES.indigo;

  return (
    <div className={`min-h-screen bg-gradient-to-b ${currentTheme.bg} text-white font-sans flex flex-col justify-between items-center py-12 px-4 relative overflow-hidden`}>
      {/* Background Decorative Ambient Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md mx-auto flex flex-col items-center text-center z-10">
        {/* Avatar Profil dengan Efek Ring Glow */}
        <div className="relative mb-5 group">
          <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full blur opacity-50 group-hover:opacity-80 transition duration-300"></div>
          {profile.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt={profile.title}
              className="relative w-24 h-24 rounded-full object-cover border-2 border-white/30 shadow-2xl"
            />
          ) : (
            <div className="relative w-24 h-24 rounded-full bg-slate-900 border-2 border-white/30 flex items-center justify-center text-3xl font-black text-indigo-400 shadow-2xl">
              {profile.title[0]?.toUpperCase()}
            </div>
          )}
        </div>

        {/* Title & Badge */}
        <div className="flex items-center space-x-1.5 bg-slate-900/80 border border-slate-800 px-3 py-1 rounded-full text-[11px] text-indigo-300 font-medium mb-3">
          <Sparkles className="w-3 h-3 text-indigo-400" />
          <span>@{profile.username}</span>
        </div>

        <h1 className="text-2xl font-black tracking-tight text-white mb-2">{profile.title}</h1>

        {profile.bio_description && (
          <p className="text-xs text-slate-300/90 max-w-sm mb-8 leading-relaxed font-normal">
            {profile.bio_description}
          </p>
        )}

        {/* List Tombol Link */}
        <div className="w-full space-y-3.5 mt-1">
          {links.map((link) => {
            const icon = ICON_MAP[link.icon_type || "link"] || "🔗";
            return (
              <button
                key={link.id}
                onClick={() => handleLinkClick(link.id, link.url)}
                className={`w-full py-4 px-5 rounded-2xl font-semibold text-sm transition-all duration-300 shadow-xl border flex items-center justify-between group active:scale-[0.98] ${currentTheme.buttonBg} ${currentTheme.buttonHover}`}
              >
                <span className="text-xl group-hover:scale-110 transition-transform">{icon}</span>
                <span className="flex-1 text-center truncate px-3 font-bold">{link.title}</span>
                <ExternalLink className="w-4 h-4 opacity-50 group-hover:opacity-100 transition-opacity" />
              </button>
            );
          })}
        </div>
      </div>

      {/* Footer Branding KiluLink */}
      {/* Footer Branding mr.id */}
      <footer className="mt-14 text-center z-10">
        <a
          href="/"
          target="_blank"
          className="inline-flex items-center space-x-2 text-[11px] font-bold text-slate-500 hover:text-slate-300 transition-all tracking-wider px-4 py-2 rounded-xl bg-slate-900/50 border border-slate-800/80 backdrop-blur-md"
        >
          <span>POWERED BY</span>
          <span className="gradient-text font-black text-xs">mr.id</span>
        </a>
      </footer>
    </div>
  );
}