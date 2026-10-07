"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  BarChart3,
  Crown,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import type { User } from "@supabase/supabase-js";

export default function DashboardHeader({ user }: { user: User | null }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/dashboard/pages", label: "Manage Pages", icon: FileText },
    { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
    { href: "/dashboard/vip", label: "VIP", icon: Crown },
  ];

  const isActive = (href: string) =>
    href === "/dashboard" ? pathname === href : pathname.startsWith(href);

  return (
    <header className="app-header sticky top-0 z-50 border-b transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 flex items-center justify-between h-16">
        <div className="flex items-center space-x-3">
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

          <nav className="hidden md:flex items-center space-x-2 h-full py-3">
            {navItems.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  isActive(href)
                    ? "bg-indigo-600/20 text-indigo-400 border border-indigo-500/30"
                    : "text-slate-400 hover:text-white hover:bg-slate-900"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{label}</span>
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center space-x-3">
          {user && (
            <div className="hidden sm:flex items-center space-x-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center font-bold text-xs uppercase text-white shrink-0 shadow-md shadow-indigo-500/20">
                {user.email?.[0] || "M"}
              </div>
            </div>
          )}

          <button
            onClick={handleLogout}
            className="hidden md:flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-300 bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-slate-600 rounded-full transition-all duration-200"
          >
            <LogOut className="w-4 h-4 text-slate-400" />
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

      {mobileMenuOpen && (
        <div className="md:hidden bg-[#0a0d18] border-b border-slate-800/80 px-4 pt-4 pb-6 space-y-2 font-sans">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-semibold transition-all ${
                isActive(href)
                  ? "bg-[#181c42] text-indigo-300 border border-indigo-500/40"
                  : "text-slate-300 hover:bg-slate-900 hover:text-white"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{label}</span>
            </Link>
          ))}

          <div className="pt-4 mt-3 border-t border-slate-800/80 flex items-center justify-between">
            <div className="flex items-center space-x-3 overflow-hidden pr-2">
              <div className="w-9 h-9 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-sm text-white shrink-0">
                {user?.email?.[0]?.toUpperCase() || "M"}
              </div>
              <span className="text-sm font-medium text-slate-200 truncate">
                {user?.email || ""}
              </span>
            </div>

            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 rounded-full border border-slate-800 bg-slate-950/60 hover:bg-slate-800 text-slate-200 text-xs font-semibold shrink-0 transition-all"
            >
              <LogOut className="w-3.5 h-3.5 text-slate-300" />
              <span>Log out</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
