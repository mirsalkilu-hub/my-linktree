"use client";

import { useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import toast from "react-hot-toast";
import { Mail, ArrowLeft } from "lucide-react";
import SiteFooter from "@/components/SiteFooter";

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
      toast.error("Could not send the email: " + error.message);
    } else {
      setIsSubmitted(true);
      toast.success("Password reset instructions have been sent to your email.");
    }

    setLoading(false);
  };

  return (
    <div className="auth-shell min-h-screen text-white flex flex-col items-center justify-center p-4">
      <div className="auth-card w-full max-w-md p-6 sm:p-8 rounded-2xl">
        <div className="text-center mb-6">
          <span className="text-2xl font-black tracking-wider text-white">
            urlyu<span className="text-indigo-500">.com</span>
          </span>
          <h1 className="text-xl font-bold mt-4">Forgot your password?</h1>
          <p className="text-xs text-slate-400 mt-1">
            Enter your email to receive a password reset link.
          </p>
        </div>

        {isSubmitted ? (
          <div className="bg-indigo-950/40 border border-indigo-500/30 p-4 rounded-2xl text-center space-y-3">
            <p className="text-xs text-indigo-200">
              Check the inbox for <strong className="text-white">{email}</strong> to continue resetting your password.
            </p>
            <button
              onClick={() => setIsSubmitted(false)}
              className="text-xs text-indigo-400 hover:underline font-semibold"
            >
              Resend link
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
                  className="auth-input w-full rounded-xl pl-10 pr-4 py-3 text-sm transition-all placeholder:text-slate-600"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="primary-action w-full text-white font-semibold py-3 rounded-xl text-sm transition-all disabled:opacity-50"
            >
              {loading ? "Sending link..." : "Send reset link"}
            </button>
          </form>
        )}

        <div className="mt-6 text-center">
          <Link
            href="/login"
            className="inline-flex items-center space-x-2 text-xs text-slate-400 hover:text-white transition-all font-medium"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to sign in</span>
          </Link>
        </div>
      </div>
      <SiteFooter compact />
    </div>
  );
}