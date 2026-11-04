import Link from "next/link";
import Image from "next/image";

const productLinks = [
  { label: "Link shortener", href: "/dashboard/links" },
  { label: "Bio pages", href: "/dashboard/pages" },
  { label: "Click analytics", href: "/dashboard/analytics" },
  { label: "QR codes", href: "/dashboard/links" },
];

const accountLinks = [
  { label: "Create an account", href: "/register" },
  { label: "Sign in", href: "/login" },
  { label: "VIP membership", href: "/dashboard/vip" },
];

export default function SiteFooter({
  compact = false,
  brandOnly = false,
  footerBackground,
  brandBackground,
}: {
  compact?: boolean;
  brandOnly?: boolean;
  footerBackground?: string;
  brandBackground?: string;
}) {
  return (
    <footer
      className={`site-footer relative z-10 w-full ${
        brandOnly ? "py-5" : compact ? "py-6" : "py-10 sm:py-12"
      }`}
      style={footerBackground ? { background: footerBackground } : undefined}
    >
      {brandOnly ? (
        <div className="flex justify-center px-5">
          <Link
            href="/"
            aria-label="urlyu.com homepage"
            className="group inline-flex items-center gap-2.5 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-2.5 shadow-lg shadow-black/10 transition-all hover:border-indigo-400/30 hover:bg-white/[0.06]"
            style={brandBackground ? { backgroundColor: brandBackground } : undefined}
          >
            <Image
              src="/logo.png"
              alt=""
              width={32}
              height={32}
              className="h-8 w-8 shrink-0 rounded-lg object-contain transition-transform group-hover:scale-105"
            />
            <span
              className="text-sm font-black tracking-wide text-white"
              style={{ fontFamily: '"Trebuchet MS", "Segoe UI", sans-serif' }}
            >
              urlyu<span className="text-indigo-400">.com</span>
            </span>
          </Link>
        </div>
      ) : (
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:grid-cols-4">
            <div className="col-span-2 sm:col-span-1 lg:col-span-2">
              <Link href="/" className="inline-flex items-center gap-3">
                <Image
                  src="/logo.png"
                  alt="urlyu.com logo"
                  width={36}
                  height={36}
                  className="h-9 w-9 shrink-0 rounded-xl object-contain"
                />
                <span className="text-lg font-black tracking-wide text-white">
                  urlyu<span className="text-indigo-400">.com</span>
                </span>
              </Link>
              <p className="mt-3 max-w-sm text-xs leading-6 text-slate-400">
                Shorten links, create a bio page, and see how people interact
                with your links—all in one place.
              </p>
            </div>

            <nav aria-label="Product links">
              <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-200">
                Product
              </h2>
              <ul className="space-y-2.5">
                {productLinks.map(({ label, href }) => (
                  <li key={label}>
                    <Link
                      href={href}
                      className="text-xs text-slate-400 transition-colors hover:text-indigo-300"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            <nav aria-label="Account links">
              <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-200">
                Account
              </h2>
              <ul className="space-y-2.5">
                {accountLinks.map(({ label, href }) => (
                  <li key={label}>
                    <Link
                      href={href}
                      className="text-xs text-slate-400 transition-colors hover:text-indigo-300"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>

          <div className="mt-8 flex flex-col gap-2 border-t border-slate-800/80 pt-5 text-[11px] text-slate-500 sm:flex-row sm:items-center sm:justify-between">
            <span>© {new Date().getFullYear()} urlyu.com. All rights reserved.</span>
            <Link href="/" className="transition-colors hover:text-indigo-300">
              Make every link easier to share.
            </Link>
          </div>
        </div>
      )}
    </footer>
  );
}
