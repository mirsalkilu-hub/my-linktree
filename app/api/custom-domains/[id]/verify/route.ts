import { NextResponse } from "next/server";
import { getAuthenticatedUser, getSupabaseAdminClient } from "@/lib/vip-server";

interface VerifyContext {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, { params }: VerifyContext) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return NextResponse.json({ error: "Please sign in to verify a custom domain." }, { status: 401 });
  }

  const { id } = await params;
  try {
    const supabase = getSupabaseAdminClient();
    const { data: domain, error: domainError } = await supabase
      .from("custom_domains")
      .select("id, domain, verification_token, verified_at")
      .eq("id", id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (domainError) {
      console.error("Could not load custom domain for verification:", domainError.message);
      return NextResponse.json({ error: "Could not load this custom domain." }, { status: 500 });
    }
    if (!domain) {
      return NextResponse.json({ error: "Custom domain not found." }, { status: 404 });
    }
    if (domain.verified_at) {
      return NextResponse.json({ verified: true, domain });
    }

    const dnsResponse = await fetch(
      `https://dns.google/resolve?name=${encodeURIComponent(`_urlyu-verification.${domain.domain}`)}&type=TXT`,
      { cache: "no-store" }
    );
    if (!dnsResponse.ok) {
      console.error("DNS verification provider returned status:", dnsResponse.status);
      return NextResponse.json({ error: "Could not check DNS records. Try again later." }, { status: 502 });
    }

    const dnsResult: { Answer?: Array<{ data?: string }> } = await dnsResponse.json();
    const expectedValue = `urlyu-verification=${domain.verification_token}`;
    const isVerified = dnsResult.Answer?.some((record) =>
      (record.data || "").replaceAll('"', "").includes(expectedValue)
    );

    if (!isVerified) {
      return NextResponse.json(
        { error: "Verification record not found yet. DNS changes may take time to propagate." },
        { status: 422 }
      );
    }

    const { data: verifiedDomain, error: updateError } = await supabase
      .from("custom_domains")
      .update({ verified_at: new Date().toISOString() })
      .eq("id", domain.id)
      .eq("user_id", user.id)
      .select("id, domain, verification_token, verified_at, created_at")
      .single();

    if (updateError) {
      console.error("Could not save custom domain verification:", updateError.message);
      return NextResponse.json({ error: "DNS was verified, but the status could not be saved." }, { status: 500 });
    }

    return NextResponse.json({ verified: true, domain: verifiedDomain });
  } catch (error) {
    console.error("Custom domain verification failed:", error);
    return NextResponse.json({ error: "Could not verify the custom domain." }, { status: 503 });
  }
}
