import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const COINBASE_API_KEY = Deno.env.get("COINBASE_COMMERCE_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

interface CreateChargeRequest {
  order_id: string;
  amount_cents: number;
  currency: string;
  customer_name: string;
  customer_email: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST",
        "Access-Control-Allow-Headers": "authorization, content-type",
      },
    });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing auth header" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });

    const body: CreateChargeRequest = await req.json();
    const { order_id, amount_cents, currency, customer_name, customer_email } =
      body;

    if (!order_id || !amount_cents || !currency) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("*")
      .eq("id", order_id)
      .eq("customer_id", user.id)
      .single();

    if (orderError || !order) {
      return new Response(
        JSON.stringify({ error: "Order not found or unauthorized" }),
        { status: 404, headers: { "Content-Type": "application/json" } },
      );
    }

    const { data: existingPayment } = await supabase
      .from("crypto_payments")
      .select("*")
      .eq("order_id", order_id)
      .single();

    if (existingPayment) {
      return new Response(
        JSON.stringify({
          success: true,
          charge_id: existingPayment.processor_payment_id,
          hosted_url: existingPayment.hosted_url,
          status: existingPayment.status,
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }

    const chargeData = {
      name: `RidenDine Order #${order_id.slice(0, 8)}`,
      description: `Order for ${customer_name}`,
      local_price: {
        amount: (amount_cents / 100).toFixed(2),
        currency: currency,
      },
      pricing_type: "fixed_price",
      metadata: {
        order_id: order_id,
        customer_id: user.id,
        customer_email: customer_email,
      },
      redirect_url: `${
        req.headers.get("origin") || "https://ridendine.com"
      }/orders/${order_id}`,
      cancel_url: `${
        req.headers.get("origin") || "https://ridendine.com"
      }/checkout?payment=cancelled`,
    };

    const coinbaseResponse = await fetch(
      "https://api.commerce.coinbase.com/charges",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CC-Api-Key": COINBASE_API_KEY!,
          "X-CC-Version": "2018-03-22",
        },
        body: JSON.stringify(chargeData),
      },
    );

    if (!coinbaseResponse.ok) {
      const errorText = await coinbaseResponse.text();
      console.error("Coinbase API error:", errorText);
      return new Response(
        JSON.stringify({ error: "Failed to create crypto payment" }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }

    const coinbaseData = await coinbaseResponse.json();
    const charge = coinbaseData.data;

    const { error: insertError } = await supabase
      .from("crypto_payments")
      .insert({
        order_id: order_id,
        processor: "coinbase_commerce",
        processor_payment_id: charge.code,
        hosted_url: charge.hosted_url,
        fiat_amount_cents: amount_cents,
        fiat_currency: currency,
        status: "pending",
        expires_at: charge.expires_at,
        metadata: charge,
      });

    if (insertError) {
      console.error("Database insert error:", insertError);
      return new Response(
        JSON.stringify({ error: "Failed to store payment record" }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }

    await supabase
      .from("orders")
      .update({ payment_method: "crypto", payment_status: "pending" })
      .eq("id", order_id);

    return new Response(
      JSON.stringify({
        success: true,
        charge_id: charge.code,
        hosted_url: charge.hosted_url,
        expires_at: charge.expires_at,
        pricing: charge.pricing,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      },
    );
  } catch (error) {
    console.error("Error creating crypto payment:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
