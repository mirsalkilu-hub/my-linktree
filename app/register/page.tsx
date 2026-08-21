"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Script from "next/script";
import { supabase } from "@/lib/supabase";

declare global {
  interface Window {
    google?: any;
  }
}

export default function RegisterPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [googleReady, setGoogleReady] = useState(false);

  const router = useRouter();

  // Helper untuk generate nonce dan SHA-256 hash
  const generateNonce = async () => {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    const rawNonce = Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join("");

    const encoder = new TextEncoder();
    const encodedData = encoder.encode(rawNonce);
    const hashBuffer = await crypto.subtle.digest("SHA-256", encodedData);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashedNonce = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");

    return { rawNonce, hashedNonce };
  };

  // Handle Token balikan dari Google Pop-up
  const handleCredentialResponse = async (response: any, rawNonce: string) => {
    setLoading(true);
    setErrorMessage("");

    const { error } = await supabase.auth.signInWithIdToken({
      provider: "google",
      token: response.credential,
      nonce: rawNonce,
    });

    if (error) {
      setErrorMessage(error.message);
      setLoading(false);
    } else {
      router.push("/dashboard");
    }
  };

  // Inisialisasi Google SDK saat script dimuat
  const initGoogleSdk = async () => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

    if (!clientId) {
      console.error("NEXT_PUBLIC_GOOGLE_CLIENT_ID belum diset di .env.local");
      return;
    }

    if (window.google?.accounts?.id) {
      const { rawNonce, hashedNonce } = await generateNonce();

      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: (resp: any) => handleCredentialResponse(resp, rawNonce),
        nonce: hashedNonce,
        auto_select: false,
      });
      setGoogleReady(true);
    }
  };

  // Pemicu Register Google Pop-up Native
  const handleGoogleSignUp = () => {
    if (!googleReady || !window.google?.accounts?.id) {
      setErrorMessage("Google SDK sedang memuat, silakan coba beberapa detik lagi.");
      return;
    }

    window.google.accounts.id.prompt((notification: any) => {
      if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
        console.warn("One Tap prompt tidak muncul.");
      }
    });
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (password !== confirmPassword) {
      setErrorMessage("Password dan Konfirmasi Password tidak cocok.");
      return;
    }

    if (password.length < 8) {
      setErrorMessage("Password minimal harus 8 karakter.");
      return;
    }

    if (!acceptedTerms) {
      setErrorMessage("Anda harus menyetujui Terms of Service dan Privacy Policy.");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    if (error) {
      setErrorMessage(error.message);
      setLoading(false);
    } else {
      router.push("/dashboard");
    }
  };

  return (
    <>
      <Script
        src="https://accounts.google.com/gsi/client"
        onLoad={initGoogleSdk}
        strategy="afterInteractive"
      />

      <div className="min-h-screen bg-[#0b0f19] text-white flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-[#0f172a]/60 border border-slate-800 p-8 rounded-2xl backdrop-blur-xl shadow-2xl">
          
          {/* Header Title */}
          <div className="text-center mb-8">
            <Link href="/" className="text-3xl font-black tracking-wider text-white">
              mr<span className="text-indigo-500">.id</span>
            </Link>
            <h2 className="text-xl font-bold mt-4 text-slate-100">Buat Akun Baru</h2>
          </div>

          {/* Error Alert */}
          {errorMessage && (
            <div className="mb-6 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs font-medium text-center">
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-5">
            
            {/* Full Name Field */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                Full name <span className="text-red-500">*</span>
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-4 text-slate-400 pointer-events-none">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </span>
                <input
                  type="text"
                  required
                  placeholder="Your full name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-[#0b1329]/80 border border-slate-700/80 rounded-xl pl-11 pr-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-all"
                />
              </div>
            </div>

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
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                Password <span className="text-red-500">*</span>
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-4 text-slate-400 pointer-events-none">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="Minimum 8 characters"
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

            {/* Confirm Password Field */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                Confirm password <span className="text-red-500">*</span>
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-4 text-slate-400 pointer-events-none">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </span>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  placeholder="Type password again"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-[#0b1329]/80 border border-slate-700/80 rounded-xl pl-11 pr-11 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 text-slate-400 hover:text-slate-200 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Terms & Privacy Checkbox */}
            <div className="flex items-center space-x-3 pt-1">
              <input
                type="checkbox"
                id="terms"
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
                className="w-4 h-4 rounded bg-[#0b1329] border-slate-700 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
              />
              <label htmlFor="terms" className="text-xs text-slate-300 leading-snug cursor-pointer">
                I accept the{" "}
                <Link href="/terms" className="text-indigo-400 hover:underline">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link href="/privacy" className="text-indigo-400 hover:underline">
                  Privacy Policy
                </Link>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 rounded-xl transition-all shadow-lg shadow-indigo-600/30 active:scale-95 disabled:opacity-50 text-sm mt-2"
            >
              {loading ? "Memproses..." : "Daftar"}
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

          {/* Tombol Register Google */}
          <button
            type="button"
            onClick={handleGoogleSignUp}
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
            <span>Daftar dengan Google</span>
          </button>

          {/* Footer Link */}
          <p className="text-center text-xs text-slate-400 mt-6">
            Sudah punya akun?{" "}
            <Link href="/login" className="text-indigo-400 font-semibold hover:underline">
              Masuk
            </Link>
          </p>

        </div>
      </div>
    </>
  );
}