"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import toast from "react-hot-toast";
import ConfirmModal from "@/components/ConfirmModal";

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
  { id: "indigo", name: "Indigo Modern", bgClass: "bg-indigo-600", borderClass: "border-indigo-500" },
  { id: "blue", name: "Ocean Blue", bgClass: "bg-blue-600", borderClass: "border-blue-500" },
  { id: "emerald", name: "Emerald Green", bgClass: "bg-emerald-600", borderClass: "border-emerald-500" },
  { id: "rose", name: "Rose Pink", bgClass: "bg-rose-600", borderClass: "border-rose-500" },
  { id: "amber", name: "Warm Amber", bgClass: "bg-amber-600", borderClass: "border-amber-500" },
  { id: "dark", name: "Dark Minimalist", bgClass: "bg-slate-800", borderClass: "border-slate-600" },
];

const ICON_OPTIONS = [
  { id: "link", label: "🔗 Link Default" },
  { id: "whatsapp", label: "💬 WhatsApp" },
  { id: "instagram", label: "📷 Instagram" },
  { id: "youtube", label: "▶️ YouTube" },
  { id: "drive", label: "📁 Google Drive / File" },
  { id: "globe", label: "🌐 Website / Blog" },
  { id: "email", label: "✉️ Email" },
  { id: "tiktok", label: "🎵 TikTok" },
];

export default function BioManagementPage() {
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
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  // Confirm Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pageToDelete, setPageToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const router = useRouter();

  useEffect(() => {
    loadUserPages();
  }, []);

  const loadUserPages = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push("/login");
      return;
    }

    const { data: profiles } = await supabase
      .from("bio_profiles")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (profiles && profiles.length > 0) {
      setPages(profiles);
      handleSelectPage(profiles[0]);
    } else {
      setPages([]);
      resetFormToNew();
    }
  };

  const handleSelectPage = async (page: BioProfile) => {
    setSelectedPage(page);
    setIsCreatingNew(false);
    setUsername(page.username || "");
    setTitle(page.title || "");
    setDescription(page.bio_description || "");
    setAvatarUrl(page.avatar_url || "");
    setThemeColor(page.theme_color || "indigo");

    const { data: linkData } = await supabase
      .from("bio_links")
      .select("*")
      .eq("bio_id", page.id)
      .order("created_at", { ascending: true });

    setLinks(linkData || []);
  };

  const resetFormToNew = () => {
    setSelectedPage(null);
    setIsCreatingNew(true);
    setUsername("");
    setTitle("");
    setDescription("");
    setAvatarUrl("");
    setThemeColor("indigo");
    setLinks([]);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      if (!event.target.files || event.target.files.length === 0) return;

      const file = event.target.files[0];
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from("avatars").getPublicUrl(fileName);
      setAvatarUrl(data.publicUrl);
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
    if (!user) return;

    const cleanUsername = username.toLowerCase().trim().replace(/[^a-z0-9_-]/g, "");

    if (selectedPage) {
      const { error } = await supabase
        .from("bio_profiles")
        .update({
          username: cleanUsername,
          title,
          bio_description: description,
          avatar_url: avatarUrl,
          theme_color: themeColor,
        })
        .eq("id", selectedPage.id);

      if (error) toast.error("Gagal memperbarui halaman: " + error.message);
      else {
        toast.success("Halaman berhasil diperbarui!");
        loadUserPages();
      }
    } else {
      const { data, error } = await supabase
        .from("bio_profiles")
        .insert([
          {
            user_id: user.id,
            username: cleanUsername,
            title,
            bio_description: description,
            avatar_url: avatarUrl,
            theme_color: themeColor,
          },
        ])
        .select()
        .single();

      if (error) {
        toast.error("Gagal membuat halaman: " + error.message);
      } else if (data) {
        toast.success("Halaman baru berhasil dibuat!");
        await loadUserPages();
        handleSelectPage(data);
      }
    }

    setLoading(false);
  };

  // Fungsi Pemicu Modal Hapus
  const openDeleteModal = (pageId: string) => {
    setPageToDelete(pageId);
    setIsModalOpen(true);
  };

  // Fungsi Eksekusi Hapus dari Modal
  const handleConfirmDelete = async () => {
    if (!pageToDelete) return;

    setIsDeleting(true);
    const { error } = await supabase.from("bio_profiles").delete().eq("id", pageToDelete);

    if (error) {
      toast.error("Gagal menghapus halaman: " + error.message);
    } else {
      toast.success("Halaman berhasil dihapus!");
      await loadUserPages();
    }

    setIsDeleting(false);
    setIsModalOpen(false);
    setPageToDelete(null);
  };

  const handleAddLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPage) {
      toast.error("Simpan atau pilih halaman terlebih dahulu!");
      return;
    }
    if (!newLinkTitle || !newLinkUrl) return;

    const formattedUrl = newLinkUrl.startsWith("http")
      ? newLinkUrl
      : `https://${newLinkUrl}`;

    const { data, error } = await supabase
      .from("bio_links")
      .insert([
        {
          bio_id: selectedPage.id,
          title: newLinkTitle,
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
      setLinks([...links, data]);
      setNewLinkTitle("");
      setNewLinkUrl("");
      setNewIconType("link");
      toast.success("Link berhasil ditambahkan!");
    }
  };

  const handleDeleteLink = async (id: string) => {
    await supabase.from("bio_links").delete().eq("id", id);
    setLinks(links.filter((l) => l.id !== id));
    toast.success("Link berhasil dihapus!");
  };

  const bioPageUrl =
    typeof window !== "undefined" && username
      ? `${window.location.origin}/b/${username}`
      : "";

  const totalPageClicks = links.reduce((sum, link) => sum + (link.clicks || 0), 0);

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans flex flex-col justify-between">
      {/* Header */}
      <header className="flex items-center justify-between px-8 py-5 border-b border-slate-800">
        <span className="text-2xl font-black tracking-wider text-white">
          mr<span className="text-indigo-500">.id</span>
        </span>

        <div className="flex items-center space-x-6">
          <div className="flex space-x-4 text-sm font-semibold">
            <Link
              href="/dashboard"
              className="text-slate-400 hover:text-white transition-all"
            >
              Dashboard Link
            </Link>
            <span className="text-indigo-400">Kelola Halaman</span>
            <Link
              href="/dashboard/analytics"
              className="text-slate-400 hover:text-white transition-all"
            >
              Analytics Grafik
            </Link>
          </div>

          <button
            onClick={handleLogout}
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 transition-all border border-slate-700"
          >
            Keluar
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10 w-full flex-1">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">Kelola Halaman Bio Anda</h1>
            <p className="text-xs text-slate-400 mt-1">
              Buat dan kustomisasi halaman landing/bio lengkap dengan analisis klik.
            </p>
          </div>
          <button
            onClick={resetFormToNew}
            className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-all"
          >
            + Buat Halaman Baru
          </button>
        </div>

        {/* Daftar Halaman yang Dibuat */}
        {pages.length > 0 && (
          <div className="mb-8">
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
                            className="w-8 h-8 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-indigo-600/30 flex items-center justify-center text-indigo-400 font-bold text-xs">
                            {page.title[0]?.toUpperCase()}
                          </div>
                        )}
                        <h4 className="font-bold text-sm truncate">{page.title}</h4>
                      </div>
                      <p className="text-xs text-indigo-400 truncate">/b/{page.username}</p>
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

        {/* Preview Link & Statistik Total Klik */}
        {selectedPage && !isCreatingNew && username && (
          <div className="mb-8 p-4 bg-indigo-950/40 border border-indigo-500/30 rounded-2xl flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="text-xs text-indigo-400 font-medium block">URL Publik:</span>
              <strong className="text-sm text-indigo-200">{bioPageUrl}</strong>
            </div>
            <div className="flex items-center space-x-3">
              <div className="bg-slate-900/80 px-4 py-2 rounded-xl border border-slate-800 text-center">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Total Klik Halaman</span>
                <span className="text-lg font-bold text-indigo-400">{totalPageClicks}</span>
              </div>
              <Link
                href="/dashboard/analytics"
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 rounded-xl text-xs font-semibold whitespace-nowrap transition-all"
              >
                📊 Analytics Grafik
              </Link>
              <a
                href={`/b/${username}`}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold whitespace-nowrap transition-all"
              >
                Lihat Halaman ↗
              </a>
            </div>
          </div>
        )}

        {/* Form Pengaturan Halaman & Tema Warna */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl mb-8">
          <h2 className="text-lg font-bold mb-4">
            {isCreatingNew ? "Buat Halaman Baru" : `Edit Halaman: ${selectedPage?.title}`}
          </h2>
          <form onSubmit={handleSavePage} className="space-y-5">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Username / Slug URL (Unik)</label>
              <input
                type="text"
                required
                placeholder="contoh: webinar-2026 atau materi-teknis"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
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

            {/* Pilihan Tema Warna */}
            <div>
              <label className="block text-xs text-slate-400 mb-2">Pilih Tema Warna Halaman</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                {THEME_OPTIONS.map((theme) => {
                  const active = themeColor === theme.id;
                  return (
                    <button
                      key={theme.id}
                      type="button"
                      onClick={() => setThemeColor(theme.id)}
                      className={`p-3 rounded-xl border flex flex-col items-center justify-center space-y-2 transition-all ${
                        active ? `${theme.borderClass} bg-slate-800` : "border-slate-800 bg-slate-950 hover:border-slate-700"
                      }`}
                    >
                      <div className={`w-6 h-6 rounded-full ${theme.bgClass}`} />
                      <span className="text-[11px] font-medium text-slate-300">{theme.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Upload Foto Profil / Logo */}
            <div>
              <label className="block text-xs text-slate-400 mb-1">Foto Profil / Logo Halaman</label>
              <div className="flex items-center space-x-4">
                {avatarUrl && (
                  <img
                    src={avatarUrl}
                    alt="Preview Avatar"
                    className="w-14 h-14 rounded-full object-cover border border-slate-700"
                  />
                )}
                <input
                  type="file"
                  accept="image/png, image/jpeg, image/jpg, image/webp"
                  onChange={handleFileUpload}
                  disabled={uploading}
                  className="block w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-slate-800 file:text-white hover:file:bg-slate-700 file:cursor-pointer"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || uploading}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-6 py-2.5 rounded-xl text-sm transition-all"
            >
              {loading ? "Menyimpan..." : isCreatingNew ? "Buat Halaman" : "Simpan Perubahan"}
            </button>
          </form>
        </div>

        {/* Tambah Tombol Link dengan Ikon & Statistik Klik */}
        {selectedPage && !isCreatingNew && (
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl mb-8">
            <h2 className="text-lg font-bold mb-4">Tambah Tombol Link</h2>
            <form onSubmit={handleAddLink} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Ikon Tombol</label>
                  <select
                    value={newIconType}
                    onChange={(e) => setNewIconType(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500"
                  >
                    {ICON_OPTIONS.map((opt) => (
                      <option key={opt.id} value={opt.id}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
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
                  type="url"
                  required
                  placeholder="https://..."
                  value={newLinkUrl}
                  onChange={(e) => setNewLinkUrl(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-6 py-2.5 rounded-xl text-sm transition-all"
              >
                + Tambahkan Tombol
              </button>
            </form>

            {/* Daftar Link Beserta Counter Klik */}
            <div className="mt-6 space-y-3">
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Daftar Tombol Aktif ({links.length})
              </h4>
              {links.map((link) => {
                const iconLabel = ICON_OPTIONS.find((i) => i.id === link.icon_type)?.label.split(" ")[0] || "🔗";
                return (
                  <div
                    key={link.id}
                    className="bg-slate-950 border border-slate-800 p-4 rounded-xl flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-3 truncate">
                      <span className="text-lg">{iconLabel}</span>
                      <div className="truncate">
                        <h4 className="font-bold text-sm truncate">{link.title}</h4>
                        <p className="text-xs text-slate-500 truncate max-w-xs">{link.url}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4">
                      <span className="text-xs bg-slate-800 text-slate-300 px-3 py-1 rounded-full border border-slate-700">
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
                );
              })}
            </div>
          </div>
        )}
      </main>

      {/* Modal Dialog Konfirmasi Hapus Modern */}
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