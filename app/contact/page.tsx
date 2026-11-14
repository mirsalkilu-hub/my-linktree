import type { Metadata } from "next";
import { ArrowUpRight, FileQuestion, LifeBuoy, ShieldCheck } from "lucide-react";
import PublicContentLayout from "@/components/PublicContentLayout";

export const metadata: Metadata = {
  title: "Contact urlyu.com",
  description: "Contact the urlyu.com team for help, questions about the service, or reports.",
};

export default function ContactPage() {
  return (
    <PublicContentLayout
      title="Contact"
      description="Have a question or run into an issue with urlyu.com? Reach the team through the contact website below."
    >
      <section className="relative overflow-hidden rounded-3xl border border-indigo-400/20 bg-gradient-to-br from-indigo-950/65 via-slate-900 to-slate-950 p-6 sm:p-8">
        <div className="pointer-events-none absolute -right-10 -top-20 h-56 w-56 rounded-full bg-indigo-500/15 blur-3xl" />
        <div className="relative grid gap-6 sm:grid-cols-[1fr_auto] sm:items-center">
          <div>
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-indigo-400/25 bg-indigo-500/10 text-indigo-300">
              <LifeBuoy aria-hidden="true" className="h-6 w-6" />
            </span>
            <h2 className="mt-4 text-xl font-bold text-white">Get in touch</h2>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-300">
              For account help, feature questions, or reports about a problematic link, visit the
              team&apos;s contact website. Include your username or the relevant URL and a brief
              explanation so the request can be handled more easily.
            </p>
          </div>
          <a
            href="https://portfolio.gameskilu.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-950/40 transition hover:-translate-y-0.5 hover:bg-indigo-500"
          >
            Contact the team
            <ArrowUpRight aria-hidden="true" className="h-4 w-4" />
          </a>
        </div>
        <p className="relative mt-5 break-all border-t border-white/10 pt-4 text-xs text-slate-400">
          portfolio.gameskilu.com
        </p>
      </section>

      <section className="grid gap-3 sm:grid-cols-2">
        <article className="rounded-2xl border border-slate-700/70 bg-slate-900/55 p-5">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-sky-400/20 bg-sky-500/10 text-sky-300">
            <FileQuestion aria-hidden="true" className="h-5 w-5" />
          </span>
          <h2 className="mt-4 text-sm font-bold text-white">Help with your account</h2>
          <p className="mt-2 text-xs leading-6 text-slate-400">
            Share the affected username and a short description of the issue. Never include your password.
          </p>
        </article>
        <article className="rounded-2xl border border-slate-700/70 bg-slate-900/55 p-5">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-400/20 bg-emerald-500/10 text-emerald-300">
            <ShieldCheck aria-hidden="true" className="h-5 w-5" />
          </span>
          <h2 className="mt-4 text-sm font-bold text-white">Privacy or security reports</h2>
          <p className="mt-2 text-xs leading-6 text-slate-400">
            Use the same channel for personal-data requests or to report suspected misuse. The team may ask for details to verify ownership.
          </p>
        </article>
      </section>
    </PublicContentLayout>
  );
}
