"use client";

import Image from "next/image";
import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  BarChart3,
  Crown,
  FileText,
  Globe,
  LayoutDashboard,
  Link2,
  LogOut,
  Menu,
  ShieldCheck,
  X,
} from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { VIP_ADMIN_EMAIL } from "@/lib/vip-admin-config";

export default function DashboardHeader({ user }: { user: User | null }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setMobileMenuOpen(false);
    router.push("/");
  };

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/dashboard/links", label: "Links", icon: Link2 },
    { href: "/dashboard/pages", label: "Manage Pages", icon: FileText },
    { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
    { href: "/dashboard/domains", label: "Domains", icon: Globe },
    { href: "/dashboard/vip", label: "VIP", icon: Crown },
    ...(user?.email?.trim().toLowerCase() === VIP_ADMIN_EMAIL
      ? [{ href: "/dashboard/admin/vip", label: "Admin", icon: ShieldCheck }]
      : []),
  ];

  const isActive = (href: string) =>
    href === "/dashboard" ? pathname === href : pathname.startsWith(href);

  return (
    <header className="app-header sticky top-0 z-50 border-b transition-all">
      <div className="mx-auto grid h-16 max-w-7xl grid-cols-[auto_1fr_auto] items-center gap-3 px-4 sm:gap-4 sm:px-6 lg:px-8">
        <Link href="/dashboard" className="flex shrink-0 items-center gap-2.5">
          <Image
            src="/logo.png"
            alt="urlyu.com logo"
            width={32}
            height={32}
            className="h-8 w-8 rounded-lg object-contain"
          />
          <span className="text-xl font-black tracking-wider text-white sm:text-2xl">
            urlyu<span className="text-indigo-500">.com</span>
          </span>
        </Link>

        <nav aria-label="Dashboard" className="hidden min-w-0 flex-1 items-center justify-center gap-1 xl:flex">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              aria-current={isActive(href) ? "page" : undefined}
              className={`inline-flex shrink-0 items-center gap-1.5 rounded-xl border px-2.5 py-2 text-[11px] font-semibold transition-colors ${
                isActive(href)
                  ? "border-indigo-500/30 bg-indigo-500/15 text-indigo-300"
                  : "border-transparent text-slate-400 hover:border-slate-700 hover:bg-slate-900 hover:text-white"
              }`}
            >
              <Icon aria-hidden="true" className="h-3.5 w-3.5" />
              <span>{label}</span>
            </Link>
          ))}
        </nav>

        <div className="flex items-center justify-end gap-2">
          {user && (
            <div
              title={user.email || undefined}
              className="hidden h-9 w-9 items-center justify-center rounded-full bg-gradient-to-tr from-indigo-600 to-violet-500 text-xs font-bold uppercase text-white shadow-md shadow-indigo-500/20 sm:flex"
              aria-label={user.email ? `Signed in as ${user.email}` : "Signed in"}
              role="img"
            >
              {user.email?.[0] || "M"}
            </div>
          )}

          <button
            type="button"
            onClick={handleLogout}
            className="hidden items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2 text-xs font-semibold text-slate-200 transition-colors hover:border-slate-600 hover:bg-slate-800 hover:text-white xl:inline-flex"
          >
            <LogOut aria-hidden="true" className="h-4 w-4 text-slate-400" />
            <span>Log out</span>
          </button>

          <button
            type="button"
            onClick={() => setMobileMenuOpen((isOpen) => !isOpen)}
            aria-expanded={mobileMenuOpen}
            aria-controls={mobileMenuOpen ? "dashboard-mobile-menu" : undefined}
            aria-label={mobileMenuOpen ? "Close dashboard menu" : "Open dashboard menu"}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-700 bg-slate-900/70 text-slate-300 transition-colors hover:border-indigo-400/40 hover:bg-slate-800 hover:text-white xl:hidden"
          >
            {mobileMenuOpen ? (
              <X aria-hidden="true" className="h-5 w-5" />
            ) : (
              <Menu aria-hidden="true" className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div id="dashboard-mobile-menu" className="border-t border-slate-800/80 bg-[#0a0d18] px-4 py-4 font-sans sm:px-6 xl:hidden">
          <nav aria-label="Dashboard" className="mx-auto grid max-w-7xl grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {navItems.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                aria-current={isActive(href) ? "page" : undefined}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex min-w-0 items-center gap-3 rounded-xl border px-3.5 py-3 text-sm font-semibold transition-colors ${
                  isActive(href)
                    ? "border-indigo-500/40 bg-indigo-500/15 text-indigo-200"
                    : "border-slate-800 bg-slate-950/40 text-slate-300 hover:border-slate-700 hover:bg-slate-900 hover:text-white"
                }`}
              >
                <Icon aria-hidden="true" className="h-4 w-4 shrink-0" />
                <span className="truncate">{label}</span>
              </Link>
            ))}
          </nav>

          <div className="mx-auto mt-4 flex max-w-7xl items-center justify-between gap-3 border-t border-slate-800 pt-4">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-sm font-bold text-white">
                {user?.email?.[0]?.toUpperCase() || "M"}
              </div>
              <span className="truncate text-sm font-medium text-slate-300">
                {user?.email || ""}
              </span>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2.5 text-xs font-semibold text-slate-200 transition-colors hover:border-rose-500/40 hover:bg-rose-500/10 hover:text-rose-200"
            >
              <LogOut aria-hidden="true" className="h-3.5 w-3.5" />
              <span>Log out</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
