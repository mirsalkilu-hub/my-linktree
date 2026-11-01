import { NextResponse } from "next/server";
import { getAuthenticatedUser, getSupabaseAdminClient } from "@/lib/vip-server";
import { hashShortLinkPassword } from "@/lib/short-link-security";

const CODE_PATTERN = /^[a-zA-Z0-9_-]{3,48}$/;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function optionalText(value: unknown) {
  if (typeof value !== "string") return null;
  const text = value.trim();
  return text || null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export async function POST(request: Request) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return NextResponse.json({ error: "Please sign in to create advanced links." }, { status: 401 });
  }

  let requestBody: unknown;
  try {
    requestBody = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }
  if (!isRecord(requestBody)) {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }
  const body = requestBody;

  const rawUrl = optionalText(body.original_url);
  const shortCode = optionalText(body.short_code);
  const password = typeof body.password === "string" ? body.password : "";
  const expiresAt = optionalText(body.expires_at);
  const customDomainId = optionalText(body.custom_domain_id);

  if (!rawUrl) {
    return NextResponse.json({ error: "Enter a destination URL." }, { status: 400 });
  }
  if (rawUrl.length > 2048) {
    return NextResponse.json({ error: "Destination URLs must be 2,048 characters or fewer." }, { status: 400 });
  }

  let destination: URL;
  try {
    destination = new URL(/^https?:\/\//i.test(rawUrl) ? rawUrl : `https://${rawUrl}`);
  } catch {
    return NextResponse.json({ error: "Enter a valid destination URL." }, { status: 400 });
  }

  if (!["http:", "https:"].includes(destination.protocol)) {
    return NextResponse.json({ error: "Only HTTP and HTTPS destinations are allowed." }, { status: 400 });
  }

  if (!shortCode || !CODE_PATTERN.test(shortCode)) {
    return NextResponse.json({ error: "Short codes must be 3–48 letters, numbers, dashes, or underscores." }, { status: 400 });
  }
  if (password.length > 128) {
    return NextResponse.json({ error: "Passwords must be 128 characters or fewer." }, { status: 400 });
  }

  const campaignValues = [
    body.utm_source,
    body.utm_medium,
    body.utm_campaign,
    body.utm_content,
    body.utm_term,
  ];
  if (campaignValues.some((value) => typeof value === "string" && value.trim().length > 100)) {
    return NextResponse.json({ error: "UTM values must be 100 characters or fewer." }, { status: 400 });
  }

  let parsedExpiry: string | null = null;
  if (expiresAt) {
    const expiryDate = new Date(expiresAt);
    if (Number.isNaN(expiryDate.getTime()) || expiryDate.getTime() <= Date.now()) {
      return NextResponse.json({ error: "The expiration date must be in the future." }, { status: 400 });
    }
    parsedExpiry = expiryDate.toISOString();
  }

  if (customDomainId && !UUID_PATTERN.test(customDomainId)) {
    return NextResponse.json({ error: "Select a valid custom domain." }, { status: 400 });
  }

  try {
    const supabase = getSupabaseAdminClient();

    if (customDomainId) {
      const { data: domain, error: domainError } = await supabase
        .from("custom_domains")
        .select("id")
        .eq("id", customDomainId)
        .eq("user_id", user.id)
        .not("verified_at", "is", null)
        .maybeSingle();

      if (domainError) {
        console.error("Could not verify selected custom domain:", domainError.message);
        return NextResponse.json({ error: "Could not verify the selected custom domain." }, { status: 500 });
      }
      if (!domain) {
        return NextResponse.json({ error: "Choose a domain you own that has been verified." }, { status: 400 });
      }
    }

    const passwordHash = password ? await hashShortLinkPassword(password) : null;
    const { data, error } = await supabase
      .from("links")
      .insert({
        user_id: user.id,
        original_url: destination.toString(),
        short_code: shortCode,
        clicks: 0,
        expires_at: parsedExpiry,
        password_protected: !!passwordHash,
        utm_source: optionalText(body.utm_source),
        utm_medium: optionalText(body.utm_medium),
        utm_campaign: optionalText(body.utm_campaign),
        utm_content: optionalText(body.utm_content),
        utm_term: optionalText(body.utm_term),
        custom_domain_id: customDomainId,
      })
      .select("id, original_url, short_code, clicks, created_at, expires_at, utm_source, utm_medium, utm_campaign, utm_content, utm_term, custom_domain_id")
      .single();

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json({ error: "That short code is already in use. Try another one." }, { status: 409 });
      }
      console.error("Could not create short link:", error.message);
      return NextResponse.json({ error: "Could not create the short link." }, { status: 500 });
    }

    if (passwordHash) {
      const { error: protectionError } = await supabase
        .from("short_link_protection")
        .insert({ link_id: data.id, password_hash: passwordHash });

      if (protectionError) {
        console.error("Could not save short-link password:", protectionError.message);
        const { error: cleanupError } = await supabase
          .from("links")
          .delete()
          .eq("id", data.id);
        if (cleanupError) {
          console.error("Could not roll back short link after password setup failed:", cleanupError.message);
        }
        return NextResponse.json({ error: "Could not enable password protection for this link." }, { status: 500 });
      }
    }

    return NextResponse.json({ link: data }, { status: 201 });
  } catch (error) {
    console.error("Short-link creation failed:", error);
    return NextResponse.json({ error: "Short-link creation is temporarily unavailable." }, { status: 500 });
  }
}
