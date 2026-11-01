import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { getAuthenticatedUser, getSupabaseAdminClient } from "@/lib/vip-server";

function normalizeDomain(value: unknown) {
  if (typeof value !== "string") return null;

  const candidate = value.trim().toLowerCase().replace(/\.$/, "");
  if (
    !candidate ||
    candidate.includes("://") ||
    candidate.includes("/") ||
    candidate.includes(":") ||
    candidate.length > 253 ||
    !/^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/.test(candidate)
  ) {
    return null;
  }

  return candidate;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export async function GET(request: Request) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return NextResponse.json({ error: "Please sign in to manage custom domains." }, { status: 401 });
  }

  try {
    const supabase = getSupabaseAdminClient();
    const { data, error } = await supabase
      .from("custom_domains")
      .select("id, domain, verification_token, verified_at, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Could not load custom domains:", error.message);
      return NextResponse.json({ error: "Could not load custom domains." }, { status: 500 });
    }

    return NextResponse.json({ domains: data || [] });
  } catch (error) {
    console.error("Custom domain lookup failed:", error);
    return NextResponse.json({ error: "Custom domains are temporarily unavailable." }, { status: 503 });
  }
}

export async function POST(request: Request) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return NextResponse.json({ error: "Please sign in to add a custom domain." }, { status: 401 });
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

  const domain = normalizeDomain(requestBody.domain);
  if (!domain) {
    return NextResponse.json({ error: "Enter a valid domain without a protocol or path." }, { status: 400 });
  }

  const verificationToken = randomBytes(24).toString("hex");

  try {
    const supabase = getSupabaseAdminClient();
    const { data, error } = await supabase
      .from("custom_domains")
      .insert({
        user_id: user.id,
        domain,
        verification_token: verificationToken,
      })
      .select("id, domain, verification_token, verified_at, created_at")
      .single();

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json({ error: "This domain is already registered." }, { status: 409 });
      }
      console.error("Could not add custom domain:", error.message);
      return NextResponse.json({ error: "Could not add the custom domain." }, { status: 500 });
    }

    return NextResponse.json({ domain: data }, { status: 201 });
  } catch (error) {
    console.error("Custom domain registration failed:", error);
    return NextResponse.json({ error: "Custom domains are temporarily unavailable." }, { status: 503 });
  }
}
