"use client";

import { useEffect, useState } from "react";
import { useParams, notFound } from "next/navigation";
import { supabase } from "@/lib/supabase";
import LinkIcon from "@/components/LinkIcon";
import { ExternalLink, Sparkles } from "lucide-react";

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

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070b14] flex items-center justify-center text-slate-500 text-sm">
        Memuat...
      </div>
    );
  }

  if (!profile) {
    return notFound();
  }

  return (
    <div className="min-h-screen bg-[#060813] text-white flex flex-col items-center justify-between p-6 select-none">
      <main className="max-w-md w-full flex flex-col items-center pt-10">
        
        {/* Avatar dengan Glow Effect Purple */}
        <div className="relative mb-5 group">
          <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 opacity-70 blur-md group-hover:opacity-100 transition duration-300"></div>
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
        <div className="flex items-center gap-1.5 bg-[#0f152a] border border-slate-800 text-indigo-300 px-3 py-1 rounded-full text-xs font-medium mb-4 shadow-inner">
          <Sparkles className="w-3 h-3 text-indigo-400" />
          <span>@{profile.username}</span>
        </div>

        {/* Judul & Subtitle */}
        <h1 className="text-xl font-extrabold text-center text-white tracking-wide uppercase">
          {profile.title}
        </h1>
        {profile.bio_description && (
          <p className="text-xs text-slate-400 text-center mt-1.5 font-normal">
            {profile.bio_description}
          </p>
        )}

        {/* Tombol Link (Sama persis seperti desain gambar) */}
        <div className="w-full mt-8 space-y-3.5">
          {links.length > 0 ? (
            links.map((link) => (
              <button
                key={link.id}
                onClick={() => handleLinkClick(link.id, link.clicks || 0, link.url)}
                className="relative w-full bg-[#111728]/90 hover:bg-[#161f36] border border-slate-800/80 hover:border-slate-700/80 px-5 py-4 rounded-2xl flex items-center justify-between transition-all duration-200 group shadow-md"
              >
                {/* Left Side: Icon dari LinkIcon */}
                <div className="w-6 flex justify-start text-slate-300 group-hover:text-white transition-colors">
                  <LinkIcon type={link.icon_type} className="w-5 h-5" />
                </div>

                {/* Center Side: Title */}
                <span className="font-bold text-xs uppercase tracking-wider text-slate-100 group-hover:text-white text-center flex-1 mx-2 truncate">
                  {link.title}
                </span>

                {/* Right Side: External Link Icon */}
                <div className="w-6 flex justify-end text-slate-500 group-hover:text-slate-300 transition-colors">
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
      </main>

      {/* Footer Pill */}
      <footer className="py-6">
        <div className="bg-[#0b0f1d] border border-slate-800/80 text-slate-400 text-[10px] font-bold px-4 py-1.5 rounded-full tracking-widest uppercase">
          POWERED BY <span className="text-indigo-400">mr.id</span>
        </div>
      </footer>
    </div>
  );
}