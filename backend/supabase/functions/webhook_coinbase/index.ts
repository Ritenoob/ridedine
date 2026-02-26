import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createHmac } from "https://deno.land/std@0.177.0/node/crypto.ts";

const COINBASE_WEBHOOK_SECRET = Deno.env.get("COINBASE_WEBHOOK_SECRET");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

serve(async (req) => {
  try {
    const signature = req.headers.get("X-CC-Webhook-Signature");
    if (!signature || !COINBASE_WEBHOOK_SECRET) {
      console.error("Missing signature or webhook secret");
      return new Response("Unauthorized", { status: 401 });
    }

    const body = await req.text();
    const hmac = createHmac("sha256", COINBASE_WEBHOOK_SECRET);
    hmac.update(body);
    const expectedSignature = hmac.digest("hex");

    if (signature !== expectedSignature) {
      console.error("Invalid webhook signature");
      return new Response("Unauthorized", { status: 401 });
    }

    const event = JSON.parse(body);
    console.log("Coinbase webhook event:", event.type);

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });

    switch (event.type) {
      case "charge:created":
        await handleChargeCreated(supabase, event);
        break;

      case "charge:confirmed":
        await handleChargeConfirmed(supabase, event);
        break;

      case "charge:failed":
        await handleChargeFailed(supabase, event);
        break;

      case "charge:delayed":
        await handleChargeDelayed(supabase, event);
        break;

      case "charge:pending":
        await handleChargePending(supabase, event);
        break;

      case "charge:resolved":
        await handleChargeResolved(supabase, event);
        break;

      default:
        console.log("Unhandled event type:", event.type);
    }

    return new Response("OK", { status: 200 });
  } catch (error) {
    console.error("Webhook processing error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
});

async function handleChargeCreated(supabase: any, event: any) {
  const charge = event.data;
  const orderId = charge.metadata.order_id;

  console.log("Charge created:", charge.code);

  await supabase
    .from("crypto_payments")
    .update({
      status: "pending",
      metadata: charge,
    })
    .eq("processor_payment_id", charge.code);
}

async function handleChargePending(supabase: any, event: any) {
  const charge = event.data;
  const orderId = charge.metadata.order_id;

  console.log("Charge pending:", charge.code);

  const timeline = charge.timeline || [];
  const latestPayment = timeline.find((t: any) => t.status === "PENDING");

  if (latestPayment && latestPayment.payment) {
    const payment = latestPayment.payment;

    await supabase
      .from("crypto_payments")
      .update({
        status: "detected",
        cryptocurrency: payment.network,
        crypto_amount: payment.value.crypto.amount,
        wallet_address: payment.transaction_id,
        transaction_hash: payment.transaction_id,
        network: payment.network,
        detected_at: new Date().toISOString(),
        metadata: charge,
      })
      .eq("processor_payment_id", charge.code);
  }
}

async function handleChargeConfirmed(supabase: any, event: any) {
  const charge = event.data;
  const orderId = charge.metadata.order_id;

  console.log("Charge confirmed:", charge.code);

  const payments = charge.payments || [];
  const confirmedPayment = payments.find((p: any) => p.status === "CONFIRMED");

  if (confirmedPayment) {
    await supabase
      .from("crypto_payments")
      .update({
        status: "confirmed",
        cryptocurrency: confirmedPayment.network,
        crypto_amount: confirmedPayment.value.crypto.amount,
        wallet_address: confirmedPayment.transaction_id,
        transaction_hash: confirmedPayment.transaction_id,
        network: confirmedPayment.network,
        block_height: confirmedPayment.block?.height,
        confirmations: confirmedPayment.block?.confirmations || 1,
        confirmed_at: new Date().toISOString(),
        metadata: charge,
      })
      .eq("processor_payment_id", charge.code);

    await supabase
      .from("orders")
      .update({ payment_status: "paid" })
      .eq("id", orderId);

    console.log("Triggering payment distribution for order:", orderId);
    await triggerPaymentDistribution(supabase, orderId);
  }
}

async function handleChargeFailed(supabase: any, event: any) {
  const charge = event.data;
  const orderId = charge.metadata.order_id;

  console.log("Charge failed:", charge.code);

  await supabase
    .from("crypto_payments")
    .update({
      status: "failed",
      metadata: charge,
    })
    .eq("processor_payment_id", charge.code);

  await supabase
    .from("orders")
    .update({ payment_status: "failed" })
    .eq("id", orderId);
}

async function handleChargeDelayed(supabase: any, event: any) {
  const charge = event.data;

  console.log("Charge delayed (underpaid/overpaid):", charge.code);

  await supabase
    .from("crypto_payments")
    .update({
      status: charge.pricing.underpaid ? "underpaid" : "overpaid",
      metadata: charge,
    })
    .eq("processor_payment_id", charge.code);
}

async function handleChargeResolved(supabase: any, event: any) {
  const charge = event.data;
  const orderId = charge.metadata.order_id;

  console.log("Charge resolved:", charge.code);

  await supabase
    .from("crypto_payments")
    .update({
      status: "resolved",
      metadata: charge,
    })
    .eq("processor_payment_id", charge.code);

  if (
    charge.payments &&
    charge.payments.some((p: any) => p.status === "CONFIRMED")
  ) {
    await supabase
      .from("orders")
      .update({ payment_status: "paid" })
      .eq("id", orderId);

    await triggerPaymentDistribution(supabase, orderId);
  }
}

async function triggerPaymentDistribution(supabase: any, orderId: string) {
  try {
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("*, chef:chefs(*)")
      .eq("id", orderId)
      .single();

    if (orderError || !order) {
      console.error("Failed to fetch order:", orderError);
      return;
    }

    const distributeUrl = `${SUPABASE_URL}/functions/v1/distribute_payment`;
    const response = await fetch(distributeUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify({
        order_id: orderId,
        payment_method: "crypto",
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Payment distribution failed:", errorText);
    } else {
      console.log("Payment distribution completed for order:", orderId);
    }
  } catch (error) {
    console.error("Error triggering payment distribution:", error);
  }
}
