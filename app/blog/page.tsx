import type { Metadata } from "next";
import { ArrowDown, ArrowRight, Link2, PanelsTopLeft, QrCode } from "lucide-react";
import PublicContentLayout from "@/components/PublicContentLayout";

export const metadata: Metadata = {
  title: "Articles and guides | urlyu.com",
  description: "Practical tips for creating short links, bio pages, and easy-to-use QR codes.",
};

const articles = [
  {
    id: "clear-links",
    category: "Short links",
    title: "Create links that are easy to share and understand",
    summary: "A short link is more useful when its destination, context, and post-click experience are clear.",
    icon: Link2,
    paragraphs: [
      "Before sharing a link, check that the destination is correct and works on the devices your audience is likely to use. Give the link a label or context that explains where it leads, especially when sharing it in a bio, poster, or short message.",
      "If you use campaign parameters, keep the naming consistent. For example, use the source for channels such as a newsletter or social media, and choose a campaign name your team can recognize. Avoid putting names, email addresses, or sensitive information in URLs because they may appear in browser history and service logs.",
      "After sharing a link, review click statistics to understand which channels are bringing visits. Click counts can indicate engagement, but they do not reveal every visitor's identity or intent.",
    ],
  },
  {
    id: "useful-bio-pages",
    category: "Bio pages",
    title: "Give your bio page context, not just a list of buttons",
    summary: "A short introduction helps visitors understand who owns the page and which links are relevant.",
    icon: PanelsTopLeft,
    paragraphs: [
      "Start with one or two sentences about yourself, your project, or your organization. Explain what you do and what visitors will find in the links on the page. Be specific and easy to understand instead of relying on a generic slogan.",
      "Arrange links around your visitors' needs. Put the main action—such as viewing a portfolio, reading information, or contacting you—where it is easy to find. Use button labels that describe their destinations, then check each URL and its active status.",
      "Update your description and links as your project changes. Avoid publishing personal information you do not want to make public, and make sure you have permission to share content owned by others.",
    ],
  },
  {
    id: "qr-codes-for-print",
    category: "QR codes",
    title: "Check your QR code before printing or sharing it",
    summary: "A few simple checks help make sure a code can be scanned and opens the right page.",
    icon: QrCode,
    paragraphs: [
      "Create a QR code from a URL you have already tested. If possible, scan it with more than one device and make sure the destination works well on a small screen. Leave clear space around the code and use enough contrast between the code and its background.",
      "For printed materials, test the code at the size and scanning distance people will use. Avoid covering the code pattern with a logo or decoration that makes it harder to read. Include a short address or another way to reach the destination for people who cannot scan it.",
      "A short link can let you update a destination without replacing material that has already been shared, as long as the link is still active and the new destination fits the original context. Check links periodically so visitors are not sent to outdated content.",
    ],
  },
];

export default function BlogPage() {
  return (
    <PublicContentLayout
      title="Articles and guides"
      description="Practical ideas for managing links, creating informative bio pages, and making better use of QR codes."
    >
      <nav id="top" aria-label="Article index" className="grid gap-3 md:grid-cols-3">
        {articles.map(({ id, category, title, summary, icon: Icon }, index) => (
          <a
            key={id}
            href={`#${id}`}
            className="group rounded-2xl border border-slate-700/70 bg-slate-900/55 p-5 transition duration-200 hover:-translate-y-1 hover:border-indigo-400/40 hover:bg-slate-900"
          >
            <span className="flex items-center justify-between">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-indigo-400/20 bg-indigo-500/10 text-indigo-300">
                <Icon aria-hidden="true" className="h-5 w-5" />
              </span>
              <span className="text-xs font-bold tracking-[0.15em] text-slate-500">0{index + 1}</span>
            </span>
            <span className="mt-5 block text-[10px] font-bold uppercase tracking-[0.16em] text-indigo-300">{category}</span>
            <span className="mt-2 block text-base font-bold leading-6 text-white">{title}</span>
            <span className="mt-2 block text-xs leading-5 text-slate-400">{summary}</span>
            <span className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-300 group-hover:text-indigo-200">
              Read article
              <ArrowDown aria-hidden="true" className="h-3.5 w-3.5 transition-transform group-hover:translate-y-0.5" />
            </span>
          </a>
        ))}
      </nav>

      {articles.map(({ id, category, title, summary, paragraphs, icon: Icon }, index) => (
        <article key={id} id={id} className="scroll-mt-24 overflow-hidden rounded-3xl border border-slate-700/70 bg-gradient-to-br from-slate-900/90 to-slate-950/70 shadow-xl shadow-black/10">
          <header className="flex flex-col gap-4 border-b border-slate-700/70 bg-white/[0.02] p-5 sm:flex-row sm:items-start sm:gap-5 sm:p-7">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-indigo-400/25 bg-indigo-500/10 text-indigo-300">
              <Icon aria-hidden="true" className="h-6 w-6" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-indigo-400/20 bg-indigo-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-indigo-200">{category}</span>
                <span className="text-xs font-semibold text-slate-500">Guide {String(index + 1).padStart(2, "0")}</span>
              </div>
              <h2 className="mt-3 text-xl font-bold leading-tight text-white sm:text-2xl">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-300">{summary}</p>
            </div>
          </header>
          <div className="space-y-4 p-5 sm:p-7">
            {paragraphs.map((paragraph, paragraphIndex) => (
              <p key={paragraph} className="flex gap-3 text-sm leading-7 text-slate-400">
                <span className="mt-0.5 shrink-0 text-[10px] font-bold tracking-wider text-indigo-400">
                  {String(paragraphIndex + 1).padStart(2, "0")}
                </span>
                {paragraph}
              </p>
            ))}
            <a href="#top" className="inline-flex items-center gap-1.5 pt-1 text-xs font-semibold text-indigo-300 transition hover:text-indigo-200">
              Back to article index
              <ArrowRight aria-hidden="true" className="-rotate-90 h-3.5 w-3.5" />
            </a>
          </div>
        </article>
      ))}
    </PublicContentLayout>
  );
}
