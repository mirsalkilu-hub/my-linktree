import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRight, Sparkles } from "lucide-react";
import SiteFooter from "@/components/SiteFooter";

export default function PublicContentLayout({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <div className="site-shell flex min-h-screen flex-col text-white">
      <header className="app-header sticky top-0 z-50 w-full border-b">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-5 px-5 py-4 sm:px-8">
          <Link href="/" className="inline-flex shrink-0 items-center gap-3">
            <Image src="/logo.png" alt="" width={36} height={36} className="h-9 w-9 rounded-xl object-contain" />
            <span className="text-lg font-black tracking-wide text-white">
              urlyu<span className="text-indigo-400">.com</span>
            </span>
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 space-y-7 px-5 py-8 sm:px-8 sm:py-12">
        <section className="dashboard-hero relative overflow-hidden rounded-[2rem] px-6 py-9 sm:px-10 sm:py-12">
          <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-indigo-500/15 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-28 left-1/3 h-56 w-56 rounded-full bg-violet-500/10 blur-3xl" />
          <div className="relative max-w-4xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-indigo-400/25 bg-indigo-500/10 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-indigo-200">
              <Sparkles aria-hidden="true" className="h-3.5 w-3.5" />
              urlyu.com · Resources
            </span>
            <h1 className="mt-5 text-3xl font-black tracking-tight text-white sm:text-5xl">{title}</h1>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300 sm:text-base">{description}</p>
          </div>
        </section>
        <div className="space-y-5">{children}</div>
        <section className="relative flex flex-col gap-5 overflow-hidden rounded-3xl border border-indigo-400/20 bg-gradient-to-br from-indigo-950/65 via-slate-900 to-violet-950/45 p-6 shadow-xl shadow-indigo-950/20 sm:flex-row sm:items-center sm:justify-between sm:p-8">
          <div className="pointer-events-none absolute -right-12 -top-20 h-48 w-48 rounded-full bg-indigo-400/10 blur-3xl" />
          <div className="relative">
            <p className="text-xs font-bold uppercase tracking-[0.15em] text-indigo-300">Make every link count</p>
            <h2 className="mt-2 text-xl font-bold text-white">Ready to organize your links?</h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-300">
              Create a bio page or short link and bring your online presence together.
            </p>
          </div>
          <Link
            href="/register"
            className="relative inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-950/40 transition hover:-translate-y-0.5 hover:bg-indigo-500"
          >
            Get started
            <ArrowRight aria-hidden="true" className="h-4 w-4" />
          </Link>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
