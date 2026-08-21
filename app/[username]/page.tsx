"use client";

import { useEffect, useState } from "react";
import { useParams, notFound } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import LinkIcon from "@/components/LinkIcon";
import { ExternalLink, Share2, Copy, Check, Sparkles, X, ArrowLeft } from "lucide-react";

interface BioProfile {
  id: string;
  username: string;
  title: string;
  bio_description?: string;
  avatar_url?: string;
}

interface BioLinkItem {
  id: string;
  title: string;
  url: string;
  icon_type?: string;
  clicks?: number;
}

export default function PublicBioPage() {
  const params = useParams();
  const username = params?.username as string;

  const [profile, setProfile] = useState<BioProfile | null>(null);
  const [links, setLinks] = useState<BioLinkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showShareModal, setShowShareModal] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (username) {
      loadBioData();
    }
  }, [username]);

  const loadBioData = async () => {
    try {
      const { data: profileData, error: profileError } = await supabase
        .from("bio_profiles")
        .select("*")
        .eq("username", username)
        .single();

      if (profileError || !profileData) {
        setLoading(false);
        return;
      }

      setProfile(profileData);

      const { data: linkData } = await supabase
        .from("bio_links")
        .select("*")
        .eq("bio_id", profileData.id)
        .order("created_at", { ascending: true });

      setLinks(linkData || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLinkClick = async (linkId: string, currentClicks: number, url: string) => {
    await supabase
      .from("bio_links")
      .update({ clicks: (currentClicks || 0) + 1 })
      .eq("id", linkId);

    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: profile?.title || "Bio Link",
          text: profile?.bio_description || "Kunjungi link bio saya",
          url: window.location.href,
        });
      } catch (err) {
        console.error("Error sharing:", err);
      }
    } else {
      setShowShareModal(true);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#060813] flex items-center justify-center text-slate-500 text-sm">
        Memuat...
      </div>
    );
  }

  if (!profile) {
    return notFound();
  }

  const currentUrl = typeof window !== "undefined" ? window.location.href : "";

  return (
    <div className="min-h-screen bg-[#04060c] text-white flex items-center justify-center p-4 sm:p-6 select-none">
      {/* Card Utama */}
      <div className="relative max-w-md w-full bg-[#080d1a] border border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col items-center my-auto">
        
        {/* Tombol Kembali ke Halaman Utama (Kiri Atas) */}
        <Link
          href="/"
          className="absolute top-5 left-5 w-10 h-10 rounded-full bg-[#111728] border border-slate-800 hover:border-slate-700 flex items-center justify-center text-slate-300 hover:text-white transition-all shadow-md active:scale-95"
          title="Kembali ke Utama"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>

        {/* Tombol Bagikan (Kanan Atas) */}
        <button
          onClick={handleNativeShare}
          className="absolute top-5 right-5 w-10 h-10 rounded-full bg-[#111728] border border-slate-800 hover:border-slate-700 flex items-center justify-center text-slate-300 hover:text-white transition-all shadow-md active:scale-95"
          title="Bagikan Halaman"
        >
          <Share2 className="w-4 h-4" />
        </button>

        {/* Header Profil & Avatar */}
        <div className="flex flex-col items-center w-full mt-2">
          {/* Avatar dengan Glow Purple */}
          <div className="relative mb-4 group">
            <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 opacity-70 blur-md"></div>
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={profile.title}
                className="relative w-24 h-24 rounded-full object-cover border-2 border-purple-400/50"
              />
            ) : (
              <div className="relative w-24 h-24 rounded-full bg-indigo-900 border-2 border-purple-400/50 flex items-center justify-center text-white font-bold text-2xl">
                {profile.title?.[0]?.toUpperCase()}
              </div>
            )}
          </div>

          {/* Badge @username */}
          <div className="flex items-center gap-1.5 bg-[#0f152a] border border-slate-800 text-indigo-300 px-3 py-1 rounded-full text-xs font-medium mb-3 shadow-inner">
            <Sparkles className="w-3 h-3 text-indigo-400" />
            <span>@{profile.username}</span>
          </div>

          {/* Judul Halaman Responsive */}
          <h1 className="text-lg sm:text-xl font-extrabold text-center text-white tracking-wide uppercase px-2 leading-snug break-words w-full">
            {profile.title}
          </h1>

          {/* Deskripsi */}
          {profile.bio_description && (
            <p className="text-xs text-slate-400 text-center mt-2 font-normal max-w-xs leading-relaxed break-words">
              {profile.bio_description}
            </p>
          )}
        </div>

        {/* Daftar Tombol Link */}
        <div className="w-full mt-8 space-y-3.5">
          {links.length > 0 ? (
            links.map((link) => (
              <button
                key={link.id}
                onClick={() => handleLinkClick(link.id, link.clicks || 0, link.url)}
                className="relative w-full bg-[#111728]/90 hover:bg-[#161f36] border border-slate-800/80 hover:border-slate-700/80 px-4 py-4 rounded-2xl flex items-center justify-between transition-all duration-200 group shadow-md gap-3"
              >
                {/* Ikon Kiri */}
                <div className="w-6 flex justify-start text-slate-300 group-hover:text-white transition-colors shrink-0">
                  <LinkIcon type={link.icon_type} className="w-5 h-5" />
                </div>

                {/* Judul Link */}
                <span className="font-bold text-xs uppercase tracking-wider text-slate-100 group-hover:text-white text-center flex-1 leading-normal break-words">
                  {link.title}
                </span>

                {/* Ikon Panah Eksternal */}
                <div className="w-6 flex justify-end text-slate-500 group-hover:text-slate-300 transition-colors shrink-0">
                  <ExternalLink className="w-4 h-4" />
                </div>
              </button>
            ))
          ) : (
            <p className="text-center text-slate-600 text-xs py-4">
              Belum ada link yang ditambahkan.
            </p>
          )}
        </div>

        {/* Footer Pill */}
        <div className="mt-8 pt-4 border-t border-slate-800/60 w-full flex justify-center">
          <div className="bg-[#0b0f1d] border border-slate-800/80 text-slate-400 text-[10px] font-bold px-4 py-1.5 rounded-full tracking-widest uppercase">
            POWERED BY <span className="text-indigo-400">mr.id</span>
          </div>
        </div>
      </div>

      {/* Modal Share */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#111728] border border-slate-800 rounded-2xl p-6 max-w-sm w-full relative shadow-2xl animate-in fade-in zoom-in-95">
            <button
              onClick={() => setShowShareModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-white mb-1">Bagikan Halaman</h3>
            <p className="text-xs text-slate-400 mb-5">
              Salin link atau bagikan langsung ke media sosial.
            </p>

            <div className="flex items-center gap-2 bg-[#080d1a] border border-slate-800 rounded-xl p-2 mb-5">
              <input
                type="text"
                readOnly
                value={currentUrl}
                className="bg-transparent text-xs text-slate-300 px-2 flex-1 outline-none truncate"
              />
              <button
                onClick={handleCopyLink}
                className="bg-indigo-600 hover:bg-indigo-500 text-white p-2 rounded-lg text-xs font-semibold flex items-center gap-1 shrink-0 transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? "Tersalin" : "Salin"}</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <a
                href={`https://api.whatsapp.com/send?text=${encodeURIComponent(currentUrl)}`}
                target="_blank"
                rel="noreferrer"
                className="bg-[#25D366]/10 hover:bg-[#25D366]/20 border border-[#25D366]/30 text-[#25D366] py-2.5 rounded-xl font-medium text-center transition-colors"
              >
                WhatsApp
              </a>
              <a
                href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(currentUrl)}`}
                target="_blank"
                rel="noreferrer"
                className="bg-[#1DA1F2]/10 hover:bg-[#1DA1F2]/20 border border-[#1DA1F2]/30 text-[#1DA1F2] py-2.5 rounded-xl font-medium text-center transition-colors"
              >
                X / Twitter
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}