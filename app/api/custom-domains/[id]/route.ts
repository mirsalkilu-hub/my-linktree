import { NextResponse } from "next/server";
import { getAuthenticatedUser, getSupabaseAdminClient } from "@/lib/vip-server";

interface DomainContext {
  params: Promise<{ id: string }>;
}

export async function DELETE(request: Request, { params }: DomainContext) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return NextResponse.json({ error: "Please sign in to remove a custom domain." }, { status: 401 });
  }

  const { id } = await params;
  try {
    const supabase = getSupabaseAdminClient();
    const { error } = await supabase
      .from("custom_domains")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      console.error("Could not remove custom domain:", error.message);
      return NextResponse.json({ error: "Could not remove the custom domain." }, { status: 500 });
    }

    return NextResponse.json({ removed: true });
  } catch (error) {
    console.error("Custom domain removal failed:", error);
    return NextResponse.json({ error: "Custom domains are temporarily unavailable." }, { status: 503 });
  }
}
