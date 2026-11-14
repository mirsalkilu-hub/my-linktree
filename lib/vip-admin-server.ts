import { NextResponse } from "next/server";
import type { User } from "@supabase/supabase-js";
import { VIP_ADMIN_EMAIL } from "@/lib/vip-admin-config";
import {
  getAuthenticatedUser,
  getSupabaseAdminClient,
} from "@/lib/vip-server";

export function isVipAdmin(user: User) {
  return (
    !!user.email_confirmed_at &&
    user.email?.trim().toLowerCase() === VIP_ADMIN_EMAIL
  );
}

type VipAdminContextResult =
  | { ok: true; admin: ReturnType<typeof getSupabaseAdminClient>; user: User }
  | { ok: false; response: NextResponse };

export async function getVipAdminContext(request: Request): Promise<VipAdminContextResult> {
  let user: User | null;
  try {
    user = await getAuthenticatedUser(request);
  } catch (error) {
    console.error("Could not authenticate VIP admin request:", error);
    return {
      ok: false,
      response: NextResponse.json({ error: "Could not authenticate this request." }, { status: 500 }),
    };
  }

  if (!user) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Please sign in to continue." }, { status: 401 }),
    };
  }
  if (!isVipAdmin(user)) {
    return {
      ok: false,
      response: NextResponse.json({ error: "You are not allowed to manage VIP accounts." }, { status: 403 }),
    };
  }

  try {
    return { ok: true, admin: getSupabaseAdminClient(), user };
  } catch (error) {
    console.error("VIP admin configuration error:", error);
    return {
      ok: false,
      response: NextResponse.json({ error: "VIP account management is not configured." }, { status: 503 }),
    };
  }
}
