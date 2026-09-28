import Link from "next/link";

export default function SiteFooter({ compact = false }: { compact?: boolean }) {
  return (
    <footer className={`site-footer relative z-10 w-full ${compact ? "py-5" : "py-7"}`}>
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-3 px-5 text-center sm:flex-row sm:justify-between sm:text-left">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500/15 text-[10px] font-black text-indigo-300 ring-1 ring-indigo-400/20">
            u
          </span>
          <div>
            <p className="text-xs font-bold tracking-wide text-slate-300">urlyu.com</p>
            <p className="text-[10px] text-slate-500">Short links. Better presence.</p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-[10px] text-slate-500">
          <Link href="/" className="transition-colors hover:text-indigo-300">Beranda</Link>
          <span>© 2026 urlyu.com</span>
        </div>
      </div>
    </footer>
  );
}
