import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

/**
 * POST /api/webhooks/commission
 *
 * Triggered when an order is completed/delivered to calculate and record commission.
 * Expected body: { order_id: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { order_id } = body;

    if (!order_id) {
      return NextResponse.json({ error: "order_id is required" }, { status: 400 });
    }

    if (!supabaseServiceKey) {
      return NextResponse.json({ error: "Server not configured" }, { status: 503 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch the order
    const { data: order, error: orderErr } = await supabase
      .from("orders")
      .select("id, chef_id, total_cents, status")
      .eq("id", order_id)
      .single();

    if (orderErr || !order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Fetch platform commission rate
    const { data: setting } = await supabase
      .from("platform_settings")
      .select("value")
      .eq("key", "commission_rate")
      .single();

    const commissionRate = setting ? parseFloat(setting.value) : 0.15;
    const commissionCents = Math.round(order.total_cents * commissionRate);
    const chefPayoutCents = order.total_cents - commissionCents;

    // Check for existing commission record
    const { data: existing } = await supabase
      .from("commission_records")
      .select("id")
      .eq("order_id", order_id)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ ok: true, message: "Commission already recorded", commission_id: existing.id });
    }

    // Insert commission record
    const { data: commission, error: commErr } = await supabase
      .from("commission_records")
      .insert({
        order_id: order.id,
        chef_id: order.chef_id,
        order_total_cents: order.total_cents,
        commission_rate: commissionRate,
        commission_cents: commissionCents,
        chef_payout_cents: chefPayoutCents,
        status: "pending",
      })
      .select()
      .single();

    if (commErr) {
      return NextResponse.json({ error: commErr.message }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      commission_id: commission.id,
      commission_cents: commissionCents,
      chef_payout_cents: chefPayoutCents,
      rate: commissionRate,
    });
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
