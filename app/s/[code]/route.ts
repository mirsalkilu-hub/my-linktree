import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ code: string }> | { code: string } }
) {
  const { code } = await params;
  return NextResponse.redirect(new URL(`/${encodeURIComponent(code)}`, request.url));
}