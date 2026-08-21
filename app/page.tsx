"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import { supabase } from "../lib/supabase";

export default function HomePage() {
  const [longUrl, setLongUrl] = useState("");
  const [shortUrl, setShortUrl] = useState("");
  const [slugCode, setSlugCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [copied, setCopied] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.push("/dashboard");
      }
    };
    checkUser();
  }, [router]);

  const handleShorten = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!longUrl) return;

    setIsLoading(true);
    setErrorMessage("");
    setShortUrl("");

    const { data: { user } } = await supabase.auth.getUser();
    const slug = Math.random().toString(36).substring(2, 7);

    const { data, error } = await supabase.from("links").insert([
      {
        original_url: longUrl.startsWith("http") ? longUrl : `https://${longUrl}`,
        short_code: slug,
        user_id: user ? user.id : null,
      },
    ]).select();

    if (error) {
      console.error(error);
      setErrorMessage("Gagal menyimpan link. Silakan coba lagi.");
    } else if (data) {
      const domain = window.location.origin;
      setShortUrl(`${domain}/s/${slug}`);
      setSlugCode(slug);
      setLongUrl("");
    }

    setIsLoading(false);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shortUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadQRCode = () => {
    const svgElement = document.getElementById("qr-code-home") as SVGSVGElement | null;
    if (!svgElement) return;

    const svgData = new XMLSerializer().serializeToString(svgElement);
    const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const URLObject = window.URL || window.webkitURL || window;
    const blobURL = URLObject.createObjectURL(svgBlob);

    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 256;
      canvas.height = 256;
      const context = canvas.getContext("2d");
      if (context) {
        context.fillStyle = "#FFFFFF";
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.drawImage(image, 0, 0, canvas.width, canvas.height);

        const png = canvas.toDataURL("image/png");
        const downloadLink = document.createElement("a");
        downloadLink.href = png;
        downloadLink.download = `qrcode-${slugCode || "mrid"}.png`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
      }
    };
    image.src = blobURL;
  };

  return (
    <div className="min-h-screen bg-[#070913] text-white font-sans flex flex-col justify-between relative overflow-hidden">
      {/* Ambient Glow Background Effect */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-indigo-600/15 blur-[140px] rounded-full pointer-events-none" />
      <div className="absolute top-1/2 left-1/3 w-[300px] h-[200px] bg-purple-600/10 blur-[100px] rounded-full pointer-events-none" />

      {/* Header / Navbar */}
      <header className="relative z-10 flex items-center justify-between px-8 py-6 max-w-7xl mx-auto w-full">
        <span className="text-2xl font-black tracking-wider text-white">
          mr<span className="text-indigo-500">.id</span>
        </span>

        <Link
          href="/login"
          className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-lg shadow-indigo-600/20 active:scale-95"
        >
          Masuk / Daftar
        </Link>
      </header>

      {/* Main Hero Section */}
      <main className="relative z-10 max-w-4xl mx-auto px-6 py-12 text-center flex-1 flex flex-col items-center justify-center">
        {/* Badge Indicator */}
        <div className="inline-flex items-center space-x-2 bg-indigo-950/60 border border-indigo-500/30 text-indigo-300 px-4 py-1.5 rounded-full text-xs font-medium mb-6 backdrop-blur-md">
          <span className="flex h-2 w-2 rounded-full bg-indigo-400 animate-pulse" />
          <span>Platform Pemendek Link & Halaman Bio Modern</span>
        </div>

        {/* Headline */}
        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight leading-tight mb-4">
          Persingkat Link Panjang <br />
          <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-500 bg-clip-text text-transparent">
            Dalam Hitungan Detik.
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-slate-400 text-sm sm:text-base max-w-2xl mb-8 leading-relaxed">
          Buat tautan yang lebih rapi, profesional, dan mudah dibagikan ke mana saja.
        </p>

        {/* Shortener Form */}
        <div className="w-full max-w-2xl bg-slate-900/80 border border-slate-800 p-2.5 rounded-2xl shadow-2xl backdrop-blur-xl focus-within:border-indigo-500/80 transition-all mb-4">
          <form onSubmit={handleShorten} className="flex flex-col sm:flex-row items-center gap-2">
            <div className="flex items-center space-x-3 px-3 w-full">
              <svg className="w-5 h-5 text-slate-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              <input
                type="url"
                required
                placeholder="Tempelkan URL panjang di sini (https://...)"
                value={longUrl}
                onChange={(e) => setLongUrl(e.target.value)}
                className="w-full bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none py-2"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs sm:text-sm px-6 py-3 rounded-xl transition-all whitespace-nowrap shadow-lg shadow-indigo-600/30 active:scale-95 shrink-0 disabled:opacity-50"
            >
              {isLoading ? "Memproses..." : "Persingkat 🚀"}
            </button>
          </form>
        </div>

        {/* Error Message */}
        {errorMessage && (
          <p className="text-red-400 text-xs font-medium mb-4">{errorMessage}</p>
        )}

        {/* Output Box + QR Code & Actions */}
        {shortUrl && (
          <div className="w-full max-w-2xl bg-indigo-950/40 border border-indigo-500/30 p-5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-6 mb-8 text-left">
            <div className="flex-1 w-full flex flex-col gap-2">
              <span className="text-[10px] text-indigo-300 font-medium uppercase tracking-wider">
                Link Pendek Anda:
              </span>
              <a
                href={shortUrl}
                target="_blank"
                rel="noreferrer"
                className="text-base font-bold text-white hover:underline break-all"
              >
                {shortUrl}
              </a>
              <button
                onClick={copyToClipboard}
                className="w-fit bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 border border-indigo-500/30 px-4 py-2 rounded-xl text-xs font-semibold transition-all mt-1"
              >
                {copied ? "✅ Tersalin!" : "📋 Salin Link"}
              </button>
            </div>

            {/* QR Code Block */}
            <div className="flex flex-col items-center gap-2 shrink-0">
              <div className="bg-white p-2.5 rounded-xl shadow-md">
                <QRCodeSVG id="qr-code-home" value={shortUrl} size={100} />
              </div>
              <button
                onClick={downloadQRCode}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold transition-colors"
              >
                Unduh PNG
              </button>
            </div>
          </div>
        )}

        {/* Quick Features */}
        <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-slate-500 mt-2">
          <span className="flex items-center space-x-1">
            <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
            <span>Tanpa Iklan Spam</span>
          </span>
          <span className="flex items-center space-x-1">
            <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
            <span>Analitik Statistik Real-time</span>
          </span>
          <span className="flex items-center space-x-1">
            <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
            <span>QR Code Otomatis</span>
          </span>
        </div>
      </main>

      {/* Feature Cards Section */}
      <section className="relative z-10 max-w-5xl mx-auto px-6 py-10 w-full">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-900/50 border border-slate-800/80 p-5 rounded-2xl backdrop-blur-md">
            <div className="w-9 h-9 bg-indigo-600/20 text-indigo-400 rounded-xl flex items-center justify-center font-bold text-base mb-3">🔗</div>
            <h3 className="font-semibold text-sm mb-1">URL Shortener</h3>
            <p className="text-xs text-slate-400 leading-relaxed">Ubah tautan panjang dan rumit menjadi tautan ringkas yang mudah diingat.</p>
          </div>
          <div className="bg-slate-900/50 border border-slate-800/80 p-5 rounded-2xl backdrop-blur-md">
            <div className="w-9 h-9 bg-purple-600/20 text-purple-400 rounded-xl flex items-center justify-center font-bold text-base mb-3">📱</div>
            <h3 className="font-semibold text-sm mb-1">Kelola Halaman Bio</h3>
            <p className="text-xs text-slate-400 leading-relaxed">Buat landing page biolink pribadi untuk menyatukan semua sosmed Anda.</p>
          </div>
          <div className="bg-slate-900/50 border border-slate-800/80 p-5 rounded-2xl backdrop-blur-md">
            <div className="w-9 h-9 bg-pink-600/20 text-pink-400 rounded-xl flex items-center justify-center font-bold text-base mb-3">📊</div>
            <h3 className="font-semibold text-sm mb-1">Grafik Analitik</h3>
            <p className="text-xs text-slate-400 leading-relaxed">Pantau perkembangan performa jumlah klik link Anda secara akurat.</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 text-center py-6 border-t border-slate-900/80 text-slate-600 text-xs">
        © 2026 mr.id. All rights reserved.
      </footer>
    </div>
  );
}