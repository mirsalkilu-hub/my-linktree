import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ code: string }> | { code: string } }
) {
  // Solusi untuk menangani params di Next.js 14/15
  const resolvedParams = await params;
  const code = resolvedParams.code;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data, error } = await supabase
    .from("links")
    .select("original_url")
    .eq("short_code", code)
    .maybeSingle();

  if (error || !data || !data.original_url) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  let destination = data.original_url;
  if (!destination.startsWith("http://") && !destination.startsWith("https://")) {
    destination = `https://${destination}`;
  }

  return NextResponse.redirect(destination, 307);
}