import { NextResponse } from "next/server";
import { getAuthenticatedUser, getSupabaseAdminClient } from "@/lib/vip-server";

export async function GET(request: Request) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return NextResponse.json({ error: "Please sign in to view analytics." }, { status: 401 });
  }

  const requestedDays = Number(new URL(request.url).searchParams.get("days") || "30");
  const days = Number.isInteger(requestedDays)
    ? Math.min(Math.max(requestedDays, 7), 90)
    : 30;
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  try {
    const supabase = getSupabaseAdminClient();
    const { data, error } = await supabase.rpc("get_short_link_analytics", {
      p_user_id: user.id,
      p_since: since,
    });

    if (error) {
      console.error("Could not load short-link analytics:", error.message);
      return NextResponse.json({ error: "Could not load short-link analytics." }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Short-link analytics request failed:", error);
    return NextResponse.json({ error: "Short-link analytics are temporarily unavailable." }, { status: 503 });
  }
}
