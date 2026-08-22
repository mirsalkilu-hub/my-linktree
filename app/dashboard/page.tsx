"use client";
import { QRCodeSVG } from "qrcode.react";
import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { LogOut, Menu, X } from "lucide-react";

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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

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

  const totalClicks = links.reduce((acc, curr) => acc + (curr.clicks || 0), 0);

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans flex flex-col justify-between">
      {/* Header Sticky / Melayang */}
      <header className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-slate-800 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 flex items-center justify-between h-16">
          
          {/* Logo & Desktop Nav */}
          <div className="flex items-center space-x-8 h-full">
            <span className="text-xl sm:text-2xl font-black tracking-wider text-white shrink-0">
              mr<span className="text-indigo-500">.id</span>
            </span>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center space-x-8 h-full text-sm font-semibold">
              <Link
                href="/dashboard"
                className={`flex items-center h-full border-b-2 transition-all ${
                  pathname === "/dashboard"
                    ? "border-indigo-500 text-indigo-400 font-bold"
                    : "border-transparent text-slate-400 hover:text-slate-200"
                }`}
              >
                Dashboard
              </Link>
              <Link
                href="/dashboard/pages"
                className={`flex items-center h-full border-b-2 transition-all ${
                  pathname.startsWith("/dashboard/pages")
                    ? "border-indigo-500 text-indigo-400 font-bold"
                    : "border-transparent text-slate-400 hover:text-slate-200"
                }`}
              >
                Kelola Halaman
              </Link>
              <Link
                href="/dashboard/analytics"
                className={`flex items-center h-full border-b-2 transition-all ${
                  pathname.startsWith("/dashboard/analytics")
                    ? "border-indigo-500 text-indigo-400 font-bold"
                    : "border-transparent text-slate-400 hover:text-slate-200"
                }`}
              >
                Analytics
              </Link>
            </nav>
          </div>

          {/* Right Side: Desktop Profile/Logout + Mobile Hamburger Button */}
          <div className="flex items-center space-x-3">
            {/* User Profile Badge (Desktop) */}
            {user && (
              <div className="hidden sm:flex items-center space-x-2">
                <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-xs uppercase text-white shrink-0">
                  {user.email?.[0] || "M"}
                </div>
              </div>
            )}

            {/* Logout Button (Desktop) */}
            <button
              onClick={handleLogout}
              className="hidden md:flex items-center space-x-1.5 border border-red-600/80 bg-red-950/20 text-red-500 hover:bg-red-600 hover:text-white px-3 py-1.5 rounded-full text-xs font-bold transition-all"
            >
              <LogOut className="w-4 h-4" />
              <span>Keluar</span>
            </button>

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 focus:outline-none transition-all"
              aria-label="Toggle Menu"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-slate-900/95 border-b border-slate-800 backdrop-blur-xl px-4 pt-3 pb-6 space-y-3">
            <Link
              href="/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className={`block px-3 py-2 rounded-xl text-sm font-semibold transition-all ${
                pathname === "/dashboard"
                  ? "bg-indigo-600/20 text-indigo-400 border border-indigo-500/30"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              }`}
            >
              Dashboard
            </Link>
            <Link
              href="/dashboard/pages"
              onClick={() => setMobileMenuOpen(false)}
              className={`block px-3 py-2 rounded-xl text-sm font-semibold transition-all ${
                pathname.startsWith("/dashboard/pages")
                  ? "bg-indigo-600/20 text-indigo-400 border border-indigo-500/30"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              }`}
            >
              Kelola Halaman
            </Link>
            <Link
              href="/dashboard/analytics"
              onClick={() => setMobileMenuOpen(false)}
              className={`block px-3 py-2 rounded-xl text-sm font-semibold transition-all ${
                pathname.startsWith("/dashboard/analytics")
                  ? "bg-indigo-600/20 text-indigo-400 border border-indigo-500/30"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              }`}
            >
              Analytics
            </Link>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
              {user && (
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-xs uppercase text-white shrink-0">
                    {user.email?.[0] || "M"}
                  </div>
                  <span className="text-xs text-slate-300 truncate max-w-[150px]">
                    {user.email}
                  </span>
                </div>
              )}

              <button
                onClick={handleLogout}
                className="flex items-center space-x-1.5 border border-red-600/80 bg-red-950/20 text-red-500 hover:bg-red-600 hover:text-white px-3 py-1.5 rounded-full text-xs font-bold transition-all"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Keluar</span>
              </button>
            </div>
          </div>
        )}
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