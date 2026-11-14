import type { Metadata } from "next";
import Link from "next/link";
import PublicContentLayout from "@/components/PublicContentLayout";

export const metadata: Metadata = {
  title: "Privacy Policy | urlyu.com",
  description: "Learn what data urlyu.com processes, how analytics and VIP payments work, and what choices you have.",
};

export default function PrivacyPage() {
  return (
    <PublicContentLayout
      title="Privacy Policy"
      description="This policy explains what information is processed when you use urlyu.com, why it is used, and how to contact the team."
    >
      <p className="rounded-2xl border border-indigo-400/20 bg-indigo-500/[0.06] p-5 text-sm leading-7 text-slate-300 sm:p-6">
        urlyu.com is operated under the name urlyu. We process information as needed to provide
        accounts, links, bio pages, security, and the features you choose. This policy reflects the
        features currently available in the application.
      </p>

      <section className="rounded-2xl border border-slate-700/70 bg-slate-900/55 p-5 sm:p-6">
        <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-indigo-300">01 · Data</span>
        <h2 className="mt-2 text-xl font-bold text-white">Information we process</h2>
        <ul className="mt-3 list-disc space-y-3 pl-5 text-sm leading-7 text-slate-300">
          <li>
            <strong className="text-slate-100">Account:</strong> your email address and basic
            account information provided during registration or sign-in, including identity
            information returned by Google if you choose Google sign-in.
          </li>
          <li>
            <strong className="text-slate-100">Content you create:</strong> your username, profile
            description and image, links, page settings, custom domains, and other settings you save.
          </li>
          <li>
            <strong className="text-slate-100">Link activity:</strong> click counts and timestamps,
            and the referring hostname when available, to show link owners their statistics. When a
            password-protected link check fails, the system stores a hashed IP address and an
            attempt record to help prevent abuse. Older records are cleaned up when the security
            process for a protected link runs.
          </li>
          <li>
            <strong className="text-slate-100">VIP membership:</strong> subscription status and
            PayPal identifiers needed to check membership. PayPal handles payment processing and
            card information; urlyu does not store your card details.
          </li>
        </ul>
      </section>

      <section className="rounded-2xl border border-slate-700/70 bg-slate-900/55 p-5 sm:p-6">
        <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-indigo-300">02 · Purpose</span>
        <h2 className="mt-2 text-xl font-bold text-white">How we use information</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-7 text-slate-300">
          <li>Authenticate accounts and provide the features you request.</li>
          <li>Display profiles and links you choose to make public.</li>
          <li>Provide click statistics to link owners and help secure links.</li>
          <li>Process and verify VIP membership status.</li>
          <li>Diagnose service issues and understand general usage through Vercel Analytics.</li>
        </ul>
        <p className="mt-3 text-sm leading-7 text-slate-300">
          When you verify a custom domain, the application asks Google Public DNS to check the
          domain&apos;s DNS records.
        </p>
      </section>

      <section className="rounded-2xl border border-slate-700/70 bg-slate-900/55 p-5 sm:p-6">
        <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-indigo-300">03 · Providers</span>
        <h2 className="mt-2 text-xl font-bold text-white">Service providers and sharing</h2>
        <p className="mt-3 text-sm leading-7 text-slate-300">
          The application uses Supabase for authentication and data storage, Vercel for hosting and
          usage analytics, Google for sign-in or DNS checks you request, and PayPal for VIP
          subscriptions. These providers process information as needed to provide their services
          and under their own privacy policies. urlyu does not sell your account information.
        </p>
        <p className="mt-3 text-sm leading-7 text-slate-300">
          VIP status changes the ad setting on bio pages. The current application code does not
          include a third-party advertising network. If one is added, this policy should be updated
          to identify the provider and explain its data practices.
        </p>
      </section>

      <section className="rounded-2xl border border-slate-700/70 bg-slate-900/55 p-5 sm:p-6">
        <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-indigo-300">04 · Your choices</span>
        <h2 className="mt-2 text-xl font-bold text-white">Public content and your choices</h2>
        <p className="mt-3 text-sm leading-7 text-slate-300">
          Bio pages and links you publish can be viewed by anyone who has their URLs. Do not include
          confidential information or another person&apos;s personal data without permission. You
          can edit or remove content through the available dashboard features. For account or data
          requests you cannot manage yourself, contact the{" "}
          <Link href="/contact" className="font-semibold text-indigo-300 hover:text-indigo-200">team</Link>.
        </p>
      </section>

      <section className="rounded-2xl border border-slate-700/70 bg-slate-900/55 p-5 sm:p-6">
        <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-indigo-300">05 · Safeguards</span>
        <h2 className="mt-2 text-xl font-bold text-white">Storage and security</h2>
        <p className="mt-3 text-sm leading-7 text-slate-300">
          Account and content data are kept for as long as needed to provide the service or meet
          operational requirements. We use access controls and appropriate safeguards, but no
          internet service can guarantee absolute security. Data may also remain temporarily in
          backups or provider logs under their policies.
        </p>
      </section>

      <section className="rounded-2xl border border-slate-700/70 bg-slate-900/55 p-5 sm:p-6">
        <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-indigo-300">06 · Browser data</span>
        <h2 className="mt-2 text-xl font-bold text-white">Cookies, sessions, and analytics</h2>
        <p className="mt-3 text-sm leading-7 text-slate-300">
          Session information is stored in your browser so you can stay signed in and use your
          account. Vercel Analytics helps us understand site usage. Restricting local storage or
          cookies in your browser may affect some sign-in features.
        </p>
      </section>

      <section className="rounded-2xl border border-slate-700/70 bg-slate-900/55 p-5 sm:p-6">
        <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-indigo-300">07 · Contact</span>
        <h2 className="mt-2 text-xl font-bold text-white">Updates and questions</h2>
        <p className="mt-3 text-sm leading-7 text-slate-300">
          This policy may be updated when the service or its data practices change. Send questions
          or privacy requests through the{" "}
          <Link href="/contact" className="font-semibold text-indigo-300 hover:text-indigo-200">contact page</Link>.
        </p>
      </section>
    </PublicContentLayout>
  );
}
