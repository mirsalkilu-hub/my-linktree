"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import toast from "react-hot-toast";
import { Lock, Eye, EyeOff } from "lucide-react";
import SiteFooter from "@/components/SiteFooter";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Verify that the Supabase recovery session from the URL hash is valid
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        toast.error("Your password reset session is invalid or has expired.");
      }
    };
    checkSession();
  }, []);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.updateUser({
      password: password,
    });

    if (error) {
      toast.error("Could not update your password: " + error.message);
    } else {
      toast.success("Password updated. Please sign in.");
      router.push("/login");
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
          <h1 className="text-xl font-bold mt-4">Set a new password</h1>
          <p className="text-xs text-slate-400 mt-1">
            Enter a new password for your account.
          </p>
        </div>

        <form onSubmit={handleUpdatePassword} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              New password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type={showPassword ? "text" : "password"}
                required
                minLength={6}
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="auth-input w-full rounded-xl pl-10 pr-10 py-3 text-sm transition-all placeholder:text-slate-600"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="primary-action w-full text-white font-semibold py-3 rounded-xl text-sm transition-all disabled:opacity-50"
          >
            {loading ? "Saving password..." : "Save new password"}
          </button>
        </form>
      </div>
      <SiteFooter compact />
    </div>
  );
}