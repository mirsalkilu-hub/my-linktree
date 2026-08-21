"use client";

import { useEffect, useState, use } from "react";
import { supabase } from "@/lib/supabase";
import { notFound, useRouter } from "next/navigation";
import LinkIcon from "@/components/LinkIcon";

// Dynamic Theme Presets
const THEME_PRESETS: Record<
  string,
  {
    avatarGlow: string;
    avatarBorder: string;
    badgeBg: string;
    badgeText: string;
    cardBorder: string;
    buttonBorder: string;
    buttonHover: string;
  }
> = {
  indigo: {
    avatarGlow: "shadow-[0_0_35px_rgba(99,102,241,0.6)]",
    avatarBorder: "border-indigo-500",
    badgeBg: "bg-indigo-950/70 border-indigo-500/40",
    badgeText: "text-indigo-300",
    cardBorder: "border-indigo-500/20",
    buttonBorder: "border-indigo-500/20 hover:border-indigo-500/60",
    buttonHover: "hover:bg-indigo-950/30",
  },
  blue: {
    avatarGlow: "shadow-[0_0_35px_rgba(59,130,246,0.6)]",
    avatarBorder: "border-blue-500",
    badgeBg: "bg-blue-950/70 border-blue-500/40",
    badgeText: "text-blue-300",
    cardBorder: "border-blue-500/20",
    buttonBorder: "border-blue-500/20 hover:border-blue-500/60",
    buttonHover: "hover:bg-blue-950/30",
  },
  emerald: {
    avatarGlow: "shadow-[0_0_35px_rgba(16,185,129,0.6)]",
    avatarBorder: "border-emerald-500",
    badgeBg: "bg-emerald-950/70 border-emerald-500/40",
    badgeText: "text-emerald-300",
    cardBorder: "border-emerald-500/20",
    buttonBorder: "border-emerald-500/20 hover:border-emerald-500/60",
    buttonHover: "hover:bg-emerald-950/30",
  },
  rose: {
    avatarGlow: "shadow-[0_0_35px_rgba(244,63,94,0.6)]",
    avatarBorder: "border-rose-500",
    badgeBg: "bg-rose-950/70 border-rose-500/40",
    badgeText: "text-rose-300",
    cardBorder: "border-rose-500/20",
    buttonBorder: "border-rose-500/20 hover:border-rose-500/60",
    buttonHover: "hover:bg-rose-950/30",
  },
  amber: {
    avatarGlow: "shadow-[0_0_35px_rgba(245,158,11,0.6)]",
    avatarBorder: "border-amber-500",
    badgeBg: "bg-amber-950/70 border-amber-500/40",
    badgeText: "text-amber-300",
    cardBorder: "border-amber-500/20",
    buttonBorder: "border-amber-500/20 hover:border-amber-500/60",
    buttonHover: "hover:bg-amber-950/30",
  },
  dark: {
    avatarGlow: "shadow-[0_0_35px_rgba(148,163,184,0.3)]",
    avatarBorder: "border-slate-500",
    badgeBg: "bg-slate-900 border-slate-700",
    badgeText: "text-slate-300",
    cardBorder: "border-slate-800",
    buttonBorder: "border-slate-800 hover:border-slate-600",
    buttonHover: "hover:bg-slate-900",
  },
};

export default function PublicBioPage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = use(params);
  const router = useRouter();

  const [profile, setProfile] = useState<any>(null);
  const [links, setLinks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function fetchData() {
      // Fetch Profile
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

      // Fetch Links
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
      <div className="min-h-screen bg-[#060913] text-white flex items-center justify-center p-4">
        <div className="animate-pulse text-sm text-slate-400">Loading...</div>
      </div>
    );
  }

  if (!profile) {
    notFound();
  }

  const theme = THEME_PRESETS[profile.theme_color || "indigo"] || THEME_PRESETS.indigo;
  const currentUrl = typeof window !== "undefined" ? window.location.href : "";

  const handleShareClick = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: profile.title,
          text: `Cek bio link dari @${profile.username}`,
          url: currentUrl,
        });
        return;
      } catch (err) {
        // user membatalkan share
      }
    }
    setIsShareOpen(true);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(currentUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareItems = [
    {
      name: "WhatsApp",
      color: "bg-emerald-600 hover:bg-emerald-500",
      url: `https://api.whatsapp.com/send?text=${encodeURIComponent(`Cek bio link @${profile.username}: ${currentUrl}`)}`,
      icon: "💬",
    },
    {
      name: "Telegram",
      color: "bg-sky-500 hover:bg-sky-400",
      url: `https://t.me/share/url?url=${encodeURIComponent(currentUrl)}&text=${encodeURIComponent(profile.title)}`,
      icon: "✈️",
    },
    {
      name: "X / Twitter",
      color: "bg-zinc-800 hover:bg-zinc-700",
      url: `https://twitter.com/intent/tweet?url=${encodeURIComponent(currentUrl)}&text=${encodeURIComponent(`Cek bio link @${profile.username}`)}`,
      icon: "𝕏",
    },
    {
      name: "Facebook",
      color: "bg-blue-600 hover:bg-blue-500",
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentUrl)}`,
      icon: "📘",
    },
  ];

  // Penyesuaian fleksibel ukuran font berdasarkan panjang teks judul
  const titleLength = profile.title?.length || 0;
  const titleSizeClass =
    titleLength > 35
      ? "text-base sm:text-lg"
      : titleLength > 20
      ? "text-lg sm:text-xl"
      : "text-xl sm:text-2xl";

  return (
    <div className="min-h-screen bg-[#060913] text-white flex items-center justify-center p-4 font-sans">
      
      {/* Container Kartu Utama */}
      <div className={`w-full max-w-md bg-[#0b0f19] border ${theme.cardBorder} rounded-[32px] p-8 relative flex flex-col items-center text-center shadow-2xl`}>
        
        {/* Tombol Home di Pojok Kiri Atas */}
        <button
          onClick={() => router.push("/")}
          className="absolute top-6 left-6 w-10 h-10 rounded-full bg-[#131927] hover:bg-[#1a2336] border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition-all duration-200"
          title="Kembali ke Beranda"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 00-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
        </button>

        {/* Tombol Share di Pojok Kanan Atas */}
        <button
          onClick={handleShareClick}
          className="absolute top-6 right-6 w-10 h-10 rounded-full bg-[#131927] hover:bg-[#1a2336] border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition-all duration-200"
          title="Bagikan Halaman"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684" />
          </svg>
        </button>

        {/* Foto Profil dengan Glow */}
        <div className="mt-2 mb-4 relative">
          {profile.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt={profile.title}
              className={`w-28 h-28 rounded-full object-cover border-2 ${theme.avatarBorder} ${theme.avatarGlow} transition-all duration-300`}
            />
          ) : (
            <div className={`w-28 h-28 rounded-full bg-slate-900 border-2 ${theme.avatarBorder} ${theme.avatarGlow} flex items-center justify-center text-3xl font-black`}>
              {profile.title[0]?.toUpperCase()}
            </div>
          )}
        </div>

        {/* Badge @Username */}
        <div className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${theme.badgeBg} ${theme.badgeText} mb-4`}>
          <span>✨</span>
          <span>@{profile.username}</span>
        </div>

        {/* Judul dengan Penyesuaian Otomatis */}
        <h1
          className={`${titleSizeClass} font-black uppercase tracking-wider text-white mb-1 leading-snug break-words max-w-xs sm:max-w-sm`}
        >
          {profile.title}
        </h1>

        {profile.bio_description && (
          <p className="text-xs text-slate-400 mb-8 font-medium max-w-xs leading-relaxed">
            {profile.bio_description}
          </p>
        )}

        {/* List Tombol Link */}
        <div className="w-full space-y-3.5 mb-8">
          {links && links.length > 0 ? (
            links.map((link) => (
              <a
                key={link.id}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`w-full h-14 bg-[#111726]/80 hover:bg-[#161e31] border ${theme.buttonBorder} ${theme.buttonHover} rounded-2xl px-5 flex items-center justify-between transition-all duration-200 group`}
              >
                {/* Ikon Kiri */}
                <div className="w-6 h-6 flex items-center justify-center shrink-0">
                  <LinkIcon type={link.icon_type} className="w-5 h-5" />
                </div>

                {/* Judul Tombol Tengah */}
                <span className="font-extrabold text-xs sm:text-sm tracking-wider uppercase text-white truncate mx-2">
                  {link.title}
                </span>

                {/* Ikon External Link Kanan */}
                <div className="w-6 h-6 flex items-center justify-center shrink-0 text-slate-500 group-hover:text-slate-300">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </div>
              </a>
            ))
          ) : (
            <div className="p-4 bg-[#111726] border border-slate-800 rounded-xl text-xs text-slate-500">
              Belum ada link
            </div>
          )}
        </div>

        {/* Separator Line & Footer */}
        <div className="w-full border-t border-slate-800/60 pt-6 flex justify-center">
          <div className="inline-block bg-[#111726] border border-slate-800 px-5 py-2 rounded-full text-[10px] font-bold tracking-widest text-slate-400">
            Powered By <span className="text-indigo-400">mr.id</span>
          </div>
        </div>

      </div>

      {/* Modal Popup Share Ke Sosmed */}
      {isShareOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#0b0f19] border border-slate-800 rounded-3xl p-6 w-full max-w-sm text-center relative shadow-2xl">
            <button
              onClick={() => setIsShareOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white text-base p-1"
            >
              ✕
            </button>

            <h3 className="text-lg font-extrabold text-white mb-1">Bagikan Profil</h3>
            <p className="text-xs text-slate-400 mb-6">Pilih media sosial untuk membagikan halaman ini</p>

            {/* Grid Tombol Sosmed */}
            <div className="grid grid-cols-2 gap-3 mb-5">
              {shareItems.map((item) => (
                <a
                  key={item.name}
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`p-3 rounded-2xl text-white font-bold text-xs flex items-center justify-center space-x-2 transition-all ${item.color}`}
                >
                  <span>{item.icon}</span>
                  <span>{item.name}</span>
                </a>
              ))}
            </div>

            {/* Copy Link Input */}
            <div className="flex items-center bg-[#111726] border border-slate-800 rounded-2xl p-2">
              <input
                type="text"
                readOnly
                value={currentUrl}
                className="bg-transparent text-xs text-slate-300 px-2 w-full focus:outline-none truncate"
              />
              <button
                onClick={handleCopy}
                className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-3 py-2 rounded-xl transition-all shrink-0"
              >
                {copied ? "Tersalin!" : "Salin"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}