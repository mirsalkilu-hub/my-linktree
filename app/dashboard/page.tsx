
"use client";
import { QRCodeSVG } from "qrcode.react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link"; // <-- Tambahkan baris ini jika belum ada!
import { supabase } from "@/lib/supabase";

interface LinkItem {
  id: string;
  original_url: string;
  short_code: string;
  clicks: number;
  created_at: string;
}

export default function DashboardPage() {
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [destinationUrl, setDestinationUrl] = useState("");
  const [customCode, setCustomCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    fetchUserAndLinks();
  }, []);

  const fetchUserAndLinks = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push("/login");
      return;
    }
    setUser(user);

    const { data } = await supabase
      .from("links")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (data) setLinks(data);
  };

  const handleCreateLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!destinationUrl) return;

    setLoading(true);

    const formattedUrl = destinationUrl.startsWith("http")
      ? destinationUrl
      : `https://${destinationUrl}`;

    const slug = customCode.trim() || Math.random().toString(36).substring(2, 7);

    const { error } = await supabase.from("links").insert([
      {
        original_url: formattedUrl,
        short_code: slug,
        user_id: user.id,
      },
    ]);

    if (error) {
      alert("Gagal membuat link: " + error.message);
    } else {
      setDestinationUrl("");
      setCustomCode("");
      fetchUserAndLinks();
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Yakin ingin menghapus link ini?")) return;
    await supabase.from("links").delete().eq("id", id);
    fetchUserAndLinks();
  };

  const copyToClipboard = (url: string) => {
    navigator.clipboard.writeText(url);
    alert("Link berhasil disalin!");
  };

  // Fungsi untuk mengunduh QR Code sebagai file PNG
  const downloadQRCode = (id: string, shortCode: string) => {
    const svgElement = document.getElementById(`qr-${id}`) as SVGSVGElement | null;
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
        downloadLink.download = `qrcode-${shortCode}.png`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
      }
    };
    image.src = blobURL;
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  // Total statistik seluruh klik
  const totalClicks = links.reduce((acc, curr) => acc + (curr.clicks || 0), 0);

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans flex flex-col justify-between">
     {/* Header */}
      <header className="flex items-center justify-between px-8 py-5 border-b border-slate-800">
        <div className="flex items-center space-x-6">
          <span className="text-2xl font-black tracking-wider text-indigo-500">
            mr.<span className="text-white">id</span>
          </span>

          {/* Menu Navigasi tambahkan di sini */}
          <nav className="flex space-x-4 text-sm font-semibold ml-4">
            <span className="text-indigo-400 border-b-2 border-indigo-500 pb-1 cursor-default">
              Dashboard Link
            </span>
          <Link
  href="/dashboard/bio"
  className="text-slate-400 hover:text-white transition-all pb-1"
>
  Kelola Halaman
</Link>
          </nav>
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-sm">
              {user?.email?.[0].toUpperCase() || "U"}
            </div>
            <span className="text-sm font-medium text-slate-300">
              {user?.user_metadata?.full_name || user?.email}
            </span>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 transition-all border border-slate-700"
          >
            Keluar
          </button>
        </div>
      </header>

      {/* Konten Utama */}
      <main className="max-w-4xl mx-auto px-6 py-10 w-full flex-1">
        
        {/* Ringkasan Analitik */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col justify-between">
            <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">
              Total Tautan
            </span>
            <span className="text-3xl font-extrabold text-indigo-400 mt-2">
              {links.length}
            </span>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col justify-between">
            <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">
              Total Klik Diterima
            </span>
            <span className="text-3xl font-extrabold text-pink-400 mt-2">
              {totalClicks}
            </span>
          </div>
        </div>

        {/* Form Buat Link Baru */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl mb-10">
          <h2 className="text-xl font-bold mb-1">Buat Short Link Baru</h2>
          <p className="text-slate-400 text-sm mb-6">
            Masukkan URL tujuan Anda dan tentukan kode kustom jika diinginkan.
          </p>

          <form onSubmit={handleCreateLink} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                URL Asli (Destination URL)
              </label>
              <input
                type="text"
                required
                placeholder="https://youtube.com/c/kilu or https://mywebsite.com"
                value={destinationUrl}
                onChange={(e) => setDestinationUrl(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Custom Short Code (Opsional)
              </label>
              <input
                type="text"
                placeholder="custom-code"
                value={customCode}
                onChange={(e) => setCustomCode(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 rounded-xl transition-all shadow-lg"
            >
              {loading ? "Memproses..." : "Pendekkan Link"}
            </button>
          </form>
        </div>

        {/* Daftar Link Anda */}
        <h3 className="text-lg font-bold mb-4">
          Daftar Link Anda ({links.length})
        </h3>

        <div className="space-y-4">
          {links.map((item) => {
            const shortUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/s/${item.short_code}`;

            return (
              <div
                key={item.id}
                className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4"
              >
                {/* QR Code Container */}
                <div className="flex flex-col items-center gap-2 flex-shrink-0">
                  <div className="bg-white p-2 rounded-xl">
                    <QRCodeSVG id={`qr-${item.id}`} value={shortUrl} size={64} />
                  </div>
                  <button
                    onClick={() => downloadQRCode(item.id, item.short_code)}
                    className="text-[10px] text-indigo-400 hover:underline font-semibold"
                  >
                    Unduh PNG
                  </button>
                </div>

                {/* Detail URL & Statistik Klik */}
                <div className="flex-1 w-full overflow-hidden text-left">
                  <div className="flex items-center gap-2">
                    <a
                      href={shortUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-indigo-400 font-bold hover:underline text-base truncate block"
                    >
                      {shortUrl}
                    </a>
                    <span className="bg-indigo-950 border border-indigo-500/30 text-indigo-300 text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap">
                      {item.clicks || 0} Klik
                    </span>
                  </div>
                  <p className="text-slate-400 text-xs truncate mt-1">
                    {item.original_url}
                  </p>
                </div>

                {/* Tombol Aksi */}
                <div className="flex items-center space-x-2 flex-shrink-0">
                  <button
                    onClick={() => copyToClipboard(shortUrl)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition-all"
                  >
                    Salin Link
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="px-4 py-2 bg-red-950/40 hover:bg-red-900/60 text-red-400 border border-red-500/20 rounded-xl text-xs font-semibold transition-all"
                  >
                    Hapus
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center py-6 border-t border-slate-900 text-slate-600 text-xs">
  © 2026 mr.id. All rights reserved.
</footer>
    </div>
  );
}