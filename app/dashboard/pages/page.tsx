"use client";

import { useState, useEffect, useCallback, ChangeEvent, FormEvent } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import DashboardHeader from "@/components/DashboardHeader";
import SiteFooter from "@/components/SiteFooter";
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
  Power,
  ChevronUp,
  ChevronDown,
  Sparkles,
  Globe,
  MousePointerClick
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
  clicks?: number;
  is_active?: boolean;
  sort_order?: number;
}

const THEME_OPTIONS = [
  { id: "indigo", name: "Indigo Modern", color: "#6366f1", borderClass: "border-indigo-500" },
  { id: "blue", name: "Ocean Blue", color: "#3b82f6", borderClass: "border-blue-500" },
  { id: "emerald", name: "Emerald Green", color: "#10b981", borderClass: "border-emerald-500" },
  { id: "rose", name: "Rose Pink", color: "#f43f5e", borderClass: "border-rose-500" },
  { id: "amber", name: "Warm Amber", color: "#f59e0b", borderClass: "border-amber-500" },
  { id: "cyan", name: "Electric Cyan", color: "#06b6d4", borderClass: "border-cyan-500" },
  { id: "fuchsia", name: "Fuchsia Pop", color: "#d946ef", borderClass: "border-fuchsia-500" },
  { id: "teal", name: "Deep Teal", color: "#14b8a6", borderClass: "border-teal-500" },
  { id: "orange", name: "Sunset Orange", color: "#f97316", borderClass: "border-orange-500" },
  { id: "lime", name: "Lime Fresh", color: "#84cc16", borderClass: "border-lime-500" },
  { id: "aurora", name: "Aurora Night", color: "#22d3ee", borderClass: "border-cyan-400" },
  { id: "sunset", name: "Sunset Glow", color: "#fb7185", borderClass: "border-rose-400" },
  { id: "ocean", name: "Deep Ocean", color: "#38bdf8", borderClass: "border-sky-400" },
  { id: "neon", name: "Neon Club", color: "#a3e635", borderClass: "border-lime-400" },
  { id: "lavender", name: "Lavender Mist", color: "#c084fc", borderClass: "border-purple-400" },
  { id: "dark", name: "Dark Minimalist", color: "#334155", borderClass: "border-slate-500" },
];

const FONT_OPTIONS = [
  { id: "sans", name: "Modern Sans", style: "ui-sans-serif, system-ui, sans-serif" },
  { id: "serif", name: "Editorial Serif", style: "Georgia, serif" },
  { id: "mono", name: "Tech Mono", style: "ui-monospace, SFMono-Regular, monospace" },
  { id: "rounded", name: "Soft Rounded", style: "Trebuchet MS, sans-serif" },
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

  // Page form state
  const [username, setUsername] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [themeColor, setThemeColor] = useState("indigo");
  const [fontFamily, setFontFamily] = useState("sans");

  // Link state
  const [links, setLinks] = useState<BioLinkItem[]>([]);
  const [newLinkTitle, setNewLinkTitle] = useState("");
  const [newLinkUrl, setNewLinkUrl] = useState("");
  const [newIconType, setNewIconType] = useState("link");
  const [editingLinkId, setEditingLinkId] = useState<string | null>(null);
  const [updatingLinkId, setUpdatingLinkId] = useState<string | null>(null);
  const [reorderingLinks, setReorderingLinks] = useState(false);

  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [origin, setOrigin] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Confirmation modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pageToDelete, setPageToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const router = useRouter();
  const pathname = usePathname();

  const resetLinkForm = () => {
    setNewLinkTitle("");
    setNewLinkUrl("");
    setNewIconType("link");
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
    setFontFamily("sans");
    setLinks([]);
    resetLinkForm();
  }, []);

  const fetchPageLinks = useCallback(async (bioId: string) => {
    const { data, error } = await supabase
      .from("bio_links")
      .select("*")
      .eq("bio_id", bioId)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });

    if (error?.code === "42703" || error?.message.includes("sort_order")) {
      const { data: legacyLinks, error: legacyError } = await supabase
        .from("bio_links")
        .select("*")
        .eq("bio_id", bioId)
        .order("created_at", { ascending: true });

      if (legacyError) {
        toast.error("Could not load links: " + legacyError.message);
      } else {
        setLinks(
          (legacyLinks || []).map((link, index) => ({
            ...link,
            is_active: link.is_active !== false,
            sort_order: link.sort_order ?? index,
          }))
        );
      }
    } else if (error) {
      toast.error("Could not load links: " + error.message);
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
    const [savedTheme, savedFont] = (page.theme_color || "indigo").split("::");
    setThemeColor(savedTheme || "indigo");
    setFontFamily(savedFont || "sans");
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
      toast.error("Could not load your pages.");
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
        toast.error("File must be a PNG, JPG, JPEG, or WEBP image.");
        return;
      }

      if (file.size > 2 * 1024 * 1024) {
        toast.error("File size must be 2 MB or smaller.");
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
      toast.success("Image uploaded successfully.");
    } catch (error) {
      const err = error as Error;
      toast.error("Could not upload image: " + err.message);
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
      toast.error("Username/slug cannot be empty.");
      setLoading(false);
      return;
    }

    const payload = {
      user_id: user.id,
      username: cleanUsername,
      title: title.trim(),
      bio_description: description.trim(),
      avatar_url: avatarUrl,
      theme_color: `${themeColor}::${fontFamily}`,
    };

    if (selectedPage) {
      const { error } = await supabase
        .from("bio_profiles")
        .update(payload)
        .eq("id", selectedPage.id)
        .eq("user_id", user.id);

      if (error) {
        toast.error("Could not update page: " + error.message);
      } else {
        toast.success("Page updated successfully.");
        await loadUserPages();
      }
    } else {
      const { data, error } = await supabase
        .from("bio_profiles")
        .insert([payload])
        .select()
        .single();

      if (error) {
        toast.error("Could not create page: " + error.message);
      } else if (data) {
        toast.success("New page created successfully.");
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
      toast.error("Could not delete page: " + error.message);
    } else {
      toast.success("Page deleted successfully.");
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
      toast.error("Save or select a page first.");
      return;
    }
    if (!newLinkTitle.trim() || !newLinkUrl.trim()) return;

    const formattedUrl = sanitizeUrl(newLinkUrl);

    if (editingLinkId) {
      const { data, error } = await supabase
        .from("bio_links")
        .update({
          title: newLinkTitle.trim(),
          url: formattedUrl,
          icon_type: newIconType,
        })
        .eq("id", editingLinkId)
        .select()
        .single();

      if (error) {
        toast.error("Could not update link: " + error.message);
      } else if (data) {
        setLinks((prev) => prev.map((item) => (item.id === editingLinkId ? data : item)));
        resetLinkForm();
        toast.success("Link updated successfully.");
      }
    } else {
      const { data, error } = await supabase
        .from("bio_links")
        .insert([
          {
            bio_id: selectedPage.id,
            title: newLinkTitle.trim(),
            url: formattedUrl,
            icon_type: newIconType,
            clicks: 0,
            is_active: true,
            sort_order: links.reduce(
              (maxOrder, link) => Math.max(maxOrder, link.sort_order ?? -1),
              -1
            ) + 1,
          },
        ])
        .select()
        .single();

      if (error) {
        toast.error("Could not add link: " + error.message);
      } else if (data) {
        setLinks((prev) => [...prev, data]);
        resetLinkForm();
        toast.success("Link added successfully.");
      }
    }
  };

  const handleEditLinkClick = (link: BioLinkItem) => {
    setEditingLinkId(link.id);
    setNewLinkTitle(link.title);
    setNewLinkUrl(link.url);
    setNewIconType(link.icon_type || "link");
  };

  const handleDeleteLink = async (id: string) => {
    const { error } = await supabase.from("bio_links").delete().eq("id", id);
    if (error) {
      toast.error("Could not delete link: " + error.message);
    } else {
      setLinks((prev) => prev.filter((l) => l.id !== id));
      if (editingLinkId === id) {
        resetLinkForm();
      }
      toast.success("Link deleted successfully.");
    }
  };

  const handleToggleLink = async (link: BioLinkItem) => {
    const isActive = link.is_active !== false;
    setUpdatingLinkId(link.id);

    const { error } = await supabase
      .from("bio_links")
      .update({ is_active: !isActive })
      .eq("id", link.id);

    if (error) {
      toast.error("Could not update link status: " + error.message);
    } else {
      setLinks((previousLinks) =>
        previousLinks.map((item) =>
          item.id === link.id ? { ...item, is_active: !isActive } : item
        )
      );
      toast.success(`Link ${isActive ? "disabled" : "enabled"}.`);
    }

    setUpdatingLinkId(null);
  };

  const handleMoveLink = async (linkId: string, direction: -1 | 1) => {
    if (!selectedPage || reorderingLinks) return;

    const currentIndex = links.findIndex((link) => link.id === linkId);
    const targetIndex = currentIndex + direction;
    if (currentIndex < 0 || targetIndex < 0 || targetIndex >= links.length) return;

    const currentLink = links[currentIndex];
    const targetLink = links[targetIndex];
    const currentOrder = currentLink.sort_order ?? currentIndex;
    const targetOrder = targetLink.sort_order ?? targetIndex;

    setReorderingLinks(true);
    const updates = await Promise.all([
      supabase
        .from("bio_links")
        .update({ sort_order: targetOrder })
        .eq("id", currentLink.id),
      supabase
        .from("bio_links")
        .update({ sort_order: currentOrder })
        .eq("id", targetLink.id),
    ]);
    const updateError = updates.find(({ error }) => error)?.error;

    if (updateError) {
      toast.error("Could not change link order: " + updateError.message);
      await fetchPageLinks(selectedPage.id);
    } else {
      setLinks((previousLinks) => {
        const reorderedLinks = [...previousLinks];
        [reorderedLinks[currentIndex], reorderedLinks[targetIndex]] = [
          { ...targetLink, sort_order: currentOrder },
          { ...currentLink, sort_order: targetOrder },
        ];
        return reorderedLinks;
      });
    }

    setReorderingLinks(false);
  };

  const bioPageUrl = username && origin ? `${origin}/${username}` : "";
  const totalPageClicks = links.reduce((sum, link) => sum + (link.clicks || 0), 0);

  if (pageLoading) {
    return (
      <div className="site-shell min-h-screen text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
      </div>
    );
  }

  return (
    <div className="site-shell min-h-screen text-white font-sans flex flex-col justify-between relative">
      {/* Background Ambient Glow Effects */}
      <div className="absolute top-0 -left-20 w-96 h-96 bg-indigo-600/15 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/3 -right-20 w-96 h-96 bg-purple-600/15 rounded-full blur-[120px] pointer-events-none" />

      {/* Main navigation */}
      <DashboardHeader user={user} />
      {false && (
      <header className="app-header fixed top-0 left-0 right-0 z-50 border-b">
  <div className="max-w-7xl mx-auto px-4 sm:px-8 flex items-center justify-between h-16">
    
    {/* Kiri: Logo + Navigation */}
    <div className="flex items-center space-x-6 h-full">
      {/* Brand Logo & Title */}
      <Link href="/dashboard" className="flex items-center space-x-3">
        <img
          src="/logo.png"
          alt="urlyu.com logo"
          className="w-8 h-8 object-contain rounded-lg"
        />
        <span className="text-2xl font-black tracking-wider text-white">
          urlyu<span className="text-indigo-500">.com</span>
        </span>
      </Link>

      {/* Desktop Navigation */}
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
          <span>Manage Pages</span>
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

    {/* Kanan: User Profile / Logout / Mobile Toggle */}
    <div className="flex items-center space-x-3">
      {user && (
        <div className="hidden sm:flex items-center space-x-2">
          <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-xs uppercase text-white shrink-0">
            {user?.email?.[0] || "M"}
          </div>
        </div>
      )}

      <button
        onClick={handleLogout}
        className="hidden sm:flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-300 hover:text-red-400 bg-slate-900/50 hover:bg-red-950/30 border border-slate-800 hover:border-red-500/50 rounded-full transition-all duration-200"
      >
        <LogOut className="w-4 h-4 text-slate-400 group-hover:text-red-400 transition-colors" />
        <span>Log out</span>
      </button>

      <button
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        className="md:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 focus:outline-none transition-all"
        aria-label="Toggle Menu"
      >
        {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>
    </div>
  </div>

  {/* Mobile Menu Dropdown */}
  {mobileMenuOpen && (
    <div className="md:hidden bg-slate-900/95 border-b border-slate-800 backdrop-blur-xl px-4 pt-3 pb-6 space-y-3">
      <Link
        href="/dashboard"
        onClick={() => setMobileMenuOpen(false)}
        className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold transition-all ${
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
        className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold transition-all ${
          pathname.startsWith("/dashboard/pages")
            ? "bg-indigo-600/20 text-indigo-400 border border-indigo-500/30"
            : "text-slate-300 hover:bg-slate-800 hover:text-white"
        }`}
      >
        <FileText className="w-4 h-4" />
        <span>Manage Pages</span>
      </Link>
      <Link
        href="/dashboard/analytics"
        onClick={() => setMobileMenuOpen(false)}
        className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold transition-all ${
          pathname.startsWith("/dashboard/analytics")
            ? "bg-indigo-600/20 text-indigo-400 border border-indigo-500/30"
            : "text-slate-300 hover:bg-slate-800 hover:text-white"
        }`}
      >
        <BarChart2 className="w-4 h-4" />
        <span>Analytics</span>
      </Link>

      <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
        {user && (
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-xs uppercase text-white shrink-0">
              {user?.email?.[0] || "M"}
            </div>
            <span className="text-xs text-slate-300 truncate max-w-[150px]">
              {user?.email}
            </span>
          </div>
        )}

        <button
          onClick={handleLogout}
          className="flex items-center space-x-1.5 bg-slate-900/50 hover:bg-red-950/30 border border-slate-800 hover:border-red-500/50 text-slate-300 hover:text-red-400 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Log out</span>
        </button>
      </div>
    </div>
  )}
</header>)}

      {/* Main Content Area dengan Visual Effects */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-7 sm:py-9 w-full flex-1 relative z-10 space-y-6 sm:space-y-7">
        <div className="manager-hero flex flex-col sm:flex-row sm:items-center justify-between gap-5 p-5 sm:p-7 rounded-2xl">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="p-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                <Sparkles className="w-3.5 h-3.5" />
              </span>
              <span className="text-[11px] font-bold text-indigo-300 tracking-[0.18em] uppercase">
                Bio Page Manager
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Manage your bio pages</h1>
            <p className="text-xs sm:text-sm text-slate-300/80 mt-2 max-w-2xl">
              Create and customize bio pages with built-in click analytics.
            </p>
          </div>
          <button
            onClick={resetFormToNew}
            className="w-full sm:w-auto bg-indigo-500 hover:bg-indigo-400 text-white text-xs sm:text-sm font-bold px-5 py-3 rounded-xl transition-all shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 active:scale-[0.98] shrink-0 flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Create new page</span>
          </button>
        </div>

        {/* Page list */}
        {pages.length > 0 && (
          <div className="manager-panel p-4 sm:p-5 rounded-2xl">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
              Your pages ({pages.length})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {pages.map((page) => {
                const isSelected = selectedPage?.id === page.id && !isCreatingNew;
                return (
                  <div
                    key={page.id}
                    onClick={() => handleSelectPage(page)}
                    className={`group relative p-4 rounded-xl border cursor-pointer transition-all duration-300 backdrop-blur-xl flex flex-col justify-between overflow-hidden ${
                      isSelected
                        ? "bg-indigo-950/40 border-indigo-500/80 shadow-lg shadow-indigo-500/10"
                        : "bg-slate-900/40 border-slate-800 hover:border-indigo-500/40 hover:bg-slate-900/60"
                    }`}
                  >
                    <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                    <div>
                      <div className="flex items-center space-x-3 mb-2">
                        {page.avatar_url ? (
                          <div className="relative">
                            <Image
                              src={page.avatar_url}
                              alt={page.title}
                              width={36}
                              height={36}
                              className="w-9 h-9 rounded-xl object-cover shrink-0 border border-slate-700/80"
                            />
                            {isSelected && (
                              <span className="absolute -bottom-1 -right-1 flex h-2.5 w-2.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-indigo-500"></span>
                              </span>
                            )}
                          </div>
                        ) : (
                          <div className="w-9 h-9 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold text-xs shrink-0">
                            {page.title[0]?.toUpperCase() || "P"}
                          </div>
                        )}
                        <h4 className="font-bold text-sm text-white truncate group-hover:text-indigo-300 transition-colors">{page.title}</h4>
                      </div>
                      <p className="text-xs text-indigo-400 font-medium truncate">/{page.username}</p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-800/80 flex justify-between items-center text-xs">
                      <span className={`text-[11px] font-medium ${isSelected ? "text-indigo-300" : "text-slate-500"}`}>
                        {isSelected ? "• Currently editing" : "Click to edit"}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openDeleteModal(page.id);
                        }}
                        className="text-red-400 hover:text-red-300 transition-colors"
                      >
                        Delete
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
          <div className="manager-panel p-4 sm:p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="min-w-0 flex-1">
              <span className="text-xs text-indigo-400 font-medium block flex items-center gap-1">
                <Globe className="w-3 h-3" /> Public URL:
              </span>
              <strong className="text-xs sm:text-sm text-indigo-200 block truncate mt-0.5">{bioPageUrl}</strong>
            </div>

            <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 sm:space-x-3 w-full sm:w-auto">
              <div className="col-span-2 sm:col-span-1 bg-slate-900/80 px-4 py-2 rounded-xl border border-slate-800 text-center">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block flex items-center justify-center gap-1">
                  <MousePointerClick className="w-3 h-3 text-indigo-400" /> Total clicks
                </span>
                <span className="text-lg font-bold text-indigo-400">{totalPageClicks}</span>
              </div>
              <Link
                href="/dashboard/analytics"
                className="flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2.5 bg-slate-800/80 hover:bg-slate-700 text-white border border-slate-700/80 rounded-xl text-xs font-semibold whitespace-nowrap transition-all text-center"
              >
                <BarChart2 className="w-3.5 h-3.5" />
                <span>Analytics</span>
              </Link>
              <a
                href={`/${username}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-xl text-xs font-semibold whitespace-nowrap transition-all shadow-md shadow-indigo-500/20 text-center"
              >
                <span>View page</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        )}

        {/* Form Setting Utama */}
        <div className="manager-panel p-4 sm:p-6 rounded-2xl">
          <h2 className="text-base sm:text-lg font-bold mb-4 text-white">
            {isCreatingNew ? "Create new page" : `Edit page: ${selectedPage?.title}`}
          </h2>
          <form onSubmit={handleSavePage} className="space-y-4 sm:space-y-5">
            <div>
              <label className="block text-xs text-slate-400 mb-1">/URL (unique)</label>
              <input
                type="text"
                required
                placeholder="e.g. webinar-2026 or design-resources"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ""))}
                className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500/80 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">Page title</label>
              <input
                type="text"
                required
                placeholder="Page title / name"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500/80 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">Short description (optional)</label>
              <textarea
                placeholder="Add a short description or greeting below the title..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500/80 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-2">Choose a page color theme</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
                {THEME_OPTIONS.map((theme) => {
                  const active = themeColor === theme.id;
                  return (
                    <button
                      key={theme.id}
                      type="button"
                      onClick={() => setThemeColor(theme.id)}
                      className={`p-2.5 rounded-xl border flex flex-col items-center justify-center space-y-1.5 transition-all ${
                        active ? `${theme.borderClass} bg-indigo-950/30` : "border-slate-800/80 bg-slate-950/40 hover:border-slate-700"
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
              <label className="block text-xs text-slate-400 mb-2">Choose a page font</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {FONT_OPTIONS.map((font) => {
                  const active = fontFamily === font.id;
                  return (
                    <button
                      key={font.id}
                      type="button"
                      onClick={() => setFontFamily(font.id)}
                      style={{ fontFamily: font.style }}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        active
                          ? "border-indigo-500 bg-indigo-950/40 text-white shadow-lg shadow-indigo-500/10"
                          : "border-slate-800/80 bg-slate-950/40 text-slate-300 hover:border-slate-600"
                      }`}
                    >
                      <span className="block text-sm font-semibold">Aa</span>
                      <span className="block text-[10px] mt-1 text-slate-400">{font.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">Profile photo / page logo</label>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                {avatarUrl && (
                  <Image
                    src={avatarUrl}
                    alt="Avatar preview"
                    width={48}
                    height={48}
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
              className="w-full sm:w-auto bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold px-6 py-3 sm:py-2.5 rounded-xl text-sm transition-all shadow-md shadow-indigo-500/20 disabled:opacity-50"
            >
              {loading ? "Saving..." : isCreatingNew ? "Create page" : "Save changes"}
            </button>
          </form>
        </div>

        {/* Link button management */}
        {selectedPage && !isCreatingNew && (
          <div className="manager-panel p-4 sm:p-6 rounded-2xl">
            <h2 className="text-base sm:text-lg font-bold mb-4 text-white">
              {editingLinkId ? "Edit link button" : "Add link button"}
            </h2>
            <form onSubmit={handleSaveLink} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Button icon</label>
                  <IconSelect value={newIconType} onChange={(val) => setNewIconType(val)} />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs text-slate-400 mb-1">Button title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Webinar registration / Contact us"
                    value={newLinkTitle}
                    onChange={(e) => setNewLinkTitle(e.target.value)}
                    className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500/80 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Destination URL</label>
                <input
                  type="text"
                  required
                  placeholder="https://... or instagram.com/..."
                  value={newLinkUrl}
                  onChange={(e) => setNewLinkUrl(e.target.value)}
                  className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500/80 transition-colors"
                />
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="submit"
                  className="w-full sm:w-auto bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold px-6 py-3 sm:py-2.5 rounded-xl text-sm transition-all shadow-md shadow-indigo-500/20 flex items-center justify-center gap-1.5"
                >
                  {editingLinkId ? <Pencil className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                  <span>{editingLinkId ? "Update button" : "Add button"}</span>
                </button>

                {editingLinkId && (
                  <button
                    type="button"
                    onClick={resetLinkForm}
                    className="w-full sm:w-auto bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold px-4 py-3 sm:py-2.5 rounded-xl text-sm transition-all"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>

            <div className="mt-6 space-y-3">
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Link buttons ({links.length})
              </h4>
              {links.map((link) => (
                <div
                  key={link.id}
                  className={`bg-slate-950/60 border p-3 sm:p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all ${
                    editingLinkId === link.id ? "border-indigo-500/80 bg-indigo-950/20" : "border-slate-800/80"
                  }`}
                >
                  <div className="flex items-center space-x-3 overflow-hidden min-w-0">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0">
                      <LinkIcon type={link.icon_type} className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h5 className="font-semibold text-xs sm:text-sm text-white truncate">{link.title}</h5>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">{link.url}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between sm:justify-end gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800/60">
                    <span className="text-xs text-indigo-400 bg-indigo-950/40 border border-indigo-500/30 px-2.5 py-1 rounded-full font-medium">
                      {link.clicks || 0} clicks
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        role="switch"
                        aria-checked={link.is_active !== false}
                        aria-label={`${link.is_active === false ? "Enable" : "Disable"} ${link.title}`}
                        onClick={() => handleToggleLink(link)}
                        disabled={updatingLinkId === link.id}
                        className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50 ${
                          link.is_active === false
                            ? "border-slate-700 bg-slate-900 text-slate-400 hover:text-white"
                            : "border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20"
                        }`}
                      >
                        <Power className="h-3.5 w-3.5" />
                        <span>{link.is_active === false ? "Off" : "On"}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMoveLink(link.id, -1)}
                        disabled={reorderingLinks || links.indexOf(link) === 0}
                        aria-label={`Move ${link.title} up`}
                        title="Move up"
                        className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
                      >
                        <ChevronUp className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMoveLink(link.id, 1)}
                        disabled={reorderingLinks || links.indexOf(link) === links.length - 1}
                        aria-label={`Move ${link.title} down`}
                        title="Move down"
                        className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
                      >
                        <ChevronDown className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleEditLinkClick(link)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteLink(link.id)}
                        className="p-1.5 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <ConfirmModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onConfirm={handleConfirmDelete}
          loading={isDeleting}
          title="Delete bio page"
          message="Are you sure you want to delete this page? All links on it will be permanently deleted."
        />
      </main>
      <SiteFooter />
    </div>
  );
}