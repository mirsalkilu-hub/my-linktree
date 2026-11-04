"use client";

import NextImage from "next/image";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import { ArrowRight, BarChart3, Crown, Globe2, Link2, PanelsTopLeft, QrCode, Sparkles } from "lucide-react";
import { supabase } from "../lib/supabase";
import SiteFooter from "@/components/SiteFooter";

export default function HomePage() {
  const [longUrl, setLongUrl] = useState("");
  const [shortUrl, setShortUrl] = useState("");
  const [slugCode, setSlugCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [copied, setCopied] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.push("/dashboard");
      }
    };
    checkUser();
  }, [router]);

  const handleShorten = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!longUrl) return;

    setIsLoading(true);
    setErrorMessage("");
    setShortUrl("");

    const { data: { user } } = await supabase.auth.getUser();
    const slug = Math.random().toString(36).substring(2, 7);

    const { data, error } = await supabase.from("links").insert([
      {
        original_url: longUrl.startsWith("http") ? longUrl : `https://${longUrl}`,
        short_code: slug,
        user_id: user ? user.id : null,
      },
    ]).select();

    if (error) {
      console.error(error);
      setErrorMessage("Could not save the link. Please try again.");
    } else if (data) {
      const domain = window.location.origin;
      setShortUrl(`${domain}/${slug}`);
      setSlugCode(slug);
      setLongUrl("");
    }

    setIsLoading(false);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shortUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadQRCode = () => {
    const svgElement = document.getElementById("qr-code-home") as SVGSVGElement | null;
    if (!svgElement) return;

    const svgData = new XMLSerializer().serializeToString(svgElement);
    const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const URLObject = window.URL || window.webkitURL || window;
    const blobURL = URLObject.createObjectURL(svgBlob);

    const image = new window.Image();
    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 256;
      canvas.height = 256;
      const context = canvas.getContext("2d");
      if (context) {
        context.fillStyle = "#FFFFFF";
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.drawImage(image, 0, 0, canvas.width, canvas.height);

        const png = canvas.toDataURL("image/png");
        const downloadLink = document.createElement("a");
        downloadLink.href = png;
        downloadLink.download = `qrcode-${slugCode || "mrid"}.png`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
      }
    };
    image.src = blobURL;
  };

  return (
    <div className="site-shell min-h-screen text-white font-sans flex flex-col justify-between relative overflow-x-clip">
      {/* Ambient Glow Background Effect */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-indigo-600/15 blur-[140px] rounded-full pointer-events-none" />
      <div className="absolute top-1/2 left-1/3 w-[300px] h-[200px] bg-purple-600/10 blur-[100px] rounded-full pointer-events-none" />

      {/* Sticky header */}
      <header className="app-header sticky top-0 z-50 w-full border-b">
  <div className="flex items-center justify-between px-8 py-5 max-w-7xl mx-auto w-full">
    
    {/* Align the logo and brand name */}
    <div className="flex items-center space-x-3">
      <NextImage
        src="/logo.png"
        alt="urlyu.com logo"
        width={32}
        height={32}
        className="w-8 h-8 object-contain rounded-lg"
      />
      <span className="text-2xl font-black tracking-wider text-white">
        urlyu<span className="text-indigo-500">.com</span>
      </span>
    </div>

    <Link
      href="/login"
      className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-lg shadow-indigo-600/20 active:scale-95"
    >
      Sign in / Sign up
    </Link>
  </div>
</header>

      {/* Main Hero Section */}
      <main className="relative z-10 max-w-4xl mx-auto px-6 py-16 text-center flex-1 flex flex-col items-center justify-center">
        {/* Badge Indicator */}
        <div className="inline-flex items-center space-x-2 bg-indigo-950/60 border border-indigo-500/30 text-indigo-300 px-4 py-1.5 rounded-full text-xs font-medium mb-6 backdrop-blur-md">
          <span className="flex h-2 w-2 rounded-full bg-indigo-400 animate-pulse" />
          <span>Modern link shortener and bio page platform</span>
        </div>

        {/* Headline */}
        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight leading-tight mb-4">
          Shorten long links <br />
          <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-500 bg-clip-text text-transparent">
            In seconds.
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-slate-400 text-sm sm:text-base max-w-2xl mb-8 leading-relaxed">
          Create clean, professional links that are easy to share anywhere.
        </p>

        {/* Shortener Form */}
        <div className="w-full max-w-2xl bg-slate-900/80 border border-slate-800 p-2.5 rounded-2xl shadow-2xl backdrop-blur-xl focus-within:border-indigo-500/80 transition-all mb-4">
          <form onSubmit={handleShorten} className="flex flex-col sm:flex-row items-center gap-2">
            <div className="flex items-center space-x-3 px-3 w-full">
              <svg className="w-5 h-5 text-slate-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              <input
                type="url"
                required
                placeholder="Paste a long URL here (https://...)"
                value={longUrl}
                onChange={(e) => setLongUrl(e.target.value)}
                className="w-full bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none py-2"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs sm:text-sm px-6 py-3 rounded-xl transition-all whitespace-nowrap shadow-lg shadow-indigo-600/30 active:scale-95 shrink-0 disabled:opacity-50"
            >
              {isLoading ? "Shortening..." : "Shorten 🚀"}
            </button>
          </form>
        </div>

        {/* Error Message */}
        {errorMessage && (
          <p className="text-red-400 text-xs font-medium mb-4">{errorMessage}</p>
        )}

        {/* Output Box + QR Code & Actions */}
        {shortUrl && (
          <div className="w-full max-w-2xl bg-indigo-950/40 border border-indigo-500/30 p-5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-6 mb-8 text-left">
            <div className="flex-1 w-full flex flex-col gap-2">
              <span className="text-[10px] text-indigo-300 font-medium uppercase tracking-wider">
                Your short link:
              </span>
              <a
                href={shortUrl}
                target="_blank"
                rel="noreferrer"
                className="text-base font-bold text-white hover:underline break-all"
              >
                {shortUrl}
              </a>
              <button
                onClick={copyToClipboard}
                className="w-fit bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 border border-indigo-500/30 px-4 py-2 rounded-xl text-xs font-semibold transition-all mt-1"
              >
                {copied ? "✅ Copied!" : "📋 Copy link"}
              </button>
            </div>

            {/* QR Code Block */}
            <div className="flex flex-col items-center gap-2 shrink-0">
              <div className="bg-white p-2.5 rounded-xl shadow-md">
                <QRCodeSVG id="qr-code-home" value={shortUrl} size={100} />
              </div>
              <button
                onClick={downloadQRCode}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold transition-colors"
              >
                Download PNG
              </button>
            </div>
          </div>
        )}

        {/* Quick Features */}
        <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-slate-500 mt-2">
          <span className="flex items-center space-x-1">
            <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
            <span>Free link shortening</span>
          </span>
          <span className="flex items-center space-x-1">
            <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
            <span>Real-time analytics</span>
          </span>
          <span className="flex items-center space-x-1">
            <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
            <span>Instant QR codes</span>
          </span>
        </div>
      </main>

      <section className="relative z-10 mx-auto w-full max-w-7xl px-6 py-14 sm:py-16">
        <div className="mx-auto mb-8 max-w-2xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-3 py-1 text-[11px] font-semibold text-indigo-300">
            <Sparkles className="h-3.5 w-3.5" />
            One platform, more ways to share
          </span>
          <h2 className="mt-4 text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Everything you need to make links work harder
          </h2>
          <p className="mt-3 text-sm leading-6 text-slate-400 sm:text-base">
            Organize your online presence, share it anywhere, and understand how people engage.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              title: "Short links",
              description: "Turn long URLs into concise links that are easy to share and manage.",
              icon: Link2,
              color: "border-indigo-500/20 bg-indigo-500/10 text-indigo-300",
            },
            {
              title: "Bio pages",
              description: "Bring your profiles, content, and important links together on one page.",
              icon: PanelsTopLeft,
              color: "border-violet-500/20 bg-violet-500/10 text-violet-300",
            },
            {
              title: "Click analytics",
              description: "Review click activity for your short links and bio page buttons.",
              icon: BarChart3,
              color: "border-sky-500/20 bg-sky-500/10 text-sky-300",
            },
            {
              title: "Custom domains",
              description: "Use a verified domain you own for branded short links.",
              icon: Globe2,
              color: "border-cyan-500/20 bg-cyan-500/10 text-cyan-300",
            },
            {
              title: "QR codes",
              description: "Create a scannable QR code for your short link and download it as a PNG.",
              icon: QrCode,
              color: "border-pink-500/20 bg-pink-500/10 text-pink-300",
            },
            {
              title: "VIP membership",
              description: "Enjoy an ad-free experience on your bio pages with an active VIP subscription.",
              icon: Crown,
              color: "border-amber-500/20 bg-amber-500/10 text-amber-300",
            },
          ].map(({ title, description, icon: Icon, color }) => (
            <article key={title} className="rounded-2xl border border-slate-800/80 bg-slate-900/55 p-5 backdrop-blur-md transition hover:-translate-y-0.5 hover:border-indigo-500/30">
              <span className={`mb-4 flex h-10 w-10 items-center justify-center rounded-xl border ${color}`}>
                <Icon aria-hidden="true" className="h-5 w-5" />
              </span>
              <h3 className="text-sm font-semibold text-white">{title}</h3>
              <p className="mt-2 text-xs leading-5 text-slate-400">{description}</p>
            </article>
          ))}
        </div>

        <div className="mt-14 grid gap-8 rounded-3xl border border-indigo-500/20 bg-gradient-to-br from-indigo-950/45 via-slate-900/80 to-violet-950/35 p-6 sm:p-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-300">Get started</p>
            <h2 className="mt-3 text-2xl font-bold tracking-tight text-white">From setup to sharing in a few steps</h2>
            <p className="mt-3 text-sm leading-6 text-slate-400">
              Create a free account to manage your links, publish a bio page, and follow engagement from one workspace.
            </p>
            <Link
              href="/register"
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-950/30 transition hover:bg-indigo-500"
            >
              Create your free account
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <ol className="grid gap-3 sm:grid-cols-3">
            {[
              { step: "01", title: "Create", description: "Sign up and set up your workspace." },
              { step: "02", title: "Customize", description: "Shorten a link or build your bio page." },
              { step: "03", title: "Share", description: "Share your URL or QR code and track clicks." },
            ].map(({ step, title, description }) => (
              <li key={step} className="rounded-2xl border border-slate-700/70 bg-slate-950/45 p-4">
                <span className="text-xs font-bold tracking-widest text-indigo-300">{step}</span>
                <h3 className="mt-3 text-sm font-semibold text-white">{title}</h3>
                <p className="mt-1 text-xs leading-5 text-slate-400">{description}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Footer */}
      <SiteFooter />
    </div>
  );
}
