"use client";

import { useState, useEffect, useCallback, ChangeEvent, FormEvent } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import toast from "react-hot-toast";
import ConfirmModal from "@/components/ConfirmModal";
import LinkIcon from "@/components/LinkIcon";
import IconSelect from "@/components/IconSelect";
import { 
  LayoutDashboard, 
  FileText, 
  LogOut, 
  Menu, 
  X, 
  Plus, 
  BarChart2, 
  ExternalLink, 
  Trash2, 
  Pencil,
  Sparkles,
  MousePointerClick,
  Flame,
  Zap,
  Gift,
  Tag
} from "lucide-react";
import { User } from "@supabase/supabase-js";

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
  badge?: string;
  subtitle?: string;
  clicks?: number;
}

const BADGE_OPTIONS = [
  { id: "", label: "Tanpa Badge", icon: null },
  { id: "POPULAR", label: "🔥 POPULAR", color: "from-amber-500 to-red-500" },
  { id: "MUST VISIT", label: "⚡ MUST VISIT", color: "from-yellow-400 to-amber-500" },
  { id: "PROMO", label: "🎁 PROMO", color: "from-emerald-400 to-teal-500" },
  { id: "RECOMMEND", label: "✨ RECOMMEND", color: "from-indigo-400 to-purple-500" },
];

const THEME_OPTIONS = [
  { id: "indigo", name: "Indigo Modern", color: "#6366f1", borderClass: "border-indigo-500" },
  { id: "blue", name: "Ocean Blue", color: "#3b82f6", borderClass: "border-blue-500" },
  { id: "emerald", name: "Emerald Green", color: "#10b981", borderClass: "border-emerald-500" },
  { id: "rose", name: "Rose Pink", color: "#f43f5e", borderClass: "border-rose-500" },
  { id: "amber", name: "Warm Amber", color: "#f59e0b", borderClass: "border-amber-500" },
  { id: "dark", name: "Dark Minimalist", color: "#334155", borderClass: "border-slate-500" },
];

const sanitizeUrl = (inputUrl: string) => {
  const formatted = inputUrl.trim();
  if (!formatted) return "";
  return /^https?:\/\//i.test(formatted) ? formatted : `https://${formatted}`;
};

export default function BioManagementPage() {
  const [user, setUser] = useState<User | null>(null);
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
  const [newBadge, setNewBadge] = useState("");
  const [newSubtitle, setNewSubtitle] = useState("");
  const [editingLinkId, setEditingLinkId] = useState<string | null>(null);

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

  const resetLinkForm = () => {
    setNewLinkTitle("");
    setNewLinkUrl("");
    setNewIconType("link");
    setNewBadge("");
    setNewSubtitle("");
    setEditingLinkId(null);
  };

  const resetFormToNew = useCallback(() => {
    setSelectedPage(null);
    setIsCreatingNew(true);
    setUsername("");
    setTitle("");
    setDescription("");
    setAvatarUrl("");
    setThemeColor("indigo");
    setLinks([]);
    resetLinkForm();
  }, []);

  const fetchPageLinks = useCallback(async (bioId: string) => {
    const { data, error } = await supabase
      .from("bio_links")
      .select("*")
      .eq("bio_id", bioId)
      .order("created_at", { ascending: true });

    if (error) {
      toast.error("Gagal memuat link: " + error.message);
    } else {
      setLinks(data || []);
    }
  }, []);

  const handleSelectPage = useCallback(async (page: BioProfile) => {
    setSelectedPage(page);
    setIsCreatingNew(false);
    setUsername(page.username || "");
    setTitle(page.title || "");
    setDescription(page.bio_description || "");
    setAvatarUrl(page.avatar_url || "");
    setThemeColor(page.theme_color || "indigo");
    resetLinkForm();

    await fetchPageLinks(page.id);
  }, [fetchPageLinks]);

  const loadUserPages = useCallback(async () => {
    setPageLoading(true);
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    
    if (!currentUser) {
      router.push("/login");
      return;
    }

    setUser(currentUser);

    const { data: profiles, error } = await supabase
      .from("bio_profiles")
      .select("*")
      .eq("user_id", currentUser.id)
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

  const handleFileUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      const file = event.target.files?.[0];
      if (!file) return;

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
    } catch (error) {
      const err = error as Error;
      toast.error("Gagal mengunggah foto: " + err.message);
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  const handleSavePage = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);

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
        .eq("id", selectedPage.id)
        .eq("user_id", user.id);

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
    if (!pageToDelete || !user) return;

    setIsDeleting(true);

    const targetPage = pages.find((p) => p.id === pageToDelete);
    if (targetPage?.avatar_url) {
      const fileName = targetPage.avatar_url.split("/").pop();
      if (fileName) {
        await supabase.storage.from("avatars").remove([fileName]);
      }
    }

    const { error } = await supabase
      .from("bio_profiles")
      .delete()
      .eq("id", pageToDelete)
      .eq("user_id", user.id);

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

  const handleSaveLink = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedPage) {
      toast.error("Simpan atau pilih halaman terlebih dahulu!");
      return;
    }
    if (!newLinkTitle.trim() || !newLinkUrl.trim()) return;

    const formattedUrl = sanitizeUrl(newLinkUrl);

    const linkPayload = {
      title: newLinkTitle.trim(),
      url: formattedUrl,
      icon_type: newIconType,
      badge: newBadge,
      subtitle: newSubtitle.trim(),
    };

    if (editingLinkId) {
      // Mode Edit
      const { data, error } = await supabase
        .from("bio_links")
        .update(linkPayload)
        .eq("id", editingLinkId)
        .select()
        .single();

      if (error) {
        toast.error("Gagal memperbarui link: " + error.message);
      } else if (data) {
        setLinks((prev) => prev.map((item) => (item.id === editingLinkId ? data : item)));
        resetLinkForm();
        toast.success("Link berhasil diperbarui!");
      }
    } else {
      // Mode Tambah
      const { data, error } = await supabase
        .from("bio_links")
        .insert([
          {
            ...linkPayload,
            bio_id: selectedPage.id,
            clicks: 0,
          },
        ])
        .select()
        .single();

      if (error) {
        toast.error("Gagal menambahkan link: " + error.message);
      } else if (data) {
        setLinks((prev) => [...prev, data]);
        resetLinkForm();
        toast.success("Link berhasil ditambahkan!");
      }
    }
  };

  const handleEditLinkClick = (link: BioLinkItem) => {
    setEditingLinkId(link.id);
    setNewLinkTitle(link.title);
    setNewLinkUrl(link.url);
    setNewIconType(link.icon_type || "link");
    setNewBadge(link.badge || "");
    setNewSubtitle(link.subtitle || "");
  };

  const handleDeleteLink = async (id: string) => {
    const { error } = await supabase.from("bio_links").delete().eq("id", id);
    if (error) {
      toast.error("Gagal menghapus link: " + error.message);
    } else {
      setLinks((prev) => prev.filter((l) => l.id !== id));
      if (editingLinkId === id) {
        resetLinkForm();
      }
      toast.success("Link berhasil dihapus!");
    }
  };

  const bioPageUrl = username && origin ? `${origin}/${username}` : "";
  const totalPageClicks = links.reduce((sum, link) => sum + (link.clicks || 0), 0);

  if (pageLoading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="relative">
          <div className="w-12 h-12 rounded-full border-2 border-indigo-500/20 border-t-indigo-500 animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-indigo-400 animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans flex flex-col justify-between selection:bg-indigo-500 selection:text-white">
      {/* Header Navigasi */}
      <header className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/80 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 flex items-center justify-between h-16">
          <div className="flex items-center space-x-8 h-full">
            <span className="text-xl sm:text-2xl font-black tracking-wider text-white shrink-0 group cursor-pointer">
              mr<span className="text-indigo-500 group-hover:text-indigo-400 transition-colors">.id</span>
            </span>

            <nav className="hidden md:flex items-center space-x-8 h-full text-sm font-semibold">
              <Link
                href="/dashboard"
                className={`flex items-center gap-2 h-full border-b-2 transition-all ${
                  pathname === "/dashboard"
                    ? "border-indigo-500 text-indigo-400 font-bold"
                    : "border-transparent text-slate-400 hover:text-slate-200"
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Dashboard</span>
              </Link>
              <Link
                href="/dashboard/pages"
                className={`flex items-center gap-2 h-full border-b-2 transition-all ${
                  pathname.startsWith("/dashboard/pages")
                    ? "border-indigo-500 text-indigo-400 font-bold"
                    : "border-transparent text-slate-400 hover:text-slate-200"
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>Kelola Halaman</span>
              </Link>
              <Link
                href="/dashboard/analytics"
                className={`flex items-center gap-2 h-full border-b-2 transition-all ${
                  pathname.startsWith("/dashboard/analytics")
                    ? "border-indigo-500 text-indigo-400 font-bold"
                    : "border-transparent text-slate-400 hover:text-slate-200"
                }`}
              >
                <BarChart2 className="w-4 h-4" />
                <span>Analytics</span>
              </Link>
            </nav>
          </div>

          <div className="flex items-center space-x-3">
            {user && (
              <div className="hidden sm:flex items-center space-x-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center font-bold text-xs uppercase text-white shrink-0 shadow-lg shadow-indigo-500/20">
                  {user.email?.[0] || "M"}
                </div>
              </div>
            )}

            <button
              onClick={handleLogout}
              className="hidden sm:flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-300 hover:text-red-400 bg-slate-900/50 hover:bg-red-950/30 border border-slate-800 hover:border-red-500/40 rounded-full transition-all duration-200"
            >
              <LogOut className="w-4 h-4 text-slate-400 group-hover:text-red-400 transition-colors" />
              <span>Keluar</span>
            </button>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 focus:outline-none transition-all"
              aria-label="Toggle Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden bg-slate-900/95 border-b border-slate-800 backdrop-blur-2xl px-4 pt-3 pb-6 space-y-3 animate-in slide-in-from-top-2 duration-200">
            <Link
              href="/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                pathname === "/dashboard"
                  ? "bg-indigo-600/20 text-indigo-400 border border-indigo-500/30"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Dashboard</span>
            </Link>
            <Link
              href="/dashboard/pages"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                pathname.startsWith("/dashboard/pages")
                  ? "bg-indigo-600/20 text-indigo-400 border border-indigo-500/30"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Kelola Halaman</span>
            </Link>
            <Link
              href="/dashboard/analytics"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                pathname.startsWith("/dashboard/analytics")
                  ? "bg-indigo-600/20 text-indigo-400 border border-indigo-500/30"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <BarChart2 className="w-4 h-4" />
              <span>Analytics</span>
            </Link>

            <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
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
                className="flex items-center space-x-1.5 bg-slate-900/50 hover:bg-red-950/30 border border-slate-800 hover:border-red-500/50 text-slate-300 hover:text-red-400 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Keluar</span>
              </button>
            </div>
          </div>
        )}
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10 w-full flex-1">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
          <div>
            <h1 className="text-xl sm:text-2xl font-black bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent flex items-center gap-2">
              <span>Kelola Halaman Bio</span>
              <Sparkles className="w-5 h-5 text-indigo-400 inline" />
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Rancang halaman link bio interaktif lengkap dengan penanda badge dan teks pemikat.
            </p>
          </div>
          <button
            onClick={resetFormToNew}
            className="w-full sm:w-auto bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 active:scale-[0.98] text-white text-xs font-bold px-5 py-3 rounded-xl transition-all shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Buat Halaman Baru</span>
          </button>
        </div>

        {/* Daftar Halaman */}
        {pages.length > 0 && (
          <div className="mb-6 sm:mb-8">
            <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <span>Daftar Halaman Anda</span>
              <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full text-[10px]">
                {pages.length}
              </span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {pages.map((page) => {
                const isSelected = selectedPage?.id === page.id && !isCreatingNew;
                return (
                  <div
                    key={page.id}
                    onClick={() => handleSelectPage(page)}
                    className={`group relative p-4 rounded-2xl border transition-all duration-300 cursor-pointer overflow-hidden flex flex-col justify-between ${
                      isSelected
                        ? "bg-slate-900/90 border-indigo-500/80 shadow-lg shadow-indigo-500/10 ring-1 ring-indigo-500/30"
                        : "bg-slate-900/40 border-slate-800 hover:border-slate-700 hover:bg-slate-900/70"
                    }`}
                  >
                    <div>
                      <div className="flex items-center space-x-3 mb-2">
                        {page.avatar_url ? (
                          <Image
                            src={page.avatar_url}
                            alt={page.title}
                            width={36}
                            height={36}
                            className="w-9 h-9 rounded-full object-cover shrink-0 ring-2 ring-indigo-500/20 group-hover:ring-indigo-500/50 transition-all"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-md shadow-indigo-500/20">
                            {page.title[0]?.toUpperCase() || "P"}
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <h4 className="font-bold text-sm text-slate-100 truncate group-hover:text-white">
                            {page.title}
                          </h4>
                          <p className="text-xs text-indigo-400 font-medium truncate">/{page.username}</p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-800/80 flex justify-between items-center text-xs">
                      <span className={`text-[11px] font-medium ${isSelected ? "text-indigo-400" : "text-slate-500 group-hover:text-slate-400"}`}>
                        {isSelected ? "✨ Sedang Diedit" : "Klik untuk Kelola"}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openDeleteModal(page.id);
                        }}
                        className="text-slate-500 hover:text-red-400 transition-colors p-1"
                        title="Hapus Halaman"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Banner URL & Quick Stats */}
        {selectedPage && !isCreatingNew && username && (
          <div className="mb-6 sm:mb-8 p-4 sm:p-5 bg-gradient-to-r from-indigo-950/40 via-slate-900 to-slate-950 border border-indigo-500/30 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 backdrop-blur-md shadow-xl">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 text-xs text-indigo-400 font-semibold mb-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Link Publik Halaman:</span>
              </div>
              <strong className="text-xs sm:text-sm text-indigo-200 block truncate font-mono bg-slate-950/60 border border-indigo-500/20 px-3 py-1.5 rounded-lg">
                {bioPageUrl}
              </strong>
            </div>

            <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 sm:space-x-3 w-full sm:w-auto">
              <div className="col-span-2 sm:col-span-1 bg-slate-950/80 px-4 py-2 rounded-xl border border-slate-800 text-center">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">Total Klik</span>
                <span className="text-lg font-black text-indigo-400 flex items-center justify-center gap-1">
                  <MousePointerClick className="w-4 h-4 text-indigo-400" />
                  {totalPageClicks}
                </span>
              </div>
              <Link
                href="/dashboard/analytics"
                className="flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2.5 bg-slate-800/80 hover:bg-slate-700 text-white border border-slate-700/80 rounded-xl text-xs font-semibold whitespace-nowrap transition-all text-center hover:scale-[1.02]"
              >
                <BarChart2 className="w-3.5 h-3.5 text-slate-300" />
                <span>Analytics</span>
              </Link>
              <a
                href={`/${username}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold whitespace-nowrap transition-all text-center hover:scale-[1.02] shadow-lg shadow-indigo-600/20"
              >
                <span>Preview</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        )}

        {/* Form Setting Utama */}
        <div className="bg-slate-900/60 border border-slate-800/80 backdrop-blur-md p-4 sm:p-6 rounded-2xl mb-6 sm:mb-8 shadow-xl">
          <h2 className="text-base sm:text-lg font-bold mb-4 flex items-center gap-2">
            <span>{isCreatingNew ? "Buat Halaman Baru" : `Edit Profil Halaman`}</span>
          </h2>
          <form onSubmit={handleSavePage} className="space-y-4 sm:space-y-5">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">/URL Slug (Unik)</label>
              <input
                type="text"
                required
                placeholder="contoh: webinar-2026"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ""))}
                className="w-full bg-slate-950/80 border border-slate-800/80 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500/80 focus:ring-1 focus:ring-indigo-500/50 transition-all font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Judul Halaman</label>
              <input
                type="text"
                required
                placeholder="Judul / Nama Halaman"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-slate-950/80 border border-slate-800/80 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500/80 focus:ring-1 focus:ring-indigo-500/50 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Deskripsi Singkat / Kata-kata Sambutan</label>
              <textarea
                placeholder="Tulis kata-kata penarik atau deskripsi singkat di bawah profil..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="w-full bg-slate-950/80 border border-slate-800/80 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500/80 focus:ring-1 focus:ring-indigo-500/50 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-2">Tema Warna Halaman</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
                {THEME_OPTIONS.map((theme) => {
                  const active = themeColor === theme.id;
                  return (
                    <button
                      key={theme.id}
                      type="button"
                      onClick={() => setThemeColor(theme.id)}
                      className={`p-2.5 rounded-xl border flex flex-col items-center justify-center space-y-1.5 transition-all ${
                        active 
                          ? `${theme.borderClass} bg-slate-800/90 shadow-md shadow-indigo-500/10` 
                          : "border-slate-800/80 bg-slate-950/50 hover:border-slate-700 hover:bg-slate-900"
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
              <label className="block text-xs font-medium text-slate-400 mb-1">Foto Profil / Logo Halaman</label>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                {avatarUrl && (
                  <Image
                    src={avatarUrl}
                    alt="Preview Avatar"
                    width={48}
                    height={48}
                    className="w-12 h-12 rounded-full object-cover border-2 border-indigo-500/40 shrink-0"
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
              className="w-full sm:w-auto bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold px-6 py-3 sm:py-2.5 rounded-xl text-sm transition-all shadow-lg shadow-indigo-600/20 disabled:opacity-50"
            >
              {loading ? "Menyimpan..." : isCreatingNew ? "Buat Halaman" : "Simpan Perubahan"}
            </button>
          </form>
        </div>

        {/* Manajemen Tombol Link */}
        {selectedPage && !isCreatingNew && (
          <div className="bg-slate-900/60 border border-slate-800/80 backdrop-blur-md p-4 sm:p-6 rounded-2xl mb-6 sm:mb-8 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base sm:text-lg font-bold flex items-center gap-2">
                <span>{editingLinkId ? "Edit Tombol Link" : "Tambah Tombol Link Baru"}</span>
              </h2>
            </div>

            <form onSubmit={handleSaveLink} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Ikon Tombol</label>
                  <IconSelect value={newIconType} onChange={(val) => setNewIconType(val)} />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-slate-400 mb-1">Judul Tombol (Utama)</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Gabung Group WA / Katalog Promo"
                    value={newLinkTitle}
                    onChange={(e) => setNewLinkTitle(e.target.value)}
                    className="w-full bg-slate-950/80 border border-slate-800/80 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500/80 focus:ring-1 focus:ring-indigo-500/50 transition-all"
                  />
                </div>
              </div>

              {/* Subtitle / Kata-kata Penarik */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">
                    Kata-kata Singkat / Subtitle (Opsional)
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Klik untuk klaim diskon 50% hari ini!"
                    value={newSubtitle}
                    onChange={(e) => setNewSubtitle(e.target.value)}
                    className="w-full bg-slate-950/80 border border-slate-800/80 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500/80 focus:ring-1 focus:ring-indigo-500/50 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">
                    Pilih Label / Badge Sorotan (Opsional)
                  </label>
                  <select
                    value={newBadge}
                    onChange={(e) => setNewBadge(e.target.value)}
                    className="w-full bg-slate-950/80 border border-slate-800/80 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500/80 focus:ring-1 focus:ring-indigo-500/50 transition-all"
                  >
                    {BADGE_OPTIONS.map((badge) => (
                      <option key={badge.id} value={badge.id}>
                        {badge.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">URL Tujuan</label>
                <input
                  type="text"
                  required
                  placeholder="https://... atau wa.me/..."
                  value={newLinkUrl}
                  onChange={(e) => setNewLinkUrl(e.target.value)}
                  className="w-full bg-slate-950/80 border border-slate-800/80 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500/80 focus:ring-1 focus:ring-indigo-500/50 transition-all font-mono"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  className="w-full sm:w-auto bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold px-6 py-3 sm:py-2.5 rounded-xl text-sm transition-all shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-1.5"
                >
                  {editingLinkId ? <Pencil className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                  <span>{editingLinkId ? "Perbarui Tombol" : "Tambahkan Tombol"}</span>
                </button>

                {editingLinkId && (
                  <button
                    type="button"
                    onClick={resetLinkForm}
                    className="w-full sm:w-auto bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold px-4 py-3 sm:py-2.5 rounded-xl text-sm transition-all"
                  >
                    Batal
                  </button>
                )}
              </div>
            </form>

            {/* List Tombol Aktif dengan Preview Efek Keren */}
            <div className="mt-8 space-y-3">
              <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">
                Daftar Tombol Aktif ({links.length})
              </h4>
              
              {links.map((link) => {
                const badgeInfo = BADGE_OPTIONS.find((b) => b.id === link.badge);
                return (
                  <div
                    key={link.id}
                    className={`group relative p-3.5 sm:p-4 rounded-xl border transition-all duration-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3 overflow-hidden ${
                      editingLinkId === link.id
                        ? "border-indigo-500/80 bg-indigo-950/30 ring-1 ring-indigo-500/40"
                        : "bg-slate-950/80 border-slate-800/80 hover:border-slate-700 hover:shadow-lg hover:shadow-indigo-500/5 hover:-translate-y-0.5"
                    }`}
                  >
                    <div className="flex items-center space-x-3.5 overflow-hidden min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                        <LinkIcon type={link.icon_type} className="w-5 h-5 text-indigo-400" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-0.5">
                          <h5 className="font-bold text-xs sm:text-sm text-white truncate">{link.title}</h5>
                          {badgeInfo && badgeInfo.id && (
                            <span className={`text-[9px] font-black tracking-wide px-2 py-0.5 rounded-full text-white bg-gradient-to-r ${badgeInfo.color} shadow-sm shrink-0`}>
                              {badgeInfo.id}
                            </span>
                          )}
                        </div>
                        {link.subtitle && (
                          <p className="text-[11px] text-indigo-300/80 truncate mb-0.5 font-medium">
                            {link.subtitle}
                          </p>
                        )}
                        <p className="text-[10px] sm:text-[11px] text-slate-500 truncate font-mono">{link.url}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end space-x-3 sm:space-x-4 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-900/80">
                      <span className="text-[10px] sm:text-[11px] bg-slate-900 text-slate-300 px-2.5 py-1 rounded-full border border-slate-800 flex items-center gap-1 font-mono">
                        <MousePointerClick className="w-3 h-3 text-indigo-400" />
                        {link.clicks || 0}
                      </span>
                      <button
                        onClick={() => handleEditLinkClick(link)}
                        className="text-xs text-indigo-400 hover:text-indigo-300 hover:underline flex items-center gap-1 font-medium transition-colors"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={() => handleDeleteLink(link.id)}
                        className="text-xs text-red-400/80 hover:text-red-400 hover:underline flex items-center gap-1 font-medium transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Hapus</span>
                      </button>
                    </div>
                  </div>
                );
              })}
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

      <footer className="text-center py-6 border-t border-slate-900/80 text-slate-600 text-xs">
        © 2026 mr.id. All rights reserved.
      </footer>
    </div>
  );
}