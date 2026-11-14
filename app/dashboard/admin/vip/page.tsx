"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Check, ExternalLink, Loader2, Search, ShieldCheck, X } from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import DashboardHeader from "@/components/DashboardHeader";
import SiteFooter from "@/components/SiteFooter";

interface VipAccount {
  user_id: string;
  email: string;
  usernames: string[];
  status: string | null;
  current_period_end: string | null;
  payment_provider: string | null;
}

type VipAction = "grant" | "revoke";
type VipPlan = "monthly" | "annual";

interface QrisSubmission {
  id: string;
  user_id: string;
  email: string;
  usernames: string[];
  plan: VipPlan;
  amount_idr: number;
  paid_at: string;
  transaction_reference: string;
  evidence_url: string | null;
  created_at: string;
}

async function fetchReviewQueue(accessToken: string) {
  const response = await fetch("/api/admin/qris-submissions", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const result = await response.json() as { submissions?: QrisSubmission[]; error?: string };
  if (!response.ok) {
    throw new Error(result.error || "Could not load QRIS payment submissions.");
  }
  return result.submissions || [];
}

export default function VipAdminPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [query, setQuery] = useState("");
  const [accounts, setAccounts] = useState<VipAccount[]>([]);
  const [qrisSubmissions, setQrisSubmissions] = useState<QrisSubmission[]>([]);
  const [selectedPlans, setSelectedPlans] = useState<Record<string, VipPlan>>({});
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [workingUserId, setWorkingUserId] = useState("");
  const [reviewingSubmissionId, setReviewingSubmissionId] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [authorized, setAuthorized] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const checkAdminAccess = async () => {
      const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser();
      if (userError) {
        setErrorMessage(userError.message);
        setLoading(false);
        return;
      }
      if (!currentUser) {
        router.push("/login");
        return;
      }
      setUser(currentUser);

      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session?.access_token) {
        setErrorMessage(sessionError?.message || "Please sign in again.");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch("/api/admin/vip", {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        const result = await response.json() as { error?: string };
        if (!response.ok) {
          setErrorMessage(result.error || "Could not verify admin access.");
        } else {
          setAuthorized(true);
          try {
            setQrisSubmissions(await fetchReviewQueue(session.access_token));
          } catch (error) {
            setErrorMessage(error instanceof Error ? error.message : "Could not load QRIS payment submissions.");
          }
        }
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : "Could not verify admin access.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void checkAdminAccess();
    return () => {
      cancelled = true;
    };
  }, [router]);

  useEffect(() => {
    const updateTime = () => setCurrentTime(Date.now());
    updateTime();
    const intervalId = window.setInterval(updateTime, 60_000);
    return () => window.clearInterval(intervalId);
  }, []);

  const searchAccounts = async (searchQuery: string) => {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session?.access_token) {
      throw new Error(sessionError?.message || "Please sign in again.");
    }

    const response = await fetch(`/api/admin/vip?q=${encodeURIComponent(searchQuery)}`, {
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    const result = await response.json() as { accounts?: VipAccount[]; error?: string };
    if (!response.ok) {
      throw new Error(result.error || "Could not search accounts.");
    }
    setAccounts(result.accounts || []);
  };

  const handleSearch = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const searchQuery = query.trim();
    if (searchQuery.length < 2) {
      setErrorMessage("Enter at least 2 characters to search.");
      return;
    }

    setSearching(true);
    setErrorMessage("");
    setStatusMessage("");
    try {
      await searchAccounts(searchQuery);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Could not search accounts.");
    } finally {
      setSearching(false);
    }
  };

  const manageVip = async (account: VipAccount, action: VipAction) => {
    const plan = selectedPlans[account.user_id] || "monthly";
    const actionDescription = action === "grant"
      ? `Payment is verified. Activate or extend ${plan === "monthly" ? "one month" : "one year"} of VIP for ${account.email}?`
      : `revoke manual VIP for ${account.email}`;
    if (!window.confirm(action === "grant" ? actionDescription : `Confirm you want to ${actionDescription}?`)) return;

    setWorkingUserId(account.user_id);
    setErrorMessage("");
    setStatusMessage("");
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session?.access_token) {
        throw new Error(sessionError?.message || "Please sign in again.");
      }

      const response = await fetch("/api/admin/vip", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId: account.user_id, action, plan }),
      });
      const result = await response.json() as { error?: string; currentPeriodEnd?: string };
      if (!response.ok) {
        throw new Error(result.error || "Could not update VIP membership.");
      }

      setStatusMessage(
        action === "grant" && result.currentPeriodEnd
          ? `VIP updated for ${account.email}; active until ${new Date(result.currentPeriodEnd).toLocaleDateString("id-ID")}.`
          : `Manual VIP revoked for ${account.email}.`
      );
      await searchAccounts(query.trim());
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Could not update VIP membership.");
    } finally {
      setWorkingUserId("");
    }
  };

  const reviewQrisSubmission = async (
    submission: QrisSubmission,
    decision: "approve" | "reject"
  ) => {
    const note = decision === "reject"
      ? window.prompt("Why is this payment being rejected? The customer will see this note.")?.trim()
      : "";
    if (decision === "reject" && !note) return;

    const confirmation = decision === "approve"
      ? `Confirm that transaction ${submission.transaction_reference} is successful in GoPay Merchant and activate VIP for ${submission.email}?`
      : `Reject the QRIS payment submission from ${submission.email}?`;
    if (!window.confirm(confirmation)) return;

    setReviewingSubmissionId(submission.id);
    setErrorMessage("");
    setStatusMessage("");
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session?.access_token) {
        throw new Error(sessionError?.message || "Please sign in again.");
      }

      const response = await fetch("/api/admin/qris-submissions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ submissionId: submission.id, decision, note }),
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) {
        throw new Error(result.error || "Could not review this QRIS payment.");
      }

      setStatusMessage(
        decision === "approve"
          ? `Payment verified. VIP has been activated for ${submission.email}.`
          : `Payment submission from ${submission.email} was rejected.`
      );
      setQrisSubmissions(await fetchReviewQueue(session.access_token));
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Could not review this QRIS payment.");
    } finally {
      setReviewingSubmissionId("");
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
    <div className="site-shell flex min-h-screen flex-col font-sans text-white">
      <DashboardHeader user={user} />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10 sm:px-8">
        <section className="manager-panel rounded-3xl p-6 sm:p-8">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-indigo-400/30 bg-indigo-500/10 text-indigo-300">
              <ShieldCheck className="h-6 w-6" />
            </span>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-300">Admin</p>
              <h1 className="text-2xl font-black text-white">Manage VIP accounts</h1>
            </div>
          </div>

          {!authorized ? (
            <p role="alert" className="mt-6 rounded-xl border border-rose-500/30 bg-rose-950/30 p-4 text-sm text-rose-200">
              {errorMessage || "You are not allowed to manage VIP accounts."}
            </p>
          ) : (
            <>
              <section className="mt-6">
                <h2 className="text-lg font-bold text-white">QRIS payments awaiting review</h2>
                <p className="mt-1 text-sm leading-6 text-slate-400">
                  Match each reference and amount against successful transactions in GoPay Merchant before approving.
                </p>
                <div className="mt-4 space-y-3">
                  {qrisSubmissions.map((submission) => (
                    <article key={submission.id} className="rounded-2xl border border-amber-400/20 bg-slate-950/50 p-4 sm:p-5">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="min-w-0">
                          <p className="break-all font-semibold text-white">{submission.email}</p>
                          <p className="mt-1 break-all text-sm text-slate-400">
                            {submission.usernames.length ? submission.usernames.map((name) => `@${name}`).join(", ") : "No bio username"}
                          </p>
                          <dl className="mt-3 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
                            <div>
                              <dt className="text-xs text-slate-500">Plan / amount</dt>
                              <dd className="text-slate-200">
                                {submission.plan === "monthly" ? "Monthly" : "Annual"} ·{" "}
                                {new Intl.NumberFormat("id-ID", {
                                  style: "currency",
                                  currency: "IDR",
                                  maximumFractionDigits: 0,
                                }).format(submission.amount_idr)}
                              </dd>
                            </div>
                            <div>
                              <dt className="text-xs text-slate-500">Payment time</dt>
                              <dd className="text-slate-200">{new Date(submission.paid_at).toLocaleString("id-ID")}</dd>
                            </div>
                            <div>
                              <dt className="text-xs text-slate-500">Transaction reference</dt>
                              <dd className="break-all font-mono text-slate-200">{submission.transaction_reference}</dd>
                            </div>
                            <div>
                              <dt className="text-xs text-slate-500">Submitted</dt>
                              <dd className="text-slate-200">{new Date(submission.created_at).toLocaleString("id-ID")}</dd>
                            </div>
                          </dl>
                          {submission.evidence_url && (
                            <a
                              href={submission.evidence_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-indigo-300 hover:text-indigo-200"
                            >
                              View optional screenshot <ExternalLink className="h-4 w-4" />
                            </a>
                          )}
                        </div>
                        <div className="flex gap-2 lg:shrink-0">
                          <button
                            type="button"
                            onClick={() => void reviewQrisSubmission(submission, "approve")}
                            disabled={!!reviewingSubmissionId}
                            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-emerald-500 disabled:cursor-wait disabled:opacity-50"
                          >
                            {reviewingSubmissionId === submission.id
                              ? <Loader2 className="h-4 w-4 animate-spin" />
                              : <Check className="h-4 w-4" />}
                            Approve
                          </button>
                          <button
                            type="button"
                            onClick={() => void reviewQrisSubmission(submission, "reject")}
                            disabled={!!reviewingSubmissionId}
                            className="inline-flex items-center gap-2 rounded-xl border border-rose-500/40 px-4 py-2 text-sm font-semibold text-rose-300 transition hover:bg-rose-500/10 disabled:cursor-wait disabled:opacity-50"
                          >
                            <X className="h-4 w-4" />
                            Reject
                          </button>
                        </div>
                      </div>
                    </article>
                  ))}
                  {qrisSubmissions.length === 0 && (
                    <p className="rounded-xl border border-slate-700 p-5 text-center text-sm text-slate-400">
                      No QRIS payments are waiting for review.
                    </p>
                  )}
                </div>
              </section>

              <p className="mt-5 text-sm leading-6 text-slate-300">
                Search by account email or bio username. Verify QRIS payments before activating VIP.
                PayPal memberships must be managed through PayPal.
              </p>

              <form onSubmit={handleSearch} className="mt-6 flex flex-col gap-3 sm:flex-row">
                <label htmlFor="vip-account-search" className="sr-only">Email or username</label>
                <input
                  id="vip-account-search"
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search email or username"
                  maxLength={100}
                  className="min-w-0 flex-1 rounded-xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-indigo-400"
                />
                <button
                  type="submit"
                  disabled={searching}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-indigo-500 disabled:cursor-wait disabled:opacity-60"
                >
                  {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                  Search
                </button>
              </form>

              {errorMessage && <p role="alert" className="mt-4 text-sm text-rose-300">{errorMessage}</p>}
              {statusMessage && <p role="status" className="mt-4 text-sm text-emerald-300">{statusMessage}</p>}

              <div className="mt-6 space-y-3">
                {accounts.map((account) => {
                  const periodEnd = account.current_period_end
                    ? new Date(account.current_period_end)
                    : null;
                  const isActive = !!periodEnd &&
                    periodEnd.getTime() > currentTime &&
                    ["active", "trialing"].includes(account.status || "");
                  const hasActiveExternalBilling =
                    ["paypal", "stripe"].includes(account.payment_provider || "") &&
                    !["cancelled", "canceled", "expired"].includes(account.status || "");

                  return (
                    <article
                      key={account.user_id}
                      className="rounded-2xl border border-slate-700/80 bg-slate-950/50 p-4 sm:p-5"
                    >
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div className="min-w-0">
                          <p className="break-all font-semibold text-white">{account.email}</p>
                          <p className="mt-1 break-all text-sm text-slate-400">
                            {account.usernames.length ? account.usernames.map((name) => `@${name}`).join(", ") : "No bio username"}
                          </p>
                          <p className="mt-2 text-xs text-slate-400">
                            Account: <span className={isActive ? "text-emerald-300" : "text-slate-300"}>
                              {isActive ? "VIP" : "Non-VIP"}
                            </span>
                            {" · "}Status: {account.status || "No membership"}
                            {" · "}Provider: {account.payment_provider || "—"}
                            {" · "}Expires: {periodEnd ? periodEnd.toLocaleDateString("id-ID") : "—"}
                          </p>
                        </div>

                        <div className="flex flex-col gap-2 sm:flex-row lg:shrink-0">
                          <label className="sr-only" htmlFor={`vip-plan-${account.user_id}`}>VIP duration</label>
                          <select
                            id={`vip-plan-${account.user_id}`}
                            value={selectedPlans[account.user_id] || "monthly"}
                            onChange={(event) => setSelectedPlans((plans) => ({
                              ...plans,
                              [account.user_id]: event.target.value === "annual" ? "annual" : "monthly",
                            }))}
                            disabled={workingUserId === account.user_id}
                            className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white"
                          >
                            <option value="monthly">Add 1 month</option>
                            <option value="annual">Add 1 year</option>
                          </select>
                          <button
                            type="button"
                            onClick={() => void manageVip(account, "grant")}
                            disabled={!!workingUserId || hasActiveExternalBilling}
                            title={hasActiveExternalBilling ? "Cancel the existing provider subscription before switching to manual VIP." : undefined}
                            className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {workingUserId === account.user_id ? "Saving..." : "Activate / extend"}
                          </button>
                          {account.payment_provider === "manual" && isActive && (
                            <button
                              type="button"
                              onClick={() => void manageVip(account, "revoke")}
                              disabled={!!workingUserId}
                              className="rounded-xl border border-rose-500/40 px-4 py-2 text-sm font-semibold text-rose-300 transition hover:bg-rose-500/10 disabled:cursor-wait disabled:opacity-50"
                            >
                              Revoke
                            </button>
                          )}
                        </div>
                      </div>
                    </article>
                  );
                })}
                {!searching && query.trim().length >= 2 && accounts.length === 0 && (
                  <p className="rounded-xl border border-slate-700 p-5 text-center text-sm text-slate-400">
                    No matching accounts found.
                  </p>
                )}
              </div>
            </>
          )}
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
