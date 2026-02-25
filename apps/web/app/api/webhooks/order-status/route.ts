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
 * POST /api/webhooks/order-status
 *
 * Receives order status change events from external systems (e.g. POS, driver app).
 * Expected body: { order_id: string, status: string }
 * Requires x-webhook-secret header when WEBHOOK_SECRET env var is set.
 */
export async function POST(request: NextRequest) {
  if (!verifyWebhookAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = await request.json();
    const { order_id, status } = body;

    if (!order_id || !status) {
      return NextResponse.json({ error: "order_id and status are required" }, { status: 400 });
    }

    const validStatuses = ["placed", "accepted", "preparing", "ready", "picked_up", "delivered", "cancelled"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: `Invalid status. Must be one of: ${validStatuses.join(", ")}` }, { status: 400 });
    }

    if (!supabaseServiceKey) {
      return NextResponse.json({ error: "Server not configured" }, { status: 503 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { error } = await supabase
      .from("orders")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", order_id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, order_id, status });
  } catch (err) {
    console.error("[webhook/order-status] Error:", err);
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
