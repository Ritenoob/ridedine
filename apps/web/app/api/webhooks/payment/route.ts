import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
const webhookSecret = process.env.WEBHOOK_SECRET ?? "";

function verifyWebhookAuth(request: NextRequest): boolean {
  if (!webhookSecret) return true; // skip if not configured
  const auth = request.headers.get("x-webhook-secret");
  return auth === webhookSecret;
}

/**
 * POST /api/webhooks/payment
 *
 * Receives payment events (typically from Stripe webhook forwarding).
 * Expected body: { order_id: string, payment_status: string, payment_intent_id?: string }
 * Requires x-webhook-secret header when WEBHOOK_SECRET env var is set.
 */
export async function POST(request: NextRequest) {
  if (!verifyWebhookAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = await request.json();
    const { order_id, payment_status, payment_intent_id } = body;

    if (!order_id || !payment_status) {
      return NextResponse.json({ error: "order_id and payment_status are required" }, { status: 400 });
    }

    const validStatuses = ["pending", "processing", "succeeded", "failed", "refunded"];
    if (!validStatuses.includes(payment_status)) {
      return NextResponse.json({ error: `Invalid payment_status. Must be one of: ${validStatuses.join(", ")}` }, { status: 400 });
    }

    if (!supabaseServiceKey) {
      return NextResponse.json({ error: "Server not configured" }, { status: 503 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const updateData: Record<string, string> = {
      payment_status,
      updated_at: new Date().toISOString(),
    };
    if (payment_intent_id) {
      updateData.payment_intent_id = payment_intent_id;
    }

    const { error } = await supabase
      .from("orders")
      .update(updateData)
      .eq("id", order_id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, order_id, payment_status });
  } catch (err) {
    console.error("[webhook/payment] Error:", err);
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
