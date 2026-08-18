import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ code: string }> | { code: string } }
) {
  const resolvedParams = await params;
  const code = resolvedParams.code;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // 1. Cari data URL dan jumlah klik saat ini
  const { data, error } = await supabase
    .from("links")
    .select("id, original_url, clicks")
    .eq("short_code", code)
    .maybeSingle();

  if (error || !data || !data.original_url) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // 2. Tambah jumlah klik (+1) di background
  await supabase
    .from("links")
    .update({ clicks: (data.clicks || 0) + 1 })
    .eq("id", data.id);

  let destination = data.original_url;
  if (!destination.startsWith("http://") && !destination.startsWith("https://")) {
    destination = `https://${destination}`;
  }

  return NextResponse.redirect(destination, 307);
}