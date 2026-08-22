"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import toast from "react-hot-toast";
import ConfirmModal from "@/components/ConfirmModal";
import LinkIcon from "@/components/LinkIcon";
import IconSelect from "@/components/IconSelect";
import { LogOut, Menu, X } from "lucide-react";

interface BioProfile {
  id: string;
  username: string;
  title: string;
  bio_description?: string;
  avatar_url?: string;
  theme_color?: string;
  created_at: string;
}

interface BioLinkItem {
  id: string;
  title: string;
  url: string;
  icon_type?: string;
  clicks?: number;
}

const THEME_OPTIONS = [
  { id: "indigo", name: "Indigo Modern", color: "#6366f1", borderClass: "border-indigo-500" },
  { id: "blue", name: "Ocean Blue", color: "#3b82f6", borderClass: "border-blue-500" },
  { id: "emerald", name: "Emerald Green", color: "#10b981", borderClass: "border-emerald-500" },
  { id: "rose", name: "Rose Pink", color: "#f43f5e", borderClass: "border-rose-500" },
  { id: "amber", name: "Warm Amber", color: "#f59e0b", borderClass: "border-amber-500" },
  { id: "dark", name: "Dark Minimalist", color: "#334155", borderClass: "border-slate-500" },
];

export default function BioManagementPage() {
  const [user, setUser] = useState<any>(null);
  const [pages, setPages] = useState<BioProfile[]>([]);
  const [selectedPage, setSelectedPage] = useState<BioProfile | null>(null);

  // Form State Halaman
  const [username, setUsername] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [themeColor, setThemeColor] = useState("indigo");

  // Links State
  const [links, setLinks] = useState<BioLinkItem[]>([]);
  const [newLinkTitle, setNewLinkTitle] = useState("");
  const [newLinkUrl, setNewLinkUrl] = useState("");
  const [newIconType, setNewIconType] = useState("link");

  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [origin, setOrigin] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Confirm Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pageToDelete, setPageToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const router = useRouter();
  const pathname = usePathname();

  const resetFormToNew = useCallback(() => {
    setSelectedPage(null);
    setIsCreatingNew(true);
    setUsername("");
    setTitle("");
    setDescription("");
    setAvatarUrl("");
    setThemeColor("indigo");
    setLinks([]);
  }, []);

  const handleSelectPage = useCallback(async (page: BioProfile) => {
    setSelectedPage(page);
    setIsCreatingNew(false);
    setUsername(page.username || "");
    setTitle(page.title || "");
    setDescription(page.bio_description || "");
    setAvatarUrl(page.avatar_url || "");
    setThemeColor(page.theme_color || "indigo");

    const { data: linkData, error } = await supabase
      .from("bio_links")
      .select("*")
      .eq("bio_id", page.id)
      .order("created_at", { ascending: true });

    if (error) {
      toast.error("Gagal memuat link: " + error.message);
    } else {
      setLinks(linkData || []);
    }
  }, []);

  const loadUserPages = useCallback(async () => {
    setPageLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push("/login");
      return;
    }

    setUser(user);

    const { data: profiles, error } = await supabase
      .from("bio_profiles")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Gagal memuat daftar halaman.");
    } else if (profiles && profiles.length > 0) {
      setPages(profiles);
      if (!selectedPage || !profiles.some((p) => p.id === selectedPage.id)) {
        await handleSelectPage(profiles[0]);
      }
    } else {
      setPages([]);
      resetFormToNew();
    }
    setPageLoading(false);
  }, [router, selectedPage, handleSelectPage, resetFormToNew]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setOrigin(window.location.origin);
    }
    loadUserPages();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      if (!event.target.files || event.target.files.length === 0) return;

      const file = event.target.files[0];
      const validTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
      if (!validTypes.includes(file.type)) {
        toast.error("Format file harus berupa PNG, JPG, JPEG, atau WEBP");
        return;
      }

      if (file.size > 2 * 1024 * 1024) {
        toast.error("Ukuran file maksimal adalah 2MB");
        return;
      }

      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(fileName, file, { cacheControl: "3600", upsert: false });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from("avatars").getPublicUrl(fileName);
      setAvatarUrl(data.publicUrl);
      toast.success("Foto berhasil diunggah!");
    } catch (error: any) {
      toast.error("Gagal mengunggah foto: " + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSavePage = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    const cleanUsername = username.toLowerCase().trim().replace(/[^a-z0-9_-]/g, "");
    if (!cleanUsername) {
      toast.error("Username/Slug tidak boleh kosong!");
      setLoading(false);
      return;
    }

    const payload = {
      user_id: user.id,
      username: cleanUsername,
      title: title.trim(),
      bio_description: description.trim(),
      avatar_url: avatarUrl,
      theme_color: themeColor,
    };

    if (selectedPage) {
      const { error } = await supabase
        .from("bio_profiles")
        .update(payload)
        .eq("id", selectedPage.id);

      if (error) {
        toast.error("Gagal memperbarui halaman: " + error.message);
      } else {
        toast.success("Halaman berhasil diperbarui!");
        await loadUserPages();
      }
    } else {
      const { data, error } = await supabase
        .from("bio_profiles")
        .insert([payload])
        .select()
        .single();

      if (error) {
        toast.error("Gagal membuat halaman: " + error.message);
      } else if (data) {
        toast.success("Halaman baru berhasil dibuat!");
        await loadUserPages();
        await handleSelectPage(data);
      }
    }

    setLoading(false);
  };

  const openDeleteModal = (pageId: string) => {
    setPageToDelete(pageId);
    setIsModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!pageToDelete) return;

    setIsDeleting(true);
    const { error } = await supabase.from("bio_profiles").delete().eq("id", pageToDelete);

    if (error) {
      toast.error("Gagal menghapus halaman: " + error.message);
    } else {
      toast.success("Halaman berhasil dihapus!");
      if (selectedPage?.id === pageToDelete) {
        resetFormToNew();
      }
      await loadUserPages();
    }

    setIsDeleting(false);
    setIsModalOpen(false);
    setPageToDelete(null);
  };

  const sanitizeUrl = (inputUrl: string) => {
    let formatted = inputUrl.trim();
    if (!/^https?:\/\//i.test(formatted)) {
      formatted = `https://${formatted}`;
    }
    return formatted;
  };

  const handleAddLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPage) {
      toast.error("Simpan atau pilih halaman terlebih dahulu!");
      return;
    }
    if (!newLinkTitle.trim() || !newLinkUrl.trim()) return;

    const formattedUrl = sanitizeUrl(newLinkUrl);

    const { data, error } = await supabase
      .from("bio_links")
      .insert([
        {
          bio_id: selectedPage.id,
          title: newLinkTitle.trim(),
          url: formattedUrl,
          icon_type: newIconType,
          clicks: 0,
        },
      ])
      .select()
      .single();

    if (error) {
      toast.error("Gagal menambahkan link: " + error.message);
    } else if (data) {
      setLinks((prev) => [...prev, data]);
      setNewLinkTitle("");
      setNewLinkUrl("");
      setNewIconType("link");
      toast.success("Link berhasil ditambahkan!");
    }
  };

  const handleDeleteLink = async (id: string) => {
    const { error } = await supabase.from("bio_links").delete().eq("id", id);
    if (error) {
      toast.error("Gagal menghapus link: " + error.message);
    } else {
      setLinks((prev) => prev.filter((l) => l.id !== id));
      toast.success("Link berhasil dihapus!");
    }
  };

  const bioPageUrl = username && origin ? `${origin}/${username}` : "";
  const totalPageClicks = links.reduce((sum, link) => sum + (link.clicks || 0), 0);

  if (pageLoading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans flex flex-col justify-between">
      {/* Header Navigasi */}
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
  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-300 bg-slate-900/50 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 rounded-full transition-all duration-200"
>
  <LogOut className="w-4 h-4 text-slate-400" />
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

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10 w-full flex-1">
        {/* Header Judul Halaman */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">Kelola Halaman Bio Anda</h1>
            <p className="text-xs text-slate-400 mt-1">
              Buat dan kustomisasi halaman landing/bio lengkap dengan analisis klik.
            </p>
          </div>
          <button
            onClick={resetFormToNew}
            className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4 py-3 rounded-xl transition-all text-center shrink-0"
          >
            + Buat Halaman Baru
          </button>
        </div>

        {/* List Halaman */}
        {pages.length > 0 && (
          <div className="mb-6 sm:mb-8">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
              Daftar Halaman Anda ({pages.length})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {pages.map((page) => {
                const isSelected = selectedPage?.id === page.id && !isCreatingNew;
                return (
                  <div
                    key={page.id}
                    onClick={() => handleSelectPage(page)}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                      isSelected
                        ? "bg-indigo-950/50 border-indigo-500"
                        : "bg-slate-900 border-slate-800 hover:border-slate-700"
                    }`}
                  >
                    <div>
                      <div className="flex items-center space-x-3 mb-2">
                        {page.avatar_url ? (
                          <img
                            src={page.avatar_url}
                            alt={page.title}
                            className="w-8 h-8 rounded-full object-cover shrink-0"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-indigo-600/30 flex items-center justify-center text-indigo-400 font-bold text-xs shrink-0">
                            {page.title[0]?.toUpperCase() || "P"}
                          </div>
                        )}
                        <h4 className="font-bold text-sm truncate">{page.title}</h4>
                      </div>
                      <p className="text-xs text-indigo-400 truncate">/{page.username}</p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-800/80 flex justify-between items-center text-xs">
                      <span className="text-slate-500">
                        {isSelected ? "Sedang Diedit" : "Klik untuk Edit"}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openDeleteModal(page.id);
                        }}
                        className="text-red-400 hover:underline"
                      >
                        Hapus
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Banner URL Publik & Quick Actions */}
        {selectedPage && !isCreatingNew && username && (
          <div className="mb-6 sm:mb-8 p-4 bg-indigo-950/40 border border-indigo-500/30 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="min-w-0 flex-1">
              <span className="text-xs text-indigo-400 font-medium block">URL Publik:</span>
              <strong className="text-xs sm:text-sm text-indigo-200 block truncate">{bioPageUrl}</strong>
            </div>

            <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 sm:space-x-3 w-full sm:w-auto">
              <div className="col-span-2 sm:col-span-1 bg-slate-900/80 px-4 py-2 rounded-xl border border-slate-800 text-center">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Total Klik Halaman</span>
                <span className="text-lg font-bold text-indigo-400">{totalPageClicks}</span>
              </div>
              <Link
                href="/dashboard/analytics"
                className="flex items-center justify-center px-3 sm:px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 rounded-xl text-xs font-semibold whitespace-nowrap transition-all text-center"
              >
                📊 Analytics
              </Link>
              <a
                href={`/${username}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center px-3 sm:px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold whitespace-nowrap transition-all text-center"
              >
                Lihat Halaman ↗
              </a>
            </div>
          </div>
        )}

        {/* Form Main Settings */}
        <div className="bg-slate-900 border border-slate-800 p-4 sm:p-6 rounded-2xl mb-6 sm:mb-8">
          <h2 className="text-base sm:text-lg font-bold mb-4">
            {isCreatingNew ? "Buat Halaman Baru" : `Edit Halaman: ${selectedPage?.title}`}
          </h2>
          <form onSubmit={handleSavePage} className="space-y-4 sm:space-y-5">
            <div>
              <label className="block text-xs text-slate-400 mb-1">/Url (Unik)</label>
              <input
                type="text"
                required
                placeholder="contoh: webinar-2026 atau materi-teknis"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ""))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">Judul Halaman</label>
              <input
                type="text"
                required
                placeholder="Judul / Nama Halaman"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">Deskripsi Singkat (Opsional)</label>
              <textarea
                placeholder="Tulis deskripsi atau sambutan singkat di bawah judul..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-2">Pilih Tema Warna Halaman</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
                {THEME_OPTIONS.map((theme) => {
                  const active = themeColor === theme.id;
                  return (
                    <button
                      key={theme.id}
                      type="button"
                      onClick={() => setThemeColor(theme.id)}
                      className={`p-2.5 rounded-xl border flex flex-col items-center justify-center space-y-1.5 transition-all ${
                        active ? `${theme.borderClass} bg-slate-800` : "border-slate-800 bg-slate-950 hover:border-slate-700"
                      }`}
                    >
                      <div className="w-5 h-5 rounded-full" style={{ backgroundColor: theme.color }} />
                      <span className="text-[10px] sm:text-[11px] font-medium text-slate-300">{theme.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">Foto Profil / Logo Halaman</label>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                {avatarUrl && (
                  <img
                    src={avatarUrl}
                    alt="Preview Avatar"
                    className="w-12 h-12 rounded-full object-cover border border-slate-700 shrink-0"
                  />
                )}
                <input
                  type="file"
                  accept="image/png, image/jpeg, image/jpg, image/webp"
                  onChange={handleFileUpload}
                  disabled={uploading}
                  className="block w-full text-xs text-slate-400 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-slate-800 file:text-white hover:file:bg-slate-700 file:cursor-pointer disabled:opacity-50"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || uploading}
              className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-6 py-3 sm:py-2.5 rounded-xl text-sm transition-all disabled:opacity-50"
            >
              {loading ? "Menyimpan..." : isCreatingNew ? "Buat Halaman" : "Simpan Perubahan"}
            </button>
          </form>
        </div>

        {/* Tambah Tombol Link & Daftar Link */}
        {selectedPage && !isCreatingNew && (
          <div className="bg-slate-900 border border-slate-800 p-4 sm:p-6 rounded-2xl mb-6 sm:mb-8">
            <h2 className="text-base sm:text-lg font-bold mb-4">Tambah Tombol Link</h2>
            <form onSubmit={handleAddLink} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Ikon Tombol</label>
                  <IconSelect value={newIconType} onChange={(val) => setNewIconType(val)} />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs text-slate-400 mb-1">Judul Tombol</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Registrasi Webinar / Whatsapp Admin"
                    value={newLinkTitle}
                    onChange={(e) => setNewLinkTitle(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">URL Tujuan</label>
                <input
                  type="text"
                  required
                  placeholder="https://... atau instagram.com/..."
                  value={newLinkUrl}
                  onChange={(e) => setNewLinkUrl(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <button
                type="submit"
                className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-6 py-3 sm:py-2.5 rounded-xl text-sm transition-all"
              >
                + Tambahkan Tombol
              </button>
            </form>

            <div className="mt-6 space-y-3">
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Daftar Tombol Aktif ({links.length})
              </h4>
              {links.map((link) => (
                <div
                  key={link.id}
                  className="bg-slate-950 border border-slate-800 p-3 sm:p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex items-center space-x-3 overflow-hidden min-w-0">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0">
                      <LinkIcon type={link.icon_type} className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h5 className="font-semibold text-xs sm:text-sm text-white truncate">{link.title}</h5>
                      <p className="text-[11px] sm:text-xs text-slate-500 truncate">{link.url}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end space-x-4 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-900">
                    <span className="text-[11px] sm:text-xs bg-slate-800 text-slate-300 px-2.5 py-1 rounded-full border border-slate-700">
                      👆 {link.clicks || 0} Klik
                    </span>
                    <button
                      onClick={() => handleDeleteLink(link.id)}
                      className="text-xs text-red-400 hover:underline"
                    >
                      Hapus
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      <ConfirmModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleConfirmDelete}
        loading={isDeleting}
      />

      <footer className="text-center py-6 border-t border-slate-900 text-slate-600 text-xs">
        © 2026 mr.id. All rights reserved.
      </footer>
    </div>
  );
}