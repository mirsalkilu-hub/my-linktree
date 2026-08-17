import { redirect } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default async function RedirectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  // Cari link asli berdasarkan slug di database Supabase
  const { data } = await supabase
    .from("links")
    .select("original_url")
    .eq("slug", slug)
    .single();

  if (data?.original_url) {
    redirect(data.original_url);
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-red-400">404</h1>
        <p className="mt-2 text-slate-400">Link tidak ditemukan atau telah kadaluarsa.</p>
      </div>
    </div>
  );
}