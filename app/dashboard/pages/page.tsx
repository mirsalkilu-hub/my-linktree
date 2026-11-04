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
  MousePointerClick,
  Search,
  Eye,
  Filter,
  MoreVertical,
  Copy,
} from "lucide-react";
import { User } from "@supabase/supabase-js";
import {
  BIO_TEMPLATE_CATEGORIES,
  BIO_TEMPLATES,
  type BioTemplate,
} from "@/lib/bio-templates";

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

interface BioPageStats {
  linkCount: number;
  clicks: number;
  clicksToday: number;
  clicksLast30Days: number;
}

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

function TemplateArtwork({ template }: { template: BioTemplate }) {
  const isLight = template.isLight === true;
  const ink = isLight ? "#312b35" : "#f8fafc";
  const muted = isLight ? "#7a6e78" : "rgba(255,255,255,.62)";
  const buttonBackground = isLight ? "#fff" : "rgba(255,255,255,.12)";

  if (template.id === "blank") {
    return (
      <div
        className="flex h-full flex-col items-center justify-center"
        style={{
          backgroundColor: "#fffaff",
          backgroundImage: "radial-gradient(#eadff0 .8px, transparent .8px)",
          backgroundSize: "13px 13px",
        }}
      >
        <div
          className="flex h-12 w-12 items-center justify-center rounded-xl text-3xl text-white shadow-lg"
          style={{ background: "linear-gradient(135deg,#6824a5,#ee36b6)" }}
        >
          +
        </div>
        <span className="mt-2 text-[9px] font-black tracking-[.25em] text-fuchsia-500">
          BLANK
        </span>
      </div>
    );
  }

  return (
    <div
      className="relative flex h-full flex-col items-center overflow-hidden px-4 py-5 text-center"
      style={{ background: template.background, color: ink }}
    >
      {template.id === "flash-sale" && (
        <>
          <div
            className="absolute -left-7 top-8 h-20 w-20 rotate-12 rounded-3xl opacity-70"
            style={{ background: "linear-gradient(135deg,#ffb26b,#ff5485)" }}
          />
          <div
            className="absolute -right-7 top-16 h-16 w-16 -rotate-12 rounded-full opacity-75"
            style={{ background: "linear-gradient(135deg,#ffd86b,#ff6d9a)" }}
          />
          <span className="relative rounded-full border border-rose-300/70 bg-white/70 px-3 py-1 text-[9px] font-black tracking-widest text-rose-600">
            LIMITED OFFER
          </span>
          <h4 className="relative mt-5 text-2xl font-black leading-none text-slate-900">
            FLASH
            <br />
            SALE
          </h4>
          <p className="relative mt-2 text-[9px] font-extrabold tracking-wider text-orange-700">
            NEW FINDS · THIS WEEK
          </p>
          <div className="relative mt-4 w-full space-y-2">
            {["Shop the collection", "See this week’s picks"].map((label) => (
              <div
                key={label}
                className="rounded-lg px-3 py-2 text-[9px] font-bold text-white shadow"
                style={{ background: "linear-gradient(90deg,#7527db,#c026d3)" }}
              >
                {label}
              </div>
            ))}
          </div>
          <div className="relative mt-4 w-full space-y-2 text-left">
            {["Featured collection", "Customer favorites"].map((label, index) => (
              <div
                key={label}
                className="flex items-center gap-2 rounded-lg bg-white/95 p-2 shadow"
              >
                <span
                  className="h-8 w-8 shrink-0 rounded-md"
                  style={{
                    background: index
                      ? "linear-gradient(135deg,#242f48,#111827)"
                      : "linear-gradient(135deg,#ffb379,#f87378)",
                  }}
                />
                <span className="min-w-0">
                  <span className="block truncate text-[8px] font-bold text-slate-900">
                    {label}
                  </span>
                  <span className="mt-1 block h-1 w-12 rounded bg-slate-300" />
                </span>
                <span className="ml-auto text-[8px] font-bold text-slate-800">
                  ${index ? "24" : "19"}
                </span>
              </div>
            ))}
          </div>
        </>
      )}

      {template.id === "indie-tour" && (
        <>
          <div
            className="absolute inset-x-0 top-0 h-40 opacity-50"
            style={{
              background:
                "radial-gradient(ellipse at 50% 20%, #f0abfc 0, #9d4edd 18%, transparent 68%)",
            }}
          />
          <div
            className="relative mt-1 flex h-14 w-14 items-center justify-center rounded-full border-2 text-xl font-black text-white shadow-xl"
            style={{
              borderColor: `${template.accent}aa`,
              background: "linear-gradient(135deg,#351449,#120c20)",
              boxShadow: `0 0 30px ${template.accent}66`,
            }}
          >
            IR
          </div>
          <span className="relative mt-3 text-[8px] font-bold tracking-[.25em] text-fuchsia-200">
            LISTEN EVERYWHERE
          </span>
          <h4 className="relative mt-2 text-xl font-black text-white">INDIE RIOT</h4>
          <div className="relative mt-3 w-full space-y-2">
            {["Listen on Spotify", "Apple Music", "Watch the video"].map((label, index) => (
              <div
                key={label}
                className="rounded-full px-3 py-2 text-[9px] font-bold"
                style={{
                  background:
                    index === 0
                      ? `linear-gradient(90deg,${template.accent},#7c3aed)`
                      : "rgba(255,255,255,.9)",
                  color: index === 0 ? "#fff" : "#24162e",
                }}
              >
                {label}
              </div>
            ))}
          </div>
          <div className="relative mt-4 w-full border-t border-fuchsia-300/50 pt-3 text-[9px] font-bold tracking-widest text-fuchsia-100">
            UPCOMING SHOWS
          </div>
          <div className="relative mt-2 w-full rounded-lg border border-white/10 bg-black/30 p-3 text-left text-[8px] leading-5 text-white/80">
            JUN 14 · BROOKLYN
            <br />
            JUN 21 · LOS ANGELES
          </div>
        </>
      )}

      {template.id === "sugar-atelier" && (
        <>
          <div className="absolute -left-8 top-10 h-24 w-24 rounded-full bg-rose-200/60 blur-sm" />
          <div className="absolute -right-8 top-28 h-28 w-28 rounded-full bg-orange-200/70 blur-sm" />
          <span className="relative flex h-14 w-14 items-center justify-center rounded-full border-2 border-rose-300 bg-white/70 text-2xl">
            ✿
          </span>
          <h4 className="relative mt-3 text-lg font-serif font-bold text-rose-950">
            Sugar Atelier
          </h4>
          <p className="relative mt-1 text-[8px] font-medium" style={{ color: muted }}>
            HANDCRAFTED WITH LOVE
          </p>
          <div className="relative mt-4 w-full space-y-2">
            {["Order custom cakes", "View today’s menu", "Visit our cafe"].map((label) => (
              <div
                key={label}
                className="rounded-xl border border-rose-200 bg-white/85 px-3 py-2.5 text-[9px] font-semibold text-rose-950 shadow-sm"
              >
                {label}
              </div>
            ))}
          </div>
          <div className="relative mt-4 flex gap-2">
            {["#e9adad", "#e8c18c", "#d9a7bc"].map((color) => (
              <span
                key={color}
                className="h-9 flex-1 rounded-lg shadow-sm"
                style={{ background: `linear-gradient(145deg,#fff,${color})` }}
              />
            ))}
          </div>
        </>
      )}

      {template.id === "olivia-bloom" && (
        <>
          <div className="absolute -left-7 top-9 h-24 w-24 rotate-45 rounded-[40%] bg-rose-200/50" />
          <div className="absolute -right-8 top-28 h-28 w-28 -rotate-12 rounded-[40%] bg-orange-200/60" />
          <div className="relative h-14 w-14 overflow-hidden rounded-full border-2 border-white shadow-lg">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-100 via-rose-200 to-rose-500" />
            <div className="absolute bottom-1 left-4 h-8 w-7 rounded-t-full bg-rose-950/60" />
            <div className="absolute bottom-5 left-5 h-5 w-5 rounded-full bg-amber-100" />
          </div>
          <h4 className="relative mt-3 text-lg font-serif font-bold text-rose-950">
            Olivia Bloom
          </h4>
          <p className="relative mt-1 text-[8px]" style={{ color: muted }}>
            BEAUTY · STYLE · EVERYDAY
          </p>
          <div className="relative mt-4 w-full space-y-2">
            {["Shop my essentials", "Book a consultation", "Latest beauty edit"].map(
              (label) => (
                <div
                  key={label}
                  className="rounded-full border border-rose-200 bg-white/75 px-3 py-2.5 text-[9px] font-semibold text-rose-950 shadow-sm"
                >
                  {label}
                </div>
              )
            )}
          </div>
          <span className="relative mt-4 text-[8px] font-medium tracking-[.2em] text-rose-500">
            FOLLOW ALONG
          </span>
        </>
      )}

      {template.id === "newsroom" && (
        <>
          <div className="relative flex h-12 w-12 items-center justify-center rounded-full border-2 border-red-500 bg-white text-[9px] font-black leading-tight text-red-600 shadow-md">
            DAILY
            <br />
            BRIEF
          </div>
          <h4 className="relative mt-3 font-serif text-lg font-black tracking-wide text-slate-900">
            THE DAILY BRIEF
          </h4>
          <p className="relative mt-1 text-[8px] font-bold tracking-widest text-red-600">
            NEWS · CULTURE · IDEAS
          </p>
          <div className="relative mt-4 w-full space-y-2 text-left">
            {["Top stories today", "Listen to the daily podcast", "Read our newsletter"].map(
              (label, index) => (
                <div
                  key={label}
                  className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white p-2 shadow-sm"
                >
                  <span className="h-8 w-10 shrink-0 rounded bg-gradient-to-br from-sky-300 to-slate-500" />
                  <span className="text-[8px] font-bold text-slate-800">{label}</span>
                  {index === 0 && (
                    <span className="ml-auto h-1.5 w-1.5 rounded-full bg-red-500" />
                  )}
                </div>
              )
            )}
          </div>
          <div className="relative mt-3 w-full border-t border-slate-300 pt-2 text-[8px] font-bold tracking-widest text-slate-500">
            TRUSTED REPORTING, EVERY DAY
          </div>
        </>
      )}

      {template.id === "learning-hub" && (
        <>
          <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-500 text-xl text-white shadow-lg">
            ✦
          </div>
          <h4 className="relative mt-3 text-lg font-black text-slate-900">LEARN WITH ME</h4>
          <p className="relative mt-1 text-[8px]" style={{ color: muted }}>
            COURSES · NOTES · RESOURCES
          </p>
          <div className="relative mt-4 w-full space-y-2">
            {["Explore all courses", "Free learning resources", "Join the community"].map(
              (label, index) => (
                <div
                  key={label}
                  className="rounded-xl border border-sky-100 bg-white/90 p-2.5 text-left shadow-sm"
                >
                  <span className="block text-[9px] font-bold text-slate-800">{label}</span>
                  <span className="mt-1 block h-1 w-2/3 rounded bg-sky-200" />
                  {index === 0 && (
                    <span className="mt-2 block h-1.5 w-full rounded-full bg-sky-100">
                      <span className="block h-1.5 w-2/3 rounded-full bg-sky-500" />
                    </span>
                  )}
                </div>
              )
            )}
          </div>
        </>
      )}

      {template.id === "good-cause" && (
        <>
          <div className="relative flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500 text-xl text-white shadow-lg">
            ♥
          </div>
          <span className="relative mt-2 text-[8px] font-bold tracking-[.22em] text-emerald-800">
            SMALL ACTS, BIG CHANGE
          </span>
          <h4 className="relative mt-2 text-lg font-black text-emerald-950">
            Better starts together
          </h4>
          <p className="relative mt-1 max-w-[190px] text-[8px]" style={{ color: muted }}>
            Help us make a lasting difference in our community.
          </p>
          <div className="relative mt-4 w-full space-y-2">
            {["Support our mission", "Volunteer with us", "Meet the community"].map(
              (label, index) => (
                <div
                  key={label}
                  className="rounded-xl px-3 py-2.5 text-[9px] font-bold"
                  style={{
                    background: index === 0 ? template.accent : buttonBackground,
                    color: index === 0 ? "#064e3b" : ink,
                    border: `1px solid ${template.accent}55`,
                  }}
                >
                  {label}
                </div>
              )
            )}
          </div>
        </>
      )}

      {![
        "blank",
        "flash-sale",
        "indie-tour",
        "sugar-atelier",
        "olivia-bloom",
        "newsroom",
        "learning-hub",
        "good-cause",
      ].includes(template.id) && (
        <>
          <div
            className="relative mb-3 flex h-12 w-12 items-center justify-center rounded-full border-2 text-sm font-bold"
            style={{ borderColor: template.accent, color: template.accent }}
          >
            UR
          </div>
          <h4 className="relative text-lg font-bold" style={{ color: ink }}>
            Your brand
          </h4>
          <p className="relative mt-1 text-[8px]" style={{ color: muted }}>
            A home for all your important links
          </p>
          <div className="relative mt-4 w-full space-y-2">
            {["Visit my website", "Explore my work", "Get in touch"].map((label) => (
              <div
                key={label}
                className="rounded-xl px-3 py-2.5 text-[9px] font-semibold"
                style={{
                  color: ink,
                  background: buttonBackground,
                  border: `1px solid ${template.accent}55`,
                }}
              >
                {label}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function BioManagementPage() {
  const [user, setUser] = useState<User | null>(null);
  const [pages, setPages] = useState<BioProfile[]>([]);
  const [pageStats, setPageStats] = useState<Record<string, BioPageStats>>({});
  const [clickAnalyticsUnavailable, setClickAnalyticsUnavailable] = useState(false);
  const [pageSearch, setPageSearch] = useState("");
  const [pageFilter, setPageFilter] = useState<"all" | "with-links" | "without-links">("all");
  const [showPageFilters, setShowPageFilters] = useState(false);
  const [openPageMenuId, setOpenPageMenuId] = useState<string | null>(null);
  const [selectedPage, setSelectedPage] = useState<BioProfile | null>(null);

  // Page form state
  const [username, setUsername] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [themeColor, setThemeColor] = useState("blank");
  const [fontFamily, setFontFamily] = useState("sans");
  const [templateSearch, setTemplateSearch] = useState("");
  const [templateCategory, setTemplateCategory] = useState<string>("All");
  const [isTemplateGalleryOpen, setIsTemplateGalleryOpen] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<BioTemplate | null>(null);

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
  const [isEditingPage, setIsEditingPage] = useState(false);
  const origin = typeof window !== "undefined" ? window.location.origin : "";
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
    setIsEditingPage(true);
    setIsTemplateGalleryOpen(true);
    setUsername("");
    setTitle("");
    setDescription("");
    setAvatarUrl("");
    setThemeColor("blank");
    setFontFamily("sans");
    setLinks([]);
    resetLinkForm();
  }, []);

  const fetchPageStats = useCallback(async (pageIds: string[]) => {
    if (pageIds.length === 0) {
      setPageStats({});
      setClickAnalyticsUnavailable(false);
      return;
    }

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const thirtyDayStart = new Date(todayStart);
    thirtyDayStart.setDate(thirtyDayStart.getDate() - 29);
    const [linksResult, analyticsResult] = await Promise.all([
      supabase
        .from("bio_links")
        .select("bio_id, clicks")
        .in("bio_id", pageIds),
      supabase
        .from("bio_link_analytics")
        .select("bio_id, created_at")
        .in("bio_id", pageIds)
        .gte("created_at", thirtyDayStart.toISOString()),
    ]);

    if (linksResult.error) {
      toast.error("Could not load page statistics: " + linksResult.error.message);
      return;
    }
    setClickAnalyticsUnavailable(false);
    if (analyticsResult.error) {
      toast.error("Could not load page click analytics: " + analyticsResult.error.message);
      setClickAnalyticsUnavailable(true);
    }

    const nextStats = Object.fromEntries(
      pageIds.map((pageId) => [
        pageId,
        { linkCount: 0, clicks: 0, clicksToday: 0, clicksLast30Days: 0 },
      ])
    );

    for (const link of linksResult.data || []) {
      const stats = nextStats[link.bio_id];
      if (!stats) continue;
      stats.linkCount += 1;
      stats.clicks += typeof link.clicks === "number" ? link.clicks : 0;
    }

    for (const event of analyticsResult.data || []) {
      const stats = nextStats[event.bio_id];
      if (!stats) continue;
      stats.clicksLast30Days += 1;
      if (new Date(event.created_at) >= todayStart) stats.clicksToday += 1;
    }

    setPageStats(nextStats);
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

  const handleSelectPage = useCallback(async (page: BioProfile, openEditor = false) => {
    setSelectedPage(page);
    setIsCreatingNew(false);
    setIsEditingPage(openEditor);
    setIsTemplateGalleryOpen(false);
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
      await fetchPageStats(profiles.map((profile) => profile.id));
      if (
        !isCreatingNew &&
        (!selectedPage || !profiles.some((p) => p.id === selectedPage.id))
      ) {
        await handleSelectPage(profiles[0]);
      }
    } else {
      setPages([]);
      setPageStats({});
      resetFormToNew();
    }
    setPageLoading(false);
  }, [router, selectedPage, isCreatingNew, handleSelectPage, resetFormToNew, fetchPageStats]);

  useEffect(() => {
    let isMounted = true;

    const initializePage = async () => {
      const { data: { user: currentUser } } = await supabase.auth.getUser();

      if (!currentUser) {
        router.push("/login");
        return;
      }

      if (!isMounted) return;
      setUser(currentUser);

      const { data: profiles, error } = await supabase
        .from("bio_profiles")
        .select("*")
        .eq("user_id", currentUser.id)
        .order("created_at", { ascending: false });

      if (!isMounted) return;
      if (error) {
        toast.error("Could not load your pages.");
      } else if (profiles && profiles.length > 0) {
        setPages(profiles);
        await fetchPageStats(profiles.map((profile) => profile.id));
        const requestedPageId = pathname.startsWith("/dashboard/pages/")
          ? pathname.split("/")[3]
          : null;
        if (requestedPageId) {
          const requestedPage = profiles.find((page) => page.id === requestedPageId);
          if (requestedPage) {
            if (selectedPage?.id !== requestedPageId || !isEditingPage) {
              await handleSelectPage(requestedPage, true);
            }
          } else {
            toast.error("That page could not be found.");
            router.replace("/dashboard/pages");
          }
        } else if (
          !isCreatingNew &&
          (!selectedPage || !profiles.some((p) => p.id === selectedPage.id))
        ) {
          await handleSelectPage(profiles[0]);
        }
      } else {
        setPages([]);
        setPageStats({});
        if (pathname.startsWith("/dashboard/pages/")) {
          toast.error("That page could not be found.");
          router.replace("/dashboard/pages");
        } else {
          resetFormToNew();
        }
      }
      setPageLoading(false);
    };

    void initializePage();

    return () => {
      isMounted = false;
    };
  }, [fetchPageStats, handleSelectPage, isCreatingNew, isEditingPage, pathname, resetFormToNew, router, selectedPage]);

  useEffect(() => {
    if (!isTemplateGalleryOpen && !previewTemplate) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (previewTemplate) {
          setPreviewTemplate(null);
        } else {
          setIsTemplateGalleryOpen(false);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isTemplateGalleryOpen, previewTemplate]);

  const applyTemplate = (template: BioTemplate) => {
    setThemeColor(template.id);
    setIsTemplateGalleryOpen(false);
    setPreviewTemplate(null);
  };

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
        router.replace(`/dashboard/pages/${data.id}`);
        await handleSelectPage(data, true);
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
        setSelectedPage(null);
        setIsCreatingNew(false);
        setIsEditingPage(false);
        setLinks([]);
        router.replace("/dashboard/pages");
      }
      await loadUserPages();
    }

    setIsDeleting(false);
    setIsModalOpen(false);
    setPageToDelete(null);
  };

  const handleCopyPageUrl = async (page: BioProfile) => {
    try {
      await navigator.clipboard.writeText(`${origin}/${page.username}`);
      toast.success("Page link copied.");
    } catch (error) {
      console.error("Could not copy page link:", error);
      toast.error("Could not copy page link.");
    }
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
        setPageStats((previousStats) => ({
          ...previousStats,
          [selectedPage.id]: {
            linkCount: (previousStats[selectedPage.id]?.linkCount || 0) + 1,
            clicks: previousStats[selectedPage.id]?.clicks || 0,
            clicksToday: previousStats[selectedPage.id]?.clicksToday || 0,
            clicksLast30Days: previousStats[selectedPage.id]?.clicksLast30Days || 0,
          },
        }));
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
      if (selectedPage) {
        const deletedLink = links.find((link) => link.id === id);
        setPageStats((previousStats) => ({
          ...previousStats,
          [selectedPage.id]: {
            linkCount: Math.max(
              0,
              (previousStats[selectedPage.id]?.linkCount || 0) - 1
            ),
            clicks: Math.max(
              0,
              (previousStats[selectedPage.id]?.clicks || 0) -
                (deletedLink?.clicks || 0)
            ),
            clicksToday: previousStats[selectedPage.id]?.clicksToday || 0,
            clicksLast30Days: previousStats[selectedPage.id]?.clicksLast30Days || 0,
          },
        }));
      }
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
  const isPagesListView = !isCreatingNew && !isEditingPage;
  const totalPageClicks = links.reduce((sum, link) => sum + (link.clicks || 0), 0);
  const totalBioLinks = Object.values(pageStats).reduce(
    (sum, stats) => sum + stats.linkCount,
    0
  );
  const totalBioClicks = Object.values(pageStats).reduce(
    (sum, stats) => sum + stats.clicks,
    0
  );
  const bioClicksToday = Object.values(pageStats).reduce(
    (sum, stats) => sum + stats.clicksToday,
    0
  );
  const bioClicksLast30Days = Object.values(pageStats).reduce(
    (sum, stats) => sum + stats.clicksLast30Days,
    0
  );
  const pageOverview = [
    {
      label: "Total pages",
      value: pages.length.toLocaleString(),
      detail: "Your published pages",
      icon: FileText,
      color: "border-indigo-400 text-indigo-300 bg-indigo-500/15",
    },
    {
      label: "Link clicks today",
      value: clickAnalyticsUnavailable ? "—" : bioClicksToday.toLocaleString(),
      detail: clickAnalyticsUnavailable ? "Analytics unavailable" : "Since midnight",
      icon: MousePointerClick,
      color: "border-emerald-400 text-emerald-300 bg-emerald-500/15",
    },
    {
      label: "Link clicks (30d)",
      value: clickAnalyticsUnavailable ? "—" : bioClicksLast30Days.toLocaleString(),
      detail: clickAnalyticsUnavailable ? "Analytics unavailable" : "Last 30 days",
      icon: MousePointerClick,
      color: "border-violet-400 text-violet-300 bg-violet-500/15",
    },
    {
      label: "Total links",
      value: totalBioLinks.toLocaleString(),
      detail: `${totalBioClicks.toLocaleString()} clicks all time`,
      icon: Globe,
      color: "border-amber-400 text-amber-300 bg-amber-500/15",
    },
  ];
  const filteredTemplates = BIO_TEMPLATES.filter((template) => {
    const matchesCategory =
      templateCategory === "All" || template.category === templateCategory;
    const query = templateSearch.trim().toLowerCase();
    const matchesSearch =
      !query ||
      `${template.name} ${template.category} ${template.description}`
        .toLowerCase()
        .includes(query);
    return matchesCategory && matchesSearch;
  });
  const filteredPages = pages.filter((page) => {
    const stats = pageStats[page.id] || {
      linkCount: 0,
      clicks: 0,
      clicksToday: 0,
      clicksLast30Days: 0,
    };
    const matchesSearch = `${page.title} ${page.username}`
      .toLowerCase()
      .includes(pageSearch.trim().toLowerCase());
    const matchesFilter =
      pageFilter === "all" ||
      (pageFilter === "with-links" && stats.linkCount > 0) ||
      (pageFilter === "without-links" && stats.linkCount === 0);
    return matchesSearch && matchesFilter;
  });

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
        <Image
          src="/logo.png"
          alt="urlyu.com logo"
          width={32}
          height={32}
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

      {/* Main content area with visual effects */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-7 sm:py-9 w-full flex-1 relative z-10 space-y-6 sm:space-y-7">
        {isPagesListView ? (
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">Pages</h1>
              <p className="text-xs sm:text-sm text-slate-300/80 mt-2 max-w-2xl">
                Create beautiful bio pages and mini websites.
              </p>
            </div>
            <button
              onClick={resetFormToNew}
              className="flex w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-xs font-bold text-white shadow-lg shadow-indigo-500/20 transition-all hover:bg-indigo-500 active:scale-[0.98] sm:w-auto sm:text-sm"
            >
              <Plus className="w-4 h-4" />
              <span>New Page</span>
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
                {isCreatingNew ? "Create new page" : `Edit ${selectedPage?.title || "page"}`}
              </h1>
              <p className="mt-2 text-xs text-slate-300/80 sm:text-sm">
                Customize your page and its links.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setIsTemplateGalleryOpen(false);
                setIsCreatingNew(false);
                setIsEditingPage(false);
                router.push("/dashboard/pages");
              }}
              className="w-full shrink-0 rounded-xl border border-slate-700 bg-slate-900/70 px-4 py-3 text-xs font-semibold text-slate-200 transition hover:border-indigo-400/40 hover:bg-indigo-500/10 sm:w-auto sm:text-sm"
            >
              Back to pages
            </button>
          </div>
        )}

        {isPagesListView && pages.length > 0 && (
          <section
            aria-label="Page overview"
            className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4"
          >
            {pageOverview.map(({ label, value, detail, icon: Icon, color }) => (
              <article
                key={label}
                className="relative flex min-h-28 items-center justify-between overflow-hidden rounded-2xl border border-slate-700/70 border-l-[3px] bg-[#1b2537] p-4 shadow-lg shadow-black/10"
              >
                <div>
                  <p className="text-xs font-medium text-slate-400">{label}</p>
                  <p className="mt-1 text-2xl font-bold tracking-tight text-white">
                    {value}
                  </p>
                  <p className="mt-1 text-[10px] text-slate-500">{detail}</p>
                </div>
                <span
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border ${color}`}
                >
                  <Icon aria-hidden="true" className="h-5 w-5" />
                </span>
              </article>
            ))}
          </section>
        )}

        {/* Page list */}
        {isPagesListView && pages.length > 0 && (
          <>
            <section className="manager-panel overflow-hidden rounded-2xl">
              <button
                type="button"
                aria-expanded={showPageFilters}
                onClick={() => setShowPageFilters((isOpen) => !isOpen)}
                className="flex w-full items-center justify-between gap-4 px-4 py-4 text-left transition hover:bg-white/[.02] sm:px-5"
              >
                <span className="flex min-w-0 items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-indigo-400/20 bg-indigo-500/10 text-indigo-300">
                    <Filter aria-hidden="true" className="h-4 w-4" />
                  </span>
                  <span>
                    <span className="block text-sm font-bold text-white">Page filters</span>
                    <span className="mt-0.5 block text-xs text-slate-400">
                      Refine the pages shown below
                    </span>
                  </span>
                </span>
                <span className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-indigo-400/40 px-3 py-2 text-xs font-semibold text-indigo-200 transition hover:bg-indigo-500/10">
                  {showPageFilters ? "Hide filters" : "Show filters"}
                  <ChevronDown
                    aria-hidden="true"
                    className={`h-3.5 w-3.5 transition-transform ${showPageFilters ? "rotate-180" : ""}`}
                  />
                </span>
              </button>
              {showPageFilters && (
                <div className="grid gap-3 border-t border-slate-700/70 bg-slate-950/25 p-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:px-5">
                  <label className="relative block">
                    <Search
                      aria-hidden="true"
                      className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
                    />
                    <input
                      type="search"
                      value={pageSearch}
                      onChange={(event) => setPageSearch(event.target.value)}
                      placeholder="Search by page name or username..."
                      aria-label="Search pages"
                      className="w-full rounded-xl border border-slate-700 bg-slate-950/60 py-2.5 pl-10 pr-3 text-xs text-white placeholder:text-slate-500 outline-none transition focus:border-indigo-400/60 focus:ring-2 focus:ring-indigo-400/10"
                    />
                  </label>
                  <div className="flex flex-wrap gap-2" aria-label="Filter pages">
                    {([
                      ["all", "All pages"],
                      ["with-links", "With links"],
                      ["without-links", "No links"],
                    ] as const).map(([value, label]) => (
                      <button
                        key={value}
                        type="button"
                        aria-pressed={pageFilter === value}
                        onClick={() => setPageFilter(value)}
                        className={`rounded-full border px-3 py-2 text-[11px] font-semibold transition ${
                          pageFilter === value
                            ? "border-indigo-400/50 bg-indigo-500/15 text-indigo-200"
                            : "border-slate-700 bg-slate-900/70 text-slate-400 hover:border-slate-500 hover:text-white"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </section>

          <section className="manager-panel overflow-hidden rounded-2xl">
            <header className="flex items-center justify-between border-b border-slate-700/70 bg-slate-900/35 px-4 py-4 sm:px-5">
              <div>
                <h3 className="text-sm font-bold text-white sm:text-base">Pages List</h3>
              </div>
              <span className="inline-flex items-center gap-2 rounded-full border border-indigo-400/20 bg-indigo-500/10 px-3 py-1.5 text-[11px] font-semibold text-indigo-200">
                <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
                {filteredPages.length} {filteredPages.length === 1 ? "item" : "items"} visible
              </span>
            </header>
            <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 sm:p-5 xl:grid-cols-3">
              {filteredPages.length > 0 ? filteredPages.map((page) => {
                const isSelected = selectedPage?.id === page.id && isEditingPage;
                const stats = pageStats[page.id] || {
                  linkCount: 0,
                  clicks: 0,
                  clicksToday: 0,
                  clicksLast30Days: 0,
                };
                return (
                  <article
                    key={page.id}
                    className={`group overflow-hidden rounded-2xl border transition-all duration-300 ${
                      isSelected
                        ? "border-indigo-400/50 bg-slate-900/90 shadow-xl shadow-indigo-950/25 ring-1 ring-indigo-400/15"
                        : "border-slate-700/70 bg-slate-900/70 hover:border-indigo-400/35 hover:shadow-xl hover:shadow-black/20"
                    }`}
                  >
                    <div className="relative border-b border-indigo-300/10 bg-gradient-to-br from-indigo-500/[.16] via-violet-500/[.1] to-slate-900/20 p-4">
                      <div className="flex items-start gap-3">
                        {page.avatar_url ? (
                          <Image
                            src={page.avatar_url}
                            alt={page.title}
                            width={40}
                            height={40}
                            className="h-10 w-10 shrink-0 rounded-xl border border-white/15 object-cover shadow-md"
                          />
                        ) : (
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-indigo-300/20 bg-indigo-500/15 text-indigo-200">
                            <FileText aria-hidden="true" className="h-4 w-4" />
                          </span>
                        )}
                        <div className="min-w-0 flex-1">
                          <h4 className="truncate text-sm font-bold text-white transition-colors group-hover:text-indigo-200">
                            {page.title}
                          </h4>
                          <div className="mt-1 flex min-w-0 items-center gap-1">
                            <p className="truncate text-xs text-slate-400">
                              {origin}/{page.username}
                            </p>
                            <button
                              type="button"
                              onClick={() => void handleCopyPageUrl(page)}
                              aria-label={`Copy link for ${page.title}`}
                              title="Copy page link"
                              className="shrink-0 rounded p-1 text-slate-500 transition hover:bg-white/[.08] hover:text-indigo-200"
                            >
                              <Copy aria-hidden="true" className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                        <button
                          type="button"
                          aria-label={`Open actions for ${page.title}`}
                          aria-expanded={openPageMenuId === page.id}
                          onClick={() =>
                            setOpenPageMenuId((openId) => openId === page.id ? null : page.id)
                          }
                          className="rounded-lg p-2 text-slate-400 transition hover:bg-white/[.08] hover:text-white"
                        >
                          <MoreVertical aria-hidden="true" className="h-4 w-4" />
                        </button>
                        {openPageMenuId === page.id && (
                          <div className="absolute right-4 top-14 z-20 min-w-36 rounded-xl border border-slate-700 bg-slate-900 p-1.5 shadow-2xl shadow-black/40">
                            <button
                              type="button"
                              onClick={() => {
                                setOpenPageMenuId(null);
                                router.push(`/dashboard/pages/${page.id}`);
                              }}
                              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-medium text-slate-200 transition hover:bg-indigo-500/10 hover:text-indigo-200"
                            >
                              <Pencil aria-hidden="true" className="h-3.5 w-3.5" />
                              Edit page
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setOpenPageMenuId(null);
                                openDeleteModal(page.id);
                              }}
                              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-medium text-rose-300 transition hover:bg-rose-500/10"
                            >
                              <Trash2 aria-hidden="true" className="h-3.5 w-3.5" />
                              Delete page
                            </button>
                          </div>
                        )}
                      </div>
                      <div className="mt-4 flex items-center justify-between gap-3">
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/15 bg-emerald-400/[.08] px-2.5 py-1 text-[10px] font-semibold text-emerald-300">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                          Active
                        </span>
                        <time
                          dateTime={page.created_at}
                          className="text-[10px] text-slate-500"
                        >
                          {new Date(page.created_at).toLocaleDateString(undefined, {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </time>
                      </div>
                    </div>
                    <div className="p-4">
                      <div className="grid grid-cols-2 divide-x divide-slate-700/70 rounded-xl border border-slate-700/60 bg-slate-950/35 py-3">
                        <div className="px-3 text-center">
                          <p className="text-lg font-bold leading-5 text-indigo-300">
                            {stats.linkCount}
                          </p>
                          <p className="mt-1 text-[10px] text-slate-400">
                            {stats.linkCount === 1 ? "link" : "links"}
                          </p>
                        </div>
                        <div className="px-3 text-center">
                          <p className="text-lg font-bold leading-5 text-violet-300">
                            {stats.clicks.toLocaleString()}
                          </p>
                          <p className="mt-1 text-[10px] text-slate-400">clicks</p>
                        </div>
                      </div>
                      <div className="mt-3 grid grid-cols-2 gap-2">
                        <a
                          href={`/${page.username}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-indigo-400/15 bg-indigo-500/10 px-3 py-2 text-[11px] font-semibold text-indigo-200 transition hover:border-indigo-400/30 hover:bg-indigo-500/20"
                        >
                          <Eye aria-hidden="true" className="h-3.5 w-3.5" />
                          View
                        </a>
                        <button
                          type="button"
                          onClick={() => router.push(`/dashboard/pages/${page.id}`)}
                          className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-violet-400/15 bg-violet-500/10 px-3 py-2 text-[11px] font-semibold text-violet-200 transition hover:border-violet-400/30 hover:bg-violet-500/20"
                        >
                          <Pencil aria-hidden="true" className="h-3.5 w-3.5" />
                          Edit
                        </button>
                      </div>
                    </div>
                  </article>
                );
              }) : (
                <div className="col-span-full rounded-xl border border-dashed border-slate-700 px-4 py-10 text-center">
                  <Search aria-hidden="true" className="mx-auto h-5 w-5 text-slate-500" />
                  <p className="mt-2 text-sm font-semibold text-slate-300">No pages found</p>
                  <p className="mt-1 text-xs text-slate-500">Try another search or filter.</p>
                </div>
              )}
            </div>
          </section>
          </>
        )}

        {(isEditingPage || isCreatingNew) && (
        <>
        {/* Banner URL & Quick Stats */}
        {isEditingPage && selectedPage && !isCreatingNew && username && (
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

            <section
              aria-labelledby="bio-template-heading"
              className="flex items-center gap-4 rounded-2xl border border-slate-800 bg-slate-950/40 p-3"
            >
              <div
                className="h-24 w-16 shrink-0 overflow-hidden rounded-lg border border-white/10"
                style={{ background: BIO_TEMPLATES.find((template) => template.id === themeColor)?.background || "#070913" }}
              >
                <TemplateArtwork
                  template={
                    BIO_TEMPLATES.find((template) => template.id === themeColor) ||
                    BIO_TEMPLATES[0]
                  }
                />
              </div>
              <div className="min-w-0 flex-1">
                <h3 id="bio-template-heading" className="text-sm font-semibold text-white">
                  {BIO_TEMPLATES.find((template) => template.id === themeColor)?.name ||
                    "Custom color theme"}
                </h3>
                <p className="mt-1 text-xs text-slate-400">
                  {BIO_TEMPLATES.find((template) => template.id === themeColor)?.description ||
                    "Your existing page style is preserved."}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsTemplateGalleryOpen(true)}
                className="shrink-0 rounded-xl border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-200 transition hover:border-indigo-400 hover:bg-indigo-500/10"
              >
                Browse templates
              </button>
            </section>

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
        {isEditingPage && selectedPage && !isCreatingNew && (
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
        </>
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

      {isTemplateGalleryOpen && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-[#050711]/85 p-2 backdrop-blur-xl sm:p-5"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setIsTemplateGalleryOpen(false);
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="template-gallery-title"
            className="flex max-h-[94vh] w-full max-w-7xl flex-col overflow-hidden rounded-3xl border border-white/10 bg-[#0c1020] shadow-[0_32px_120px_-30px_rgba(0,0,0,.9)]"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <header className="flex shrink-0 items-center justify-between gap-4 border-b border-indigo-400/15 bg-gradient-to-r from-[#11152d] via-[#20234b] to-[#312e81] px-5 py-4 sm:px-7">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/20 bg-white/10 text-white">
                  <Sparkles aria-hidden="true" className="h-5 w-5" />
                </span>
                <div>
                  <h2
                    id="template-gallery-title"
                    className="text-base font-bold text-white sm:text-lg"
                  >
                    How would you like to start?
                  </h2>
                  <p className="mt-0.5 text-xs text-white/75 sm:text-sm">
                    Build from scratch or get inspired by one of our ready-made templates.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsTemplateGalleryOpen(false)}
                aria-label="Close template gallery"
                className="rounded-lg p-2 text-white/80 transition hover:bg-white/15 hover:text-white"
              >
                <X aria-hidden="true" className="h-5 w-5" />
              </button>
            </header>

            <div className="shrink-0 border-b border-white/[.08] bg-[#101426] px-4 py-4 sm:px-6">
              <div className="relative mb-3">
                <Search
                  aria-hidden="true"
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="search"
                  value={templateSearch}
                  onChange={(event) => setTemplateSearch(event.target.value)}
                  placeholder="Search templates..."
                  aria-label="Search templates"
                  className="w-full rounded-xl border border-white/10 bg-white/[.04] py-3 pl-10 pr-4 text-sm text-white placeholder:text-slate-500 transition focus:border-indigo-400/70 focus:bg-white/[.07] focus:outline-none focus:ring-4 focus:ring-indigo-400/10"
                />
              </div>

              <div
                aria-label="Template categories"
                className="template-category-scroll flex gap-2 overflow-x-auto pb-1"
              >
                {BIO_TEMPLATE_CATEGORIES.map((category) => (
                  <button
                    key={category}
                    type="button"
                    onClick={() => setTemplateCategory(category)}
                    aria-pressed={templateCategory === category}
                    className={`shrink-0 rounded-full border px-3 py-1.5 text-[11px] font-semibold transition ${
                      templateCategory === category
                        ? "border-indigo-400 bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-950/30"
                        : "border-white/10 bg-white/[.03] text-slate-300 hover:border-indigo-300/35 hover:bg-indigo-500/[.08] hover:text-white"
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>

            <div className="template-gallery-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain bg-gradient-to-b from-[#101426] to-[#0b0e19] p-4 sm:p-6">
              {filteredTemplates.length > 0 ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredTemplates.map((template) => (
                    <article
                      key={template.id}
                      className="group overflow-hidden rounded-2xl border border-white/10 bg-[#111627] shadow-lg shadow-black/10 transition duration-300 hover:-translate-y-0.5 hover:border-indigo-400/50 hover:shadow-xl hover:shadow-indigo-950/25"
                    >
                      <div className="relative h-[300px] overflow-hidden sm:h-[320px]">
                        <TemplateArtwork template={template} />
                        <div className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-2 bg-gradient-to-t from-slate-950/95 via-slate-950/75 to-transparent p-3 pt-10 opacity-100 transition-opacity sm:inset-0 sm:flex-col sm:bg-slate-950/65 sm:p-4 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
                          <button
                            type="button"
                            onClick={() => applyTemplate(template)}
                            className="flex w-1/2 max-w-48 items-center justify-center gap-1.5 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 px-2 py-2 text-[10px] font-bold text-white shadow-lg shadow-indigo-950/30 transition hover:brightness-110 sm:w-full sm:gap-2 sm:px-4 sm:py-2.5 sm:text-xs"
                          >
                            <Sparkles aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
                            Use this template
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setPreviewTemplate(template);
                              setIsTemplateGalleryOpen(false);
                            }}
                            className="flex w-1/2 max-w-48 items-center justify-center gap-1.5 rounded-full border border-white/30 bg-slate-800/90 px-2 py-2 text-[10px] font-semibold text-white transition hover:bg-slate-700 sm:w-full sm:gap-2 sm:px-4 sm:py-2.5 sm:text-xs"
                          >
                            <ExternalLink aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
                            View demo
                          </button>
                        </div>
                      </div>
                      <div className="min-h-[76px] border-t border-slate-700/80 px-4 py-3">
                        <div className="flex items-start justify-between gap-3">
                          <h3 className="text-sm font-bold text-slate-100">{template.name}</h3>
                          <span className="shrink-0 rounded-full border border-indigo-300/15 bg-indigo-400/[.08] px-2 py-0.5 text-[9px] font-semibold text-indigo-200">
                            {template.category}
                          </span>
                        </div>
                        <p className="mt-1.5 text-xs leading-5 text-slate-400">
                          {template.description}
                        </p>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-600 py-16 text-center">
                  <Search aria-hidden="true" className="mx-auto h-6 w-6 text-slate-500" />
                  <p className="mt-3 text-sm font-medium text-slate-300">
                    No templates found
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Try another search or choose a different category.
                  </p>
                </div>
              )}
            </div>
          </section>
        </div>
      )}

      {previewTemplate && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/85 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setPreviewTemplate(null);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="template-preview-title"
            className="flex max-h-[92vh] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <header className="flex items-center justify-between border-b border-slate-700 px-4 py-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-300">
                  {previewTemplate.category}
                </p>
                <h2 id="template-preview-title" className="mt-1 text-sm font-bold text-white">
                  {previewTemplate.name}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setPreviewTemplate(null)}
                aria-label="Close preview"
                className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-800 hover:text-white"
              >
                <X aria-hidden="true" className="h-5 w-5" />
              </button>
            </header>
            <div className="template-gallery-scroll h-[55vh] overflow-y-auto overscroll-contain">
              <TemplateArtwork template={previewTemplate} />
            </div>
            <div className="flex flex-col-reverse gap-2 border-t border-slate-700 p-4 sm:flex-row sm:justify-between">
              <button
                type="button"
                onClick={() => {
                  setPreviewTemplate(null);
                  setIsTemplateGalleryOpen(true);
                }}
                className="rounded-xl border border-slate-700 px-4 py-2.5 text-xs font-semibold text-slate-300 transition hover:border-slate-500 hover:text-white"
              >
                Back to templates
              </button>
              <button
                type="button"
                onClick={() => applyTemplate(previewTemplate)}
                className="rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2.5 text-xs font-bold text-white transition hover:brightness-110"
              >
                Use this template
              </button>
            </div>
          </section>
        </div>
      )}
      <SiteFooter />
    </div>
  );
}