"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Copy, Globe, Loader2, Plus, Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import DashboardHeader from "@/components/DashboardHeader";
import SiteFooter from "@/components/SiteFooter";
import type { User } from "@supabase/supabase-js";

interface CustomDomain {
  id: string;
  domain: string;
  verification_token: string;
  verified_at: string | null;
  created_at: string;
}

export default function CustomDomainsPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [domains, setDomains] = useState<CustomDomain[]>([]);
  const [domainInput, setDomainInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeDomainId, setActiveDomainId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const getAccessToken = useCallback(async () => {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw new Error(error.message);
    if (!data.session?.access_token) throw new Error("Please sign in again.");
    return data.session.access_token;
  }, []);

  const loadDomains = useCallback(async (accessToken: string) => {
    const response = await fetch("/api/custom-domains", {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Could not load custom domains.");
    setDomains(result.domains || []);
  }, []);

  useEffect(() => {
    let isMounted = true;

    const initialize = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error) {
        setErrorMessage(error.message);
        setLoading(false);
        return;
      }
      if (!data.user) {
        router.push("/login");
        return;
      }

      if (!isMounted) return;
      setUser(data.user);

      try {
        const accessToken = await getAccessToken();
        await loadDomains(accessToken);
      } catch (error) {
        if (isMounted) {
          setErrorMessage(error instanceof Error ? error.message : "Could not load custom domains.");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    void initialize();

    return () => {
      isMounted = false;
    };
  }, [getAccessToken, loadDomains, router]);

  const handleAddDomain = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");
    setSaving(true);

    try {
      const accessToken = await getAccessToken();
      const response = await fetch("/api/custom-domains", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ domain: domainInput }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not add custom domain.");

      setDomainInput("");
      setSuccessMessage("Domain added. Complete the DNS steps below, then verify it.");
      await loadDomains(accessToken);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Could not add custom domain.");
    } finally {
      setSaving(false);
    }
  };

  const handleVerifyDomain = async (domain: CustomDomain) => {
    setActiveDomainId(domain.id);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const accessToken = await getAccessToken();
      const response = await fetch(`/api/custom-domains/${domain.id}/verify`, {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not verify domain.");

      setSuccessMessage(`${domain.domain} is verified.`);
      await loadDomains(accessToken);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Could not verify domain.");
    } finally {
      setActiveDomainId(null);
    }
  };

  const handleRemoveDomain = async (domain: CustomDomain) => {
    if (!window.confirm(`Remove ${domain.domain}? Links using it will fall back to the main domain.`)) {
      return;
    }

    setActiveDomainId(domain.id);
    setErrorMessage("");
    try {
      const accessToken = await getAccessToken();
      const response = await fetch(`/api/custom-domains/${domain.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not remove domain.");

      setDomains((current) => current.filter((item) => item.id !== domain.id));
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Could not remove domain.");
    } finally {
      setActiveDomainId(null);
    }
  };

  const copyVerificationValue = async (domain: CustomDomain) => {
    try {
      await navigator.clipboard.writeText(`urlyu-verification=${domain.verification_token}`);
      setSuccessMessage("Verification value copied.");
    } catch {
      setErrorMessage("Could not copy the verification value. Select and copy it manually.");
    }
  };

  if (loading) {
    return (
      <div className="site-shell flex min-h-screen items-center justify-center text-white">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
      </div>
    );
  }

  return (
    <div className="site-shell flex min-h-screen flex-col text-white">
      <DashboardHeader user={user} />
      <main className="mx-auto w-full max-w-5xl flex-1 space-y-6 px-4 py-8 sm:px-6 sm:py-10">
        <section className="manager-hero rounded-2xl p-6 sm:p-8">
          <div className="flex items-center gap-3">
            <span className="rounded-xl border border-indigo-500/20 bg-indigo-500/10 p-2 text-indigo-300">
              <Globe className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-300">Link settings</p>
              <h1 className="mt-1 text-2xl font-black text-white sm:text-3xl">Custom domains</h1>
            </div>
          </div>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-300">
            Connect a domain you own and use it for new short links. Add the domain to your Vercel project and configure the DNS records Vercel provides before verifying it here.
          </p>
        </section>

        <section className="manager-panel rounded-2xl p-5 sm:p-7">
          <h2 className="text-base font-bold text-white">Add a domain</h2>
          <form onSubmit={handleAddDomain} className="mt-4 flex flex-col gap-3 sm:flex-row">
            <input
              type="text"
              required
              value={domainInput}
              onChange={(event) => setDomainInput(event.target.value)}
              placeholder="go.example.com"
              aria-label="Custom domain"
              className="min-w-0 flex-1 rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none"
            />
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-indigo-500 disabled:opacity-50"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Add domain
            </button>
          </form>
          {errorMessage && <p role="alert" className="mt-4 text-sm text-rose-300">{errorMessage}</p>}
          {successMessage && <p role="status" className="mt-4 text-sm text-emerald-300">{successMessage}</p>}
        </section>

        <section className="space-y-4">
          {domains.length === 0 ? (
            <div className="manager-panel rounded-2xl p-8 text-center text-sm text-slate-400">
              No custom domains yet.
            </div>
          ) : (
            domains.map((domain) => (
              <article key={domain.id} className="manager-panel rounded-2xl p-5 sm:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-bold text-white">{domain.domain}</h2>
                      <span className={`rounded-full border px-2.5 py-1 text-[10px] font-bold ${
                        domain.verified_at
                          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                          : "border-amber-500/30 bg-amber-500/10 text-amber-200"
                      }`}>
                        {domain.verified_at ? "Verified" : "Needs verification"}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-400">
                      {domain.verified_at
                        ? "Available when creating new short links."
                        : "Set up Vercel and DNS, then verify ownership below."}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {!domain.verified_at && (
                      <button
                        type="button"
                        onClick={() => handleVerifyDomain(domain)}
                        disabled={activeDomainId === domain.id}
                        className="rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-indigo-500 disabled:opacity-50"
                      >
                        {activeDomainId === domain.id ? "Checking..." : "Verify DNS"}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleRemoveDomain(domain)}
                      disabled={activeDomainId === domain.id}
                      aria-label={`Remove ${domain.domain}`}
                      className="rounded-lg border border-slate-700 p-2 text-slate-300 transition hover:border-rose-500/50 hover:text-rose-300 disabled:opacity-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {!domain.verified_at && (
                  <div className="mt-5 space-y-3 rounded-xl border border-slate-800 bg-slate-950/50 p-4 text-xs leading-5 text-slate-300">
                    <p>1. Add this domain to the urlyu.com project in Vercel and follow Vercel&apos;s DNS instructions.</p>
                    <p>2. Add a TXT record at <code className="text-indigo-200">_urlyu-verification.{domain.domain}</code> with this value:</p>
                    <div className="flex flex-wrap items-center gap-2">
                      <code className="min-w-0 flex-1 break-all rounded-lg bg-slate-900 px-3 py-2 text-indigo-200">
                        urlyu-verification={domain.verification_token}
                      </code>
                      <button
                        type="button"
                        onClick={() => copyVerificationValue(domain)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 px-3 py-2 text-slate-200 transition hover:border-indigo-500/50"
                      >
                        <Copy className="h-3.5 w-3.5" />
                        Copy
                      </button>
                    </div>
                    <p>3. Wait for DNS to propagate, then choose Verify DNS.</p>
                  </div>
                )}
              </article>
            ))
          )}
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
