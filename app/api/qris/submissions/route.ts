import { NextResponse } from "next/server";
import {
  getAuthenticatedUser,
  getSupabaseAdminClient,
} from "@/lib/vip-server";

const EVIDENCE_BUCKET = "qris-payment-evidence";
const MAX_EVIDENCE_SIZE = 5 * 1024 * 1024;
const EVIDENCE_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

async function getRequestUser(request: Request) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return {
        user: null,
        response: NextResponse.json({ error: "Please sign in to continue." }, { status: 401 }),
      };
    }

    return { user, response: null };
  } catch (error) {
    console.error("Could not authenticate QRIS submission:", error);
    return {
      user: null,
      response: NextResponse.json({ error: "Could not authenticate this request." }, { status: 500 }),
    };
  }
}

function getAdminClient() {
  try {
    return { admin: getSupabaseAdminClient(), response: null };
  } catch (error) {
    console.error("QRIS submission configuration error:", error);
    return {
      admin: null,
      response: NextResponse.json({ error: "QRIS submissions are not configured." }, { status: 503 }),
    };
  }
}

export async function GET(request: Request) {
  const auth = await getRequestUser(request);
  if (auth.response) return auth.response;

  const client = getAdminClient();
  if (client.response) return client.response;

  const { data, error } = await client.admin
    .from("qris_payment_submissions")
    .select("id, plan, amount_idr, paid_at, transaction_reference, status, admin_note, created_at")
    .eq("user_id", auth.user.id)
    .order("created_at", { ascending: false })
    .limit(10);

  if (error) {
    console.error("Could not load QRIS submissions:", error.message);
    return NextResponse.json({ error: "Could not load your QRIS payment submissions." }, { status: 500 });
  }

  return NextResponse.json(
    { submissions: data },
    { headers: { "Cache-Control": "private, no-store" } }
  );
}

export async function POST(request: Request) {
  const auth = await getRequestUser(request);
  if (auth.response) return auth.response;

  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > MAX_EVIDENCE_SIZE + 64 * 1024) {
    return NextResponse.json({ error: "Payment evidence must be 5 MB or smaller." }, { status: 413 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid QRIS submission form." }, { status: 400 });
  }

  const plan = formData.get("plan");
  const paidAtValue = formData.get("paidAt");
  const transactionReferenceValue = formData.get("transactionReference");
  if (
    (plan !== "monthly" && plan !== "annual") ||
    typeof paidAtValue !== "string" ||
    typeof transactionReferenceValue !== "string"
  ) {
    return NextResponse.json({ error: "Provide a valid plan, payment time, and transaction reference." }, { status: 400 });
  }

  const transactionReference = transactionReferenceValue.trim();
  if (transactionReference.length < 3 || transactionReference.length > 100) {
    return NextResponse.json({ error: "Transaction reference must be between 3 and 100 characters." }, { status: 400 });
  }

  const paidAt = new Date(paidAtValue);
  if (!Number.isFinite(paidAt.getTime()) || paidAt.getTime() > Date.now() + 5 * 60 * 1000) {
    return NextResponse.json({ error: "Enter a valid payment date and time." }, { status: 400 });
  }

  const evidenceValue = formData.get("evidence");
  let evidence: File | null = null;
  if (evidenceValue instanceof File) {
    if (evidenceValue.size > MAX_EVIDENCE_SIZE) {
      return NextResponse.json({ error: "Payment evidence must be 5 MB or smaller." }, { status: 413 });
    }
    if (evidenceValue.size > 0) {
      if (!EVIDENCE_TYPES[evidenceValue.type]) {
        return NextResponse.json({ error: "Evidence must be a JPEG, PNG, or WebP image." }, { status: 400 });
      }
      evidence = evidenceValue;
    }
  } else if (evidenceValue !== null) {
    return NextResponse.json({ error: "Invalid payment evidence file." }, { status: 400 });
  }

  const client = getAdminClient();
  if (client.response) return client.response;

  const submissionId = crypto.randomUUID();
  const evidencePath = evidence
    ? `${auth.user.id}/${submissionId}.${EVIDENCE_TYPES[evidence.type]}`
    : null;

  if (evidence && evidencePath) {
    const { error: uploadError } = await client.admin.storage
      .from(EVIDENCE_BUCKET)
      .upload(evidencePath, evidence, { contentType: evidence.type, upsert: false });
    if (uploadError) {
      console.error("Could not save QRIS payment evidence:", uploadError.message);
      return NextResponse.json({ error: "Could not save the payment evidence." }, { status: 502 });
    }
  }

  const { error: insertError } = await client.admin
    .from("qris_payment_submissions")
    .insert({
      id: submissionId,
      user_id: auth.user.id,
      plan,
      amount_idr: plan === "monthly" ? 50000 : 500000,
      paid_at: paidAt.toISOString(),
      transaction_reference: transactionReference,
      evidence_path: evidencePath,
    });

  if (insertError) {
    if (evidencePath) {
      const { error: cleanupError } = await client.admin.storage
        .from(EVIDENCE_BUCKET)
        .remove([evidencePath]);
      if (cleanupError) {
        console.error("Could not remove unlinked QRIS evidence:", cleanupError.message);
      }
    }

    if (insertError.code === "23505") {
      return NextResponse.json(
        { error: "This transaction reference has already been submitted." },
        { status: 409 }
      );
    }
    console.error("Could not save QRIS payment submission:", insertError.message);
    return NextResponse.json({ error: "Could not submit the QRIS payment for review." }, { status: 500 });
  }

  return NextResponse.json({ id: submissionId, status: "pending" }, { status: 201 });
}
