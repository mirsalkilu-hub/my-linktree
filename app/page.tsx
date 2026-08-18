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
    alert("Link pendek berhasil disalin!");
  };

  // Fungsi untuk mengunduh QR Code sebagai PNG
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
        downloadLink.download = `qrcode-${slugCode || "kilulink"}.png`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
      }
    };
    image.src = blobURL;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans flex flex-col justify-between">
      {/* Header / Navbar */}
      <header className="flex items-center justify-between px-8 py-5 border-b border-slate-800">
        <div className="flex items-center space-x-2">
          <span className="text-2xl font-black tracking-wider text-white">
            mr<span className="text-indigo-500">.id</span>
          </span>
        </div>

        <div className="flex items-center space-x-4">
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

        {/* Output Link Pendek + QR Code & Tombol Unduh */}
        {shortUrl && (
          <div className="w-full max-w-2xl mt-6 p-6 bg-indigo-950/40 border border-indigo-500/30 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-6">
            
            {/* Bagian QR Code & Tombol Unduh */}
            <div className="flex flex-col items-center gap-2 flex-shrink-0">
              <div className="bg-white p-3 rounded-xl shadow-lg">
                <QRCodeSVG id="qr-code-home" value={shortUrl} size={110} />
              </div>
              <button
                onClick={downloadQRCode}
                className="text-xs text-indigo-400 hover:underline font-semibold"
              >
                Unduh PNG
              </button>
            </div>

            {/* Teks URL & Tombol Salin */}
            <div className="flex-1 w-full text-left flex flex-col gap-3">
              <span className="text-indigo-300 font-semibold text-lg break-all">
                {shortUrl}
              </span>
              <button
                onClick={copyToClipboard}
                className="w-fit bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 border border-indigo-500/30 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all"
              >
                Salin Link
              </button>
            </div>

          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="text-center py-6 border-t border-slate-900 text-slate-600 text-xs">
        © 2026 mr.id. All rights reserved.
      </footer>
    </div>
  );
}