import Link from "next/link";
import Image from "next/image";

export default function SiteFooter({ compact = false }: { compact?: boolean }) {
  return (
    <footer className={`site-footer relative z-10 w-full ${compact ? "py-5" : "py-7"}`}>
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-3 px-5 text-center sm:flex-row sm:justify-between sm:text-left">
        <div className="flex items-center gap-3 text-left">
          <Image
            src="/logo.png"
            alt="urlyu.com logo"
            width={32}
            height={32}
            className="h-8 w-8 shrink-0 rounded-lg object-contain"
          />
          <div className="min-w-0">
            <p className="text-xs font-bold tracking-wide text-slate-300">urlyu.com</p>
            <p className="text-[10px] text-slate-500">Short links and bio pages, all in one place.</p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-[10px] text-slate-500">
          <Link href="/" className="transition-colors hover:text-indigo-300">Home</Link>
          <span>© 2026 urlyu.com</span>
        </div>
      </div>
    </footer>
  );
}
