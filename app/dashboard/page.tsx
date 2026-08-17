"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface LinkItem {
  id: string;
  original_url: string;
  short_code: string;
  clicks: number;
  created_at: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [urlInput, setUrlInput] = useState("");
  const [customCode, setCustomCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push("/login");
      return;
    }
    setUser(user);
    fetchLinks(user.id);
    setLoading(false);
  };

  const fetchLinks = async (userId: string) => {
    const { data, error } = await supabase
      .from("links")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setLinks(data);
    }
  };

  const handleCreateLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput) return;

    setSubmitting(true);
    setErrorMsg("");

    // Generasi kode acak 6 karakter jika custom code kosong
    const code = customCode.trim() || Math.random().toString(36).substring(2, 8);

    const { data, error } = await supabase.from("links").insert([
      {
        user_id: user.id,
        original_url: urlInput.startsWith("http") ? urlInput : `https://${urlInput}`,
        short_code: code,
      },
    ]).select();

    if (error) {
      if (error.code === "23505") {
        setErrorMsg("Kode pendek tersebut sudah digunakan. Gunakan kode lain!");
      } else {
        setErrorMsg("Gagal membuat link: " + error.message);
      }
    } else if (data) {
      setLinks([data[0], ...links]);
      setUrlInput("");
      setCustomCode("");
    }
    setSubmitting(false);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("links").delete().eq("id", id);
    if (!error) {
      setLinks(links.filter((l) => l.id !== id));
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <p className="text-slate-400 animate-pulse">Memuat dashboard...</p>
      </div>
    );
  }

  const domain = typeof window !== "undefined" ? window.location.origin : "";

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/50">
        <Link href="/" className="text-2xl font-black text-indigo-500 tracking-wider">
          KILU<span className="text-white">LINK</span>
        </Link>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            {user?.user_metadata?.avatar_url && (
              <img
                src={user.user_metadata.avatar_url}
                alt="Avatar"
                className="w-9 h-9 rounded-full border border-indigo-500"
              />
            )}
            <span className="text-sm font-medium text-slate-300 hidden sm:inline">
              {user?.user_metadata?.full_name || user?.email}
            </span>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-red-600/80 text-xs font-semibold transition-all"
          >
            Keluar
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-10">
        {/* Form Pembuat Link */}
        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl mb-10">
          <h2 className="text-xl font-bold mb-1 text-white">Buat Short Link Baru</h2>
          <p className="text-slate-400 text-sm mb-6">
            Masukkan URL tujuan Anda dan tentukan kode kustom jika diinginkan.
          </p>

          <form onSubmit={handleCreateLink} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                URL Asli (Destination URL)
              </label>
              <input
                type="text"
                placeholder="https://youtube.com/c/kilu or https://mywebsite.com"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                Custom Short Code (Opsional)
              </label>
              <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-400">
                <span className="mr-1">{domain}/s/</span>
                <input
                  type="text"
                  placeholder="custom-code"
                  value={customCode}
                  onChange={(e) => setCustomCode(e.target.value)}
                  className="bg-transparent text-white focus:outline-none w-full"
                />
              </div>
            </div>

            {errorMsg && <p className="text-red-400 text-xs">{errorMsg}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-indigo-600 hover:bg-indigo-500 font-semibold py-3 px-4 rounded-xl text-sm transition-all shadow-lg"
            >
              {submitting ? "Membuat Short Link..." : "Pendekkan Link"}
            </button>
          </form>
        </section>

        {/* Daftar Link Milik User */}
        <section>
          <h3 className="text-lg font-bold mb-4">Daftar Link Anda ({links.length})</h3>

          {links.length === 0 ? (
            <div className="text-center py-12 bg-slate-900/40 border border-slate-800/80 rounded-2xl">
              <p className="text-slate-500 text-sm">Belum ada short link yang dibuat.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {links.map((link) => {
                const shortUrl = `${domain}/s/${link.short_code}`;
                return (
                  <div
                    key={link.id}
                    className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="overflow-hidden">
                      <a
                        href={shortUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-indigo-400 font-bold hover:underline text-base block truncate"
                      >
                        {shortUrl}
                      </a>
                      <p className="text-slate-400 text-xs truncate mt-0.5">
                        {link.original_url}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <button
                        onClick={() => navigator.clipboard.writeText(shortUrl)}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs rounded-lg text-slate-300 transition-all"
                      >
                        Salin Link
                      </button>
                      <button
                        onClick={() => handleDelete(link.id)}
                        className="px-3 py-1.5 bg-red-950/40 hover:bg-red-900/60 border border-red-800/40 text-xs rounded-lg text-red-300 transition-all"
                      >
                        Hapus
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}