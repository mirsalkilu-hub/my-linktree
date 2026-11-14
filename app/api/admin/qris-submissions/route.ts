import { NextResponse } from "next/server";
import { getVipAdminContext } from "@/lib/vip-admin-server";

const EVIDENCE_BUCKET = "qris-payment-evidence";

interface AdminQrisSubmission {
  id: string;
  user_id: string;
  email: string;
  usernames: string[];
  plan: string;
  amount_idr: number;
  paid_at: string;
  transaction_reference: string;
  evidence_path: string | null;
  created_at: string;
}

export async function GET(request: Request) {
  const context = await getVipAdminContext(request);
  if (!context.ok) return context.response;

  const { data, error } = await context.admin.rpc("admin_list_qris_submissions");
  if (error) {
    console.error("Could not load QRIS review queue:", error.message);
    return NextResponse.json({ error: "Could not load the QRIS review queue." }, { status: 500 });
  }

  const rows: AdminQrisSubmission[] = data;
  const submissions = await Promise.all(
    rows.map(async (submission) => {
      if (!submission.evidence_path) {
        return { ...submission, evidence_url: null };
      }

      const { data: signedEvidence, error: signedUrlError } = await context.admin.storage
        .from(EVIDENCE_BUCKET)
        .createSignedUrl(submission.evidence_path, 10 * 60);
      if (signedUrlError) {
        console.error("Could not create QRIS evidence URL:", signedUrlError.message);
        throw new Error("Could not load payment evidence.");
      }
      return { ...submission, evidence_url: signedEvidence.signedUrl };
    })
  ).catch((error: unknown) => {
    console.error("Could not prepare QRIS review queue:", error);
    return null;
  });

  if (!submissions) {
    return NextResponse.json({ error: "Could not load payment evidence." }, { status: 500 });
  }

  return NextResponse.json(
    { submissions },
    { headers: { "Cache-Control": "private, no-store" } }
  );
}

export async function POST(request: Request) {
  const context = await getVipAdminContext(request);
  if (!context.ok) return context.response;

  let body: Record<string, unknown>;
  try {
    const parsed: unknown = await request.json();
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
      return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
    }
    body = parsed as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const submissionId = body.submissionId;
  const decision = body.decision;
  const note = typeof body.note === "string" ? body.note.trim() : "";
  if (typeof submissionId !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(submissionId)) {
    return NextResponse.json({ error: "Choose a valid QRIS submission." }, { status: 400 });
  }
  if (decision !== "approve" && decision !== "reject") {
    return NextResponse.json({ error: "Choose approve or reject." }, { status: 400 });
  }
  if (decision === "reject" && (note.length < 3 || note.length > 500)) {
    return NextResponse.json({ error: "Provide a rejection reason between 3 and 500 characters." }, { status: 400 });
  }
  if (decision === "approve" && note.length > 500) {
    return NextResponse.json({ error: "Review notes must be 500 characters or fewer." }, { status: 400 });
  }

  const { data: submission, error: submissionError } = await context.admin
    .from("qris_payment_submissions")
    .select("evidence_path")
    .eq("id", submissionId)
    .maybeSingle();
  if (submissionError) {
    console.error("Could not load QRIS submission for review:", submissionError.message);
    return NextResponse.json({ error: "Could not load the QRIS submission." }, { status: 500 });
  }
  if (!submission) {
    return NextResponse.json({ error: "QRIS submission not found." }, { status: 404 });
  }

  const { data, error } = await context.admin.rpc("admin_review_qris_submission", {
    p_submission_id: submissionId,
    p_reviewer_id: context.user.id,
    p_approved: decision === "approve",
    p_admin_note: note || null,
  });

  if (error) {
    if (error.code === "P0002") {
      return NextResponse.json({ error: "QRIS submission not found." }, { status: 404 });
    }
    if (error.code === "55000") {
      return NextResponse.json({ error: "This QRIS submission has already been reviewed." }, { status: 409 });
    }
    if (error.code === "23514" && error.message.includes("EXTERNAL_SUBSCRIPTION_ACTIVE")) {
      return NextResponse.json(
        { error: "Cancel the existing provider subscription before activating manual VIP." },
        { status: 409 }
      );
    }
    if (error.code === "22023") {
      return NextResponse.json({ error: "A rejection reason is required." }, { status: 400 });
    }
    console.error("Could not review QRIS submission:", error.message);
    return NextResponse.json({ error: "Could not review the QRIS submission." }, { status: 500 });
  }

  if (submission.evidence_path) {
    const { error: deleteError } = await context.admin.storage
      .from(EVIDENCE_BUCKET)
      .remove([submission.evidence_path]);
    if (deleteError) {
      console.error("Could not delete reviewed QRIS evidence:", deleteError.message);
      return NextResponse.json(
        { error: "The decision was saved, but payment evidence could not be deleted." },
        { status: 500 }
      );
    }

    const { error: clearPathError } = await context.admin
      .from("qris_payment_submissions")
      .update({ evidence_path: null })
      .eq("id", submissionId);
    if (clearPathError) {
      console.error("Could not clear the deleted QRIS evidence path:", clearPathError.message);
      return NextResponse.json(
        { error: "The decision was saved, but evidence details could not be cleaned up." },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({ result: data[0] });
}
