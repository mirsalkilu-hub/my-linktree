"use client";

import { useEffect, useState, use } from "react";
import { supabase } from "@/lib/supabase";
import { notFound, useRouter } from "next/navigation";
import LinkIcon from "@/components/LinkIcon";

// Interface Data
interface LinkItem {
  id: string;
  title: string;
  url: string;
  icon_type: string;
  is_featured?: boolean;
}

interface BioProfile {
  id: string;
  username: string;
  title: string;
  bio_description?: string;
  avatar_url?: string;
  theme_color?: string;
  status_text?: string;
}

// Configuration Preset Tema Visual
const THEME_PRESETS: Record<
  string,
  {
    avatarGlow: string;
    avatarBorder: string;
    badgeBg: string;
    badgeText: string;
    cardBorder: string;
    accentColor: string;
    buttonStyle: React.CSSProperties;
    buttonHoverClass: string;
  }
> = {
  indigo: {
    avatarGlow: "shadow-[0_0_50px_rgba(99,102,241,0.4)]",
    avatarBorder: "border-indigo-500",
    badgeBg: "bg-indigo-500/10 border-indigo-500/30",
    badgeText: "text-indigo-300",
    cardBorder: "border-indigo-500/30 shadow-[0_0_60px_-15px_rgba(99,102,241,0.25)]",
    accentColor: "#6366f1",
    buttonStyle: {
      borderColor: "rgba(99, 102, 241, 0.25)",
      backgroundColor: "rgba(15, 23, 42, 0.6)",
    },
    buttonHoverClass: "hover:border-indigo-400 hover:shadow-[0_10px_25px_-5px_rgba(99,102,241,0.3)]",
  },
  blue: {
    avatarGlow: "shadow-[0_0_50px_rgba(59,130,246,0.4)]",
    avatarBorder: "border-blue-500",
    badgeBg: "bg-blue-500/10 border-blue-500/30",
    badgeText: "text-blue-300",
    cardBorder: "border-blue-500/30 shadow-[0_0_60px_-15px_rgba(59,130,246,0.25)]",
    accentColor: "#3b82f6",
    buttonStyle: {
      borderColor: "rgba(59, 130, 246, 0.25)",
      backgroundColor: "rgba(15, 23, 42, 0.6)",
    },
    buttonHoverClass: "hover:border-blue-400 hover:shadow-[0_10px_25px_-5px_rgba(59,130,246,0.3)]",
  },
  emerald: {
    avatarGlow: "shadow-[0_0_50px_rgba(16,185,129,0.4)]",
    avatarBorder: "border-emerald-500",
    badgeBg: "bg-emerald-500/10 border-emerald-500/30",
    badgeText: "text-emerald-300",
    cardBorder: "border-emerald-500/30 shadow-[0_0_60px_-15px_rgba(16,185,129,0.25)]",
    accentColor: "#10b981",
    buttonStyle: {
      borderColor: "rgba(16, 185, 129, 0.25)",
      backgroundColor: "rgba(15, 23, 42, 0.6)",
    },
    buttonHoverClass: "hover:border-emerald-400 hover:shadow-[0_10px_25px_-5px_rgba(16,185,129,0.3)]",
  },
  rose: {
    avatarGlow: "shadow-[0_0_50px_rgba(244,63,94,0.4)]",
    avatarBorder: "border-rose-500",
    badgeBg: "bg-rose-500/10 border-rose-500/30",
    badgeText: "text-rose-300",
    cardBorder: "border-rose-500/30 shadow-[0_0_60px_-15px_rgba(244,63,94,0.25)]",
    accentColor: "#f43f5e",
    buttonStyle: {
      borderColor: "rgba(244, 63, 94, 0.25)",
      backgroundColor: "rgba(15, 23, 42, 0.6)",
    },
    buttonHoverClass: "hover:border-rose-400 hover:shadow-[0_10px_25px_-5px_rgba(244,63,94,0.3)]",
  },
  amber: {
    avatarGlow: "shadow-[0_0_50px_rgba(245,158,11,0.4)]",
    avatarBorder: "border-amber-500",
    badgeBg: "bg-amber-500/10 border-amber-500/30",
    badgeText: "text-amber-300",
    cardBorder: "border-amber-500/30 shadow-[0_0_60px_-15px_rgba(245,158,11,0.25)]",
    accentColor: "#f59e0b",
    buttonStyle: {
      borderColor: "rgba(245, 158, 11, 0.25)",
      backgroundColor: "rgba(15, 23, 42, 0.6)",
    },
    buttonHoverClass: "hover:border-amber-400 hover:shadow-[0_10px_25px_-5px_rgba(245,158,11,0.3)]",
  },
  dark: {
    avatarGlow: "shadow-[0_0_50px_rgba(255,255,255,0.1)]",
    avatarBorder: "border-slate-500",
    badgeBg: "bg-slate-800/80 border-slate-700",
    badgeText: "text-slate-300",
    cardBorder: "border-slate-800 shadow-[0_0_60px_-15px_rgba(0,0,0,0.8)]",
    accentColor: "#94a3b8",
    buttonStyle: {
      borderColor: "rgba(51, 65, 85, 0.8)",
      backgroundColor: "rgba(15, 23, 42, 0.8)",
    },
    buttonHoverClass: "hover:border-slate-500 hover:shadow-[0_10px_25px_-5px_rgba(0,0,0,0.5)]",
  },
};

export default function PublicBioPage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = use(params);
  const router = useRouter();

  const [profile, setProfile] = useState<BioProfile | null>(null);
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    async function fetchData() {
      const { data: profData } = await supabase
        .from("bio_profiles")
        .select("*")
        .eq("username", username)
        .maybeSingle();

      if (!profData) {
        setLoading(false);
        return;
      }

      setProfile(profData);

      const { data: linkData } = await supabase
        .from("bio_links")
        .select("*")
        .eq("bio_id", profData.id)
        .order("created_at", { ascending: true });

      setLinks(linkData || []);
      setLoading(false);
    }

    fetchData();
  }, [username]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#030712] text-white flex items-center justify-center p-4">
        <div className="animate-pulse flex items-center gap-3 text-sm text-slate-400 font-semibold tracking-wider">
          <div className="w-3 h-3 rounded-full bg-indigo-500 animate-ping" />
          MEMUAT PROFIL...
        </div>
      </div>
    );
  }

  if (!profile) {
    notFound();
  }

  const theme = THEME_PRESETS[profile.theme_color || "indigo"] || THEME_PRESETS.indigo;
  const currentUrl = typeof window !== "undefined" ? window.location.href : "";

  const triggerToast = () => {
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2500);
  };

  const handleShareClick = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: profile.title,
          text: `Lihat link bio dari @${profile.username}`,
          url: currentUrl,
        });
        return;
      } catch (err) {
        // User cancel
      }
    }
    setIsShareOpen(true);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(currentUrl);
    triggerToast();
  };

  const shareItems = [
    {
      name: "WhatsApp",
      style: { background: "linear-gradient(135deg, #059669, #0d9488)" },
      url: `https://api.whatsapp.com/send?text=${encodeURIComponent(`Cek bio link @${profile.username}: ${currentUrl}`)}`,
      icon: "💬",
    },
    {
      name: "Telegram",
      style: { background: "linear-gradient(135deg, #0284c7, #2563eb)" },
      url: `https://t.me/share/url?url=${encodeURIComponent(currentUrl)}&text=${encodeURIComponent(profile.title)}`,
      icon: "✈️",
    },
    {
      name: "X / Twitter",
      style: { background: "linear-gradient(135deg, #18181b, #27272a)", border: "1px solid rgba(255,255,255,0.15)" },
      url: `https://twitter.com/intent/tweet?url=${encodeURIComponent(currentUrl)}&text=${encodeURIComponent(`Cek bio link @${profile.username}`)}`,
      icon: "𝕏",
    },
    {
      name: "Facebook",
      style: { background: "linear-gradient(135deg, #2563eb, #4338ca)" },
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentUrl)}`,
      icon: "📘",
    },
  ];

  return (
    <div className="min-h-screen bg-[#030712] text-white flex items-center justify-center p-4 sm:p-6 font-sans relative overflow-hidden selection:bg-indigo-500 selection:text-white">
      
      {/* Background Ambient Blur Dynamic */}
      <div 
        className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] rounded-full blur-[140px] opacity-20 pointer-events-none transition-all duration-700"
        style={{ backgroundColor: theme.accentColor }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:20px_20px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_70%,transparent_100%)] opacity-30 pointer-events-none" />

      {/* Toast Notification */}
      <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 transition-all duration-500 transform ${showToast ? "translate-y-0 opacity-100" : "-translate-y-8 opacity-0 pointer-events-none"}`}>
        <div className="bg-slate-900/90 border border-emerald-500/40 text-emerald-300 text-xs font-bold px-5 py-2.5 rounded-full shadow-2xl backdrop-blur-xl flex items-center space-x-2">
          <span>✨</span>
          <span>Tautan berhasil tersalin!</span>
        </div>
      </div>

      {/* Main Container Card */}
      <div className={`w-full max-w-md bg-slate-900/40 border ${theme.cardBorder} rounded-[36px] p-6 sm:p-8 relative flex flex-col items-center text-center backdrop-blur-2xl transition-all duration-500 z-10`}>
        
        {/* Top Glow Border Light */}
        <div className="absolute inset-x-12 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/30 to-transparent" />

        {/* Home Button */}
        <button
          onClick={() => router.push("/")}
          className="absolute top-6 left-6 w-11 h-11 rounded-2xl bg-slate-950/60 hover:bg-white/10 border border-white/10 hover:border-white/30 flex items-center justify-center text-slate-400 hover:text-white transition-all duration-300 hover:scale-105 active:scale-95 shadow-md backdrop-blur-md group"
          title="Beranda"
        >
          <svg className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 00-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
        </button>

        {/* Share Button */}
        <button
          onClick={handleShareClick}
          className="absolute top-6 right-6 w-11 h-11 rounded-2xl bg-slate-950/60 hover:bg-white/10 border border-white/10 hover:border-white/30 flex items-center justify-center text-slate-400 hover:text-white transition-all duration-300 hover:scale-105 active:scale-95 shadow-md backdrop-blur-md group"
          title="Bagikan Halaman"
        >
          <svg className="w-4 h-4 group-hover:rotate-12 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684" />
          </svg>
        </button>

        {/* Avatar Profil dengan Glow & Ring */}
        <div className="mt-3 mb-4 relative group">
          <div className="absolute -inset-0.5 rounded-full blur opacity-75 group-hover:opacity-100 transition duration-500" style={{ backgroundColor: theme.accentColor }} />
          {profile.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt={profile.title}
              className={`relative w-28 h-28 rounded-full object-cover border-2 ${theme.avatarBorder} ${theme.avatarGlow} transition-all duration-500 group-hover:scale-105`}
            />
          ) : (
            <div className={`relative w-28 h-28 rounded-full bg-slate-950 border-2 ${theme.avatarBorder} ${theme.avatarGlow} flex items-center justify-center text-3xl font-black text-white transition-all duration-500 group-hover:scale-105`}>
              {profile.title[0]?.toUpperCase()}
            </div>
          )}
        </div>

        {/* Live Status Indicator & Badge Username */}
        <div className="flex flex-col items-center gap-2 mb-3">
          <div className={`inline-flex items-center space-x-2 px-3.5 py-1 rounded-full text-xs font-semibold border backdrop-blur-md ${theme.badgeBg} ${theme.badgeText} shadow-sm`}>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span>@{profile.username}</span>
          </div>

          {profile.status_text && (
            <p className="text-[11px] font-medium text-slate-400 tracking-wide uppercase">
              {profile.status_text}
            </p>
          )}
        </div>

        {/* Title / Name */}
        <h1 className="text-xl sm:text-2xl font-black uppercase tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-slate-400 mb-1 leading-snug break-words max-w-xs">
          {profile.title}
        </h1>

        {/* Bio Description */}
        {profile.bio_description && (
          <p className="text-xs text-slate-400 mb-7 font-medium max-w-xs leading-relaxed uppercase tracking-widest">
            {profile.bio_description}
          </p>
        )}

        {/* List Link Buttons */}
        <div className="w-full space-y-3.5 mb-8">
          {links && links.length > 0 ? (
            links.map((link) => {
              const isFeatured = link.is_featured;

              return (
                <a
                  key={link.id}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={isFeatured ? { borderColor: theme.accentColor } : theme.buttonStyle}
                  className={`w-full py-4 px-5 rounded-2xl border flex items-center justify-between transition-all duration-300 hover:-translate-y-1 active:translate-y-0 group relative overflow-hidden backdrop-blur-xl ${
                    isFeatured
                      ? "bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 shadow-[0_0_25px_-5px_rgba(99,102,241,0.4)]"
                      : theme.buttonHoverClass
                  }`}
                >
                  {/* Light Sweep Animation */}
                  <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-1000 ease-in-out pointer-events-none" />

                  {/* Badge Highlight / Featured */}
                  {isFeatured && (
                    <div className="absolute top-0 right-0 bg-indigo-500 text-[9px] font-black tracking-widest text-white px-2.5 py-0.5 rounded-bl-lg uppercase shadow-sm">
                      Featured
                    </div>
                  )}

                  {/* Icon Left */}
                  <div className="w-10 h-10 rounded-xl bg-slate-950 border border-white/10 flex items-center justify-center shrink-0 text-slate-300 group-hover:text-white group-hover:border-white/30 group-hover:scale-105 transition-all duration-300 z-10">
                    <LinkIcon type={link.icon_type} className="w-5 h-5" />
                  </div>

                  {/* Title Button */}
                  <span className="font-extrabold text-xs sm:text-sm tracking-wider uppercase text-slate-200 group-hover:text-white truncate mx-3 transition-colors z-10">
                    {link.title}
                  </span>

                  {/* Arrow Icon Right */}
                  <div className="w-8 h-8 rounded-lg bg-white/5 group-hover:bg-white/15 border border-transparent group-hover:border-white/20 flex items-center justify-center shrink-0 text-slate-400 group-hover:text-white group-hover:translate-x-1 transition-all duration-300 z-10">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </a>
              );
            })
          ) : (
            <div className="p-5 bg-white/[0.02] border border-white/10 rounded-2xl text-xs text-slate-500 font-medium">
              Belum ada tautan yang ditambahkan.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="w-full border-t border-white/10 pt-5 flex justify-center">
          <div className="inline-flex items-center space-x-2 bg-white/[0.02] border border-white/10 hover:border-indigo-500/40 px-4 py-1.5 rounded-full text-[10px] font-bold tracking-widest text-slate-400 transition-colors">
            <span>Powered By</span>
            <span className="text-indigo-400 font-black">urlyu.com</span>
          </div>
        </div>

      </div>

      {/* Share Modal Dialog */}
      {isShareOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-slate-900/90 border border-white/10 rounded-3xl p-6 w-full max-w-sm text-center relative shadow-2xl backdrop-blur-2xl">
            <button
              onClick={() => setIsShareOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white text-sm p-1.5 rounded-full hover:bg-white/10 transition-all"
            >
              ✕
            </button>

            <h3 className="text-base font-extrabold text-white mb-1 tracking-wider uppercase">Bagikan Profil</h3>
            <p className="text-xs text-slate-400 mb-5">Pilih platform untuk membagikan tautan ini</p>

            <div className="grid grid-cols-2 gap-3 mb-5">
              {shareItems.map((item) => (
                <a
                  key={item.name}
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={item.style}
                  className="p-3.5 rounded-2xl text-white font-extrabold text-xs flex items-center justify-center space-x-2 shadow-md transition-all duration-300 hover:scale-105 active:scale-95"
                >
                  <span className="text-sm">{item.icon}</span>
                  <span>{item.name}</span>
                </a>
              ))}
            </div>

            <div className="flex items-center bg-slate-950/90 border border-white/10 rounded-2xl p-1.5 shadow-inner">
              <input
                type="text"
                readOnly
                value={currentUrl}
                className="bg-transparent text-xs text-slate-300 px-3 w-full focus:outline-none truncate"
              />
              <button
                onClick={handleCopy}
                style={{ backgroundColor: theme.accentColor }}
                className="text-white text-xs font-black px-4 py-2.5 rounded-xl transition-all duration-200 active:scale-95 shadow-md shrink-0"
              >
                Salin
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}