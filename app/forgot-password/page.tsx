"use client";

import { useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import toast from "react-hot-toast";
import { Mail, ArrowLeft } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const redirectUrl = `${window.location.origin}/reset-password`;

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl,
    });

    if (error) {
      toast.error("Gagal mengirim email: " + error.message);
    } else {
      setIsSubmitted(true);
      toast.success("Instruksi reset password telah dikirim ke email Anda!");
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 p-6 sm:p-8 rounded-3xl shadow-2xl">
        <div className="text-center mb-6">
          <span className="text-2xl font-black tracking-wider text-white">
            mr<span className="text-indigo-500">.id</span>
          </span>
          <h1 className="text-xl font-bold mt-4">Lupa Kata Sandi?</h1>
          <p className="text-xs text-slate-400 mt-1">
            Masukkan email Anda untuk menerima tautan pemulihan kata sandi.
          </p>
        </div>

        {isSubmitted ? (
          <div className="bg-indigo-950/40 border border-indigo-500/30 p-4 rounded-2xl text-center space-y-3">
            <p className="text-xs text-indigo-200">
              Cek kotak masuk email <strong className="text-white">{email}</strong> untuk melanjutkan proses reset password.
            </p>
            <button
              onClick={() => setIsSubmitted(false)}
              className="text-xs text-indigo-400 hover:underline font-semibold"
            >
              Kirim ulang tautan
            </button>
          </div>
        ) : (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Email <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-indigo-500 transition-all placeholder:text-slate-600"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 rounded-xl text-sm transition-all disabled:opacity-50 shadow-lg shadow-indigo-600/20"
            >
              {loading ? "Mengirim Tautan..." : "Kirim Tautan Reset"}
            </button>
          </form>
        )}

        <div className="mt-6 text-center">
          <Link
            href="/login"
            className="inline-flex items-center space-x-2 text-xs text-slate-400 hover:text-white transition-all font-medium"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Kembali ke Halaman Masuk</span>
          </Link>
        </div>
      </div>
    </div>
  );
}