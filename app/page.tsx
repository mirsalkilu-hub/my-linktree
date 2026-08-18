"use client";

import { useState } from "react";
import Link from "next/link";
import { supabase } from "../lib/supabase";

export default function HomePage() {
  const [longUrl, setLongUrl] = useState("");
  const [shortUrl, setShortUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleShorten = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!longUrl) return;

    setIsLoading(true);
    setErrorMessage("");
    setShortUrl("");

    // 1. Cek user yang sedang login (jika ada)
    const { data: { user } } = await supabase.auth.getUser();

    // 2. Buat kode acak 5 karakter untuk link pendek
    const slug = Math.random().toString(36).substring(2, 7);

    // 3. Simpan ke Supabase (menggunakan nama variabel longUrl & slug)
    const { data, error } = await supabase.from("links").insert([
      {
        original_url: longUrl.startsWith("http") ? longUrl : `https://${longUrl}`,
        short_code: slug,
        user_id: user ? user.id : null, // opsional untuk guest
      },
    ]).select();

    if (error) {
      console.error(error);
      setErrorMessage("Gagal menyimpan link. Silakan coba lagi.");
    } else if (data) {
      const domain = window.location.origin;
      setShortUrl(`${domain}/s/${slug}`);
      setLongUrl("");
    }

    setIsLoading(false);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shortUrl);
    alert("Link pendek berhasil disalin!");
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans flex flex-col justify-between">
      {/* Header / Navbar */}
      <header className="flex items-center justify-between px-8 py-5 border-b border-slate-800">
        <div className="flex items-center space-x-2">
          <span className="text-2xl font-black tracking-wider text-indigo-500">
            KILU<span className="text-white">LINK</span>
          </span>
        </div>

        {/* Tombol Navigasi */}
        <div className="flex items-center space-x-4">
          <Link
            href="/dashboard"
            className="px-5 py-2.5 rounded-xl border border-slate-700 font-semibold text-slate-300 hover:text-white hover:border-slate-500 transition-all"
          >
            Dashboard
          </Link>
          <Link
            href="/login"
            className="px-5 py-2.5 rounded-xl bg-indigo-600 font-semibold text-white hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-600/30"
          >
            Masuk / Daftar
          </Link>
        </div>
      </header>

      {/* Konten Utama */}
      <main className="max-w-4xl mx-auto px-6 py-16 text-center flex-1 flex flex-col justify-center items-center">
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-tight">
          Persingkat Link Panjang <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-pink-500">
            Dalam Hitungan Detik.
          </span>
        </h1>
        <p className="mt-4 text-slate-400 text-lg max-w-xl">
          Buat tautan yang lebih rapi, profesional, dan mudah dibagikan ke mana saja.
        </p>

        {/* Form Pemotong URL */}
        <form
          onSubmit={handleShorten}
          className="w-full max-w-2xl mt-8 flex flex-col sm:flex-row gap-3 bg-slate-900 p-2 rounded-2xl border border-slate-800 shadow-2xl"
        >
          <input
            type="url"
            required
            placeholder="Tempelkan URL panjang di sini (https://...)"
            value={longUrl}
            onChange={(e) => setLongUrl(e.target.value)}
            className="flex-1 bg-transparent px-5 py-3.5 text-white placeholder-slate-500 border-none outline-none focus:ring-0 text-base"
          />
          <button
            type="submit"
            disabled={isLoading}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-8 py-3.5 rounded-xl transition-all disabled:opacity-50 whitespace-nowrap shadow-md"
          >
            {isLoading ? "Memproses..." : "Create Link"}
          </button>
        </form>

        {/* Pesan Error */}
        {errorMessage && (
          <p className="mt-4 text-red-400 text-sm font-medium">{errorMessage}</p>
        )}

        {/* Output Link Pendek */}
        {shortUrl && (
          <div className="w-full max-w-2xl mt-6 p-4 bg-indigo-950/40 border border-indigo-500/30 rounded-2xl flex items-center justify-between">
            <span className="text-indigo-300 font-medium text-lg">{shortUrl}</span>
            <button
              onClick={copyToClipboard}
              className="bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 border border-indigo-500/30 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
            >
              Salin Link
            </button>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="text-center py-6 border-t border-slate-900 text-slate-600 text-sm">
        © 2026 KiluLink. All rights reserved.
      </footer>
    </div>
  );
}