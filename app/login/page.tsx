"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const router = useRouter();

  // Handle Login Google via Redirect OAuth
  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
      },
    });
  };

  // Auth Email & Password
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setErrorMsg(error.message);
    } else {
      router.push("/dashboard");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#0b0f19] text-white flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#0f172a]/60 border border-slate-800 p-8 rounded-2xl backdrop-blur-xl shadow-2xl">
        
        {/* Header Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="text-3xl font-black tracking-wider text-white">
            mr<span className="text-indigo-500">.id</span>
          </Link>
          <h2 className="text-xl font-bold mt-4 text-slate-100">Masuk ke Akun Anda</h2>
        </div>

        {/* Error Message */}
        {errorMsg && (
          <div className="mb-6 p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-medium text-center rounded-xl">
            {errorMsg}
          </div>
        )}

        {/* Form Login */}
        <form onSubmit={handleLogin} className="space-y-5">
          
          {/* Email Field */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              Email <span className="text-red-500">*</span>
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-4 text-slate-400 pointer-events-none text-base font-medium">
                @
              </span>
              <input
                type="email"
                required
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#0b1329]/80 border border-slate-700/80 rounded-xl pl-11 pr-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-all"
              />
            </div>
          </div>

          {/* Password Field */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-300">
                Password <span className="text-red-500">*</span>
              </label>
              <Link
                href="/forgot-password"
                className="text-xs text-indigo-400 hover:underline hover:text-indigo-300"
              >
                Lupa password?
              </Link>
            </div>
            <div className="relative flex items-center">
              <span className="absolute left-4 text-slate-400 pointer-events-none">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </span>
              <input
                type={showPassword ? "text" : "password"}
                required
                placeholder="Masukkan kata sandi"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#0b1329]/80 border border-slate-700/80 rounded-xl pl-11 pr-11 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 text-slate-400 hover:text-slate-200 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 rounded-xl transition-all shadow-lg shadow-indigo-600/30 active:scale-95 disabled:opacity-50 text-sm mt-2"
          >
            {loading ? "Memproses..." : "Masuk"}
          </button>
        </form>

        {/* Divider */}
        <div className="relative my-6 text-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-800"></div>
          </div>
          <span className="relative px-3 bg-[#0f172a] text-slate-500 text-xs">
            atau
          </span>
        </div>

        {/* Tombol OAuth Google */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          className="w-full flex items-center justify-center space-x-2 py-3 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/80 text-slate-200 font-medium text-sm transition-all active:scale-95"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>Lanjutkan dengan Google</span>
        </button>

        {/* Link ke Pendaftaran */}
        <p className="text-center text-xs text-slate-400 mt-6">
          Belum punya akun?{" "}
          <Link href="/register" className="text-indigo-400 font-semibold hover:underline">
            Daftar sekarang
          </Link>
        </p>

      </div>
    </div>
  );
}