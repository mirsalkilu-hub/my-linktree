import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BarChart3, Link2, PanelsTopLeft, QrCode, Sparkles } from "lucide-react";
import PublicContentLayout from "@/components/PublicContentLayout";

export const metadata: Metadata = {
  title: "About urlyu.com",
  description: "Learn about urlyu.com, a service for managing short links and bio pages in one place.",
};

const features = [
  {
    title: "Short links",
    description: "Turn long web addresses into concise links that are easier to share and manage.",
    icon: Link2,
    tone: "border-indigo-400/20 bg-indigo-500/10 text-indigo-300",
  },
  {
    title: "Bio pages",
    description: "Introduce yourself and bring your important links together on one page.",
    icon: PanelsTopLeft,
    tone: "border-violet-400/20 bg-violet-500/10 text-violet-300",
  },
  {
    title: "Click insights",
    description: "Review click activity to understand how people interact with your links.",
    icon: BarChart3,
    tone: "border-sky-400/20 bg-sky-500/10 text-sky-300",
  },
  {
    title: "QR codes and domains",
    description: "Share links with QR codes or use a verified custom domain with active VIP.",
    icon: QrCode,
    tone: "border-amber-400/20 bg-amber-500/10 text-amber-300",
  },
];

export default function AboutPage() {
  return (
    <PublicContentLayout
      title="About Us"
      description="urlyu.com helps creators, professionals, and businesses organize links and share their online presence."
    >
      <section className="relative overflow-hidden rounded-3xl border border-slate-700/70 bg-gradient-to-br from-slate-900 to-indigo-950/40 p-6 sm:p-8">
        <div className="pointer-events-none absolute -right-10 -top-20 h-56 w-56 rounded-full bg-indigo-500/10 blur-3xl" />
        <div className="relative max-w-3xl">
          <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.15em] text-indigo-300">
            <Sparkles aria-hidden="true" className="h-4 w-4" />
            A simpler way to share
          </span>
          <h2 className="mt-3 text-2xl font-bold text-white">What is urlyu.com?</h2>
          <p className="mt-3 text-sm leading-7 text-slate-300">
            urlyu.com is a link and bio-page management service operated by the urlyu team. Our goal
            is to help you share shorter web addresses, bring multiple channels together on one page,
            and understand basic engagement with the links you manage.
          </p>
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.15em] text-indigo-300">Tools for sharing</p>
            <h2 className="mt-2 text-xl font-bold text-white">Everything in one workspace</h2>
          </div>
          <span className="hidden text-xs text-slate-500 sm:block">Made to keep links organized</span>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {features.map(({ title, description, icon: Icon, tone }) => (
            <article key={title} className="group rounded-2xl border border-slate-700/70 bg-slate-900/55 p-5 transition hover:-translate-y-0.5 hover:border-indigo-400/30">
              <span className={`flex h-11 w-11 items-center justify-center rounded-xl border ${tone}`}>
                <Icon aria-hidden="true" className="h-5 w-5" />
              </span>
              <h3 className="mt-4 text-sm font-bold text-white">{title}</h3>
              <p className="mt-2 text-xs leading-6 text-slate-400">{description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-slate-700/70 bg-slate-900/45 p-6 sm:p-8">
        <p className="text-xs font-bold uppercase tracking-[0.15em] text-indigo-300">How it works</p>
        <h2 className="mt-2 text-xl font-bold text-white">From setup to sharing</h2>
        <ol className="mt-5 grid gap-3 sm:grid-cols-3">
          {[
            ["01", "Create", "Set up an account and choose the links you want to manage."],
            ["02", "Customize", "Add context to your bio page and organize its links."],
            ["03", "Share", "Publish your URL or QR code and review link activity."],
          ].map(([step, title, description]) => (
            <li key={step} className="rounded-2xl border border-slate-700/70 bg-slate-950/60 p-4">
              <span className="text-xs font-black tracking-[0.15em] text-indigo-300">{step}</span>
              <h3 className="mt-3 text-sm font-bold text-white">{title}</h3>
              <p className="mt-2 text-xs leading-5 text-slate-400">{description}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="flex flex-col gap-4 rounded-2xl border border-indigo-400/20 bg-indigo-500/[0.06] p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div>
          <h2 className="text-lg font-bold text-white">The team and your responsibilities</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
            The service is operated under the name urlyu. Account owners are responsible for their
            profile content, link destinations, and their right to share that content.
          </p>
        </div>
        <Link href="/contact" className="inline-flex shrink-0 items-center gap-2 text-sm font-semibold text-indigo-300 transition hover:text-indigo-200">
          Contact the team <ArrowRight aria-hidden="true" className="h-4 w-4" />
        </Link>
      </section>
    </PublicContentLayout>
  );
}
