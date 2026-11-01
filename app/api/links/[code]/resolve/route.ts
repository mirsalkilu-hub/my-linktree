import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/vip-server";
import { hashClientIp, verifyShortLinkPassword } from "@/lib/short-link-security";

interface ResolveContext {
  params: Promise<{ code: string }>;
}

interface ShortLinkRecord {
  id: string;
  original_url: string;
  short_code: string;
  clicks: number | null;
  expires_at: string | null;
  password_protected: boolean;
  custom_domain_id: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  utm_term: string | null;
}

function responseError(message: string, status: number, extra: Record<string, unknown> = {}) {
  return NextResponse.json(
    { error: message, ...extra },
    { status, headers: { "Cache-Control": "no-store" } }
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

async function resolveShortLink(request: Request, code: string, password: string | null) {
  if (!/^[a-zA-Z0-9_-]{3,48}$/.test(code)) {
    return responseError("Short link not found.", 404);
  }

  try {
    const supabase = getSupabaseAdminClient();
    const { data: link, error } = await supabase
      .from("links")
      .select("id, original_url, short_code, clicks, expires_at, password_protected, custom_domain_id, utm_source, utm_medium, utm_campaign, utm_content, utm_term")
      .eq("short_code", code)
      .maybeSingle<ShortLinkRecord>();

    if (error) {
      console.error("Could not load short link:", error.message);
      return responseError("Short links are temporarily unavailable.", 503);
    }
    if (!link?.original_url) {
      return responseError("Short link not found.", 404);
    }

    if (link.expires_at && new Date(link.expires_at).getTime() <= Date.now()) {
      return responseError("This short link has expired.", 410, { expired: true });
    }

    const hostname = new URL(request.url).hostname.toLowerCase();
    const { data: domain, error: domainError } = await supabase
      .from("custom_domains")
      .select("id, verified_at")
      .eq("domain", hostname)
      .not("verified_at", "is", null)
      .maybeSingle();

    if (domainError) {
      console.error("Could not resolve custom domain:", domainError.message);
      return responseError("Short links are temporarily unavailable.", 503);
    }
    if (domain && link.custom_domain_id !== domain.id) {
      return responseError("Short link not found on this domain.", 404);
    }
    if (link.custom_domain_id && link.custom_domain_id !== domain?.id) {
      return responseError("This short link is not available on this domain.", 404);
    }

    if (link.password_protected) {
      const { data: protection, error: protectionError } = await supabase
        .from("short_link_protection")
        .select("password_hash")
        .eq("link_id", link.id)
        .maybeSingle();

      if (protectionError || !protection?.password_hash) {
        console.error("Could not load short-link password protection:", protectionError?.message || "Hash missing.");
        return responseError("Password verification is temporarily unavailable.", 503);
      }

      const clientIp =
        request.headers.get("x-real-ip") ||
        request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
        "unknown";
      const ipHash = hashClientIp(clientIp);
      const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { error: cleanupAttemptsError } = await supabase
        .from("short_link_password_attempts")
        .delete()
        .lt("attempted_at", oneDayAgo);
      if (cleanupAttemptsError) {
        console.error("Could not clean up expired password attempts:", cleanupAttemptsError.message);
      }

      const { count, error: attemptsError } = await supabase
        .from("short_link_password_attempts")
        .select("id", { count: "exact", head: true })
        .eq("short_code", code)
        .eq("ip_hash", ipHash)
        .gte("attempted_at", tenMinutesAgo);

      if (attemptsError) {
        console.error("Could not check password attempt limit:", attemptsError.message);
        return responseError("Password verification is temporarily unavailable.", 503);
      }
      if ((count || 0) >= 10) {
        return responseError("Too many attempts. Try again in 10 minutes.", 429);
      }

      if (!password) {
        return responseError("A password is required to open this link.", 401, {
          requiresPassword: true,
        });
      }

      const isPasswordValid = await verifyShortLinkPassword(password, protection.password_hash);
      if (!isPasswordValid) {
        const { error: recordAttemptError } = await supabase
          .from("short_link_password_attempts")
          .insert({ short_code: code, ip_hash: ipHash });
        if (recordAttemptError) {
          console.error("Could not record password attempt:", recordAttemptError.message);
        }
        return responseError("Incorrect password.", 401, { requiresPassword: true });
      }

      const { error: clearAttemptsError } = await supabase
        .from("short_link_password_attempts")
        .delete()
        .eq("short_code", code)
        .eq("ip_hash", ipHash);
      if (clearAttemptsError) {
        console.error("Could not clear password attempts:", clearAttemptsError.message);
      }
    }

    let destination: URL;
    try {
      destination = new URL(
        /^https?:\/\//i.test(link.original_url)
          ? link.original_url
          : `https://${link.original_url}`
      );
    } catch {
      console.error("Short link contains an invalid destination:", link.short_code);
      return responseError("This short link has an invalid destination.", 500);
    }

    const campaignValues = {
      utm_source: link.utm_source,
      utm_medium: link.utm_medium,
      utm_campaign: link.utm_campaign,
      utm_content: link.utm_content,
      utm_term: link.utm_term,
    };
    for (const [key, value] of Object.entries(campaignValues)) {
      if (value) destination.searchParams.set(key, value);
    }

    const referrer =
      request.headers.get("x-link-referrer") ||
      request.headers.get("referer");
    let referrerHost: string | null = null;
    if (referrer) {
      try {
        referrerHost = new URL(referrer).hostname;
      } catch {
        referrerHost = null;
      }
    }

    const { error: clickError } = await supabase.rpc("record_short_link_click", {
      p_link_id: link.id,
      p_referrer_host: referrerHost,
    });
    if (clickError) {
      console.error("Could not record short-link click:", clickError.message);
    }

    return NextResponse.json(
      { destination: destination.toString() },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("Short-link resolution failed:", error);
    return responseError("Short links are temporarily unavailable.", 503);
  }
}

export async function GET(request: Request, { params }: ResolveContext) {
  const { code } = await params;
  return resolveShortLink(request, code, null);
}

export async function POST(request: Request, { params }: ResolveContext) {
  const { code } = await params;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return responseError("Invalid request body.", 400);
  }
  if (!isRecord(body)) {
    return responseError("Invalid request body.", 400);
  }

  const password = typeof body.password === "string" ? body.password : null;
  if (password && password.length > 128) {
    return responseError("The password is too long.", 400);
  }

  return resolveShortLink(request, code, password);
}
