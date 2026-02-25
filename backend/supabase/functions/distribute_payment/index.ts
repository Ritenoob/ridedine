import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.10.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2023-10-16",
  httpClient: Stripe.createFetchHttpClient(),
});

const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
);

const COCO_BASE_CENTS = 1000;
const COCO_SPLIT_PERCENT = 0.6;
const PLATFORM_SPLIT_PERCENT = 0.4;

serve(async (req) => {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    const token = authHeader.replace("Bearer ", "");
    if (
      token !== Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") &&
      token !== Deno.env.get("SUPABASE_ANON_KEY")
    ) {
      const {
        data: { user },
        error: authError,
      } = await supabaseAdmin.auth.getUser(token);
      if (authError || !user) {
        return new Response(
          JSON.stringify({ error: "Unauthorized - invalid token" }),
          {
            status: 401,
            headers: { "Content-Type": "application/json" },
          },
        );
      }
    }

    const { order_id, payment_intent_id } = await req.json();

    if (!order_id) {
      return new Response(JSON.stringify({ error: "order_id is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { data: existingTransfers } = await supabaseAdmin
      .from("payment_transfers")
      .select("id")
      .eq("order_id", order_id)
      .limit(1);

    if (existingTransfers && existingTransfers.length > 0) {
      console.log(
        `Transfers already exist for order ${order_id}, skipping duplicate distribution`,
      );
      return new Response(
        JSON.stringify({
          success: true,
          message: "Transfers already distributed",
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    let chargeId: string | undefined;
    if (payment_intent_id) {
      try {
        const paymentIntent =
          await stripe.paymentIntents.retrieve(payment_intent_id);
        chargeId =
          typeof paymentIntent.latest_charge === "string"
            ? paymentIntent.latest_charge
            : paymentIntent.latest_charge?.id;
      } catch (error) {
        console.warn(
          "Could not retrieve PaymentIntent for source_transaction:",
          error,
        );
      }
    }

    const { data: order, error: orderError } = await supabaseAdmin
      .from("orders")
      .select(
        `
        *,
        chefs!inner(id, connect_account_id),
        deliveries!inner(id, driver_id, drivers(id, connect_account_id))
      `,
      )
      .eq("id", order_id)
      .single();

    if (orderError || !order) {
      console.error("Error fetching order:", orderError);
      return new Response(JSON.stringify({ error: "Order not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { data: cocoConfig } = await supabaseAdmin
      .from("coco_config")
      .select("*")
      .single();

    const cocoShareCents = Math.floor(COCO_BASE_CENTS * COCO_SPLIT_PERCENT);
    const platformShareCents = Math.floor(
      COCO_BASE_CENTS * PLATFORM_SPLIT_PERCENT,
    );

    const chefPaymentCents = order.subtotal_cents;
    const driverPaymentCents = order.delivery_fee_cents || 0;

    const transfers: any[] = [];

    if (order.chefs?.connect_account_id) {
      try {
        const transfer = await stripe.transfers.create({
          amount: chefPaymentCents,
          currency: "usd",
          destination: order.chefs.connect_account_id,
          transfer_group: `order_${order_id}`,
          source_transaction: chargeId,
          metadata: { order_id, recipient_type: "chef" },
        });

        transfers.push({
          order_id,
          recipient_type: "chef",
          recipient_id: order.chefs.id,
          stripe_transfer_id: transfer.id,
          amount_cents: chefPaymentCents,
          status: "succeeded",
        });
      } catch (error) {
        console.error("Chef transfer failed:", error);
        transfers.push({
          order_id,
          recipient_type: "chef",
          recipient_id: order.chefs.id,
          stripe_transfer_id: null,
          amount_cents: chefPaymentCents,
          status: "failed",
          failure_reason: error.message,
        });
      }
    } else {
      console.warn(
        `Chef ${order.chefs?.id} has no connect_account_id - skipping transfer`,
      );
      transfers.push({
        order_id,
        recipient_type: "chef",
        recipient_id: order.chefs.id,
        stripe_transfer_id: null,
        amount_cents: chefPaymentCents,
        status: "skipped",
        failure_reason: "No connect_account_id",
      });
    }

    if (cocoConfig?.stripe_account_id) {
      try {
        const transfer = await stripe.transfers.create({
          amount: cocoShareCents,
          currency: "usd",
          destination: cocoConfig.stripe_account_id,
          transfer_group: `order_${order_id}`,
          source_transaction: chargeId,
          metadata: { order_id, recipient_type: "coco" },
        });

        transfers.push({
          order_id,
          recipient_type: "coco",
          recipient_id: cocoConfig.id,
          stripe_transfer_id: transfer.id,
          amount_cents: cocoShareCents,
          status: "succeeded",
        });
      } catch (error) {
        console.error("CoCo transfer failed:", error);
        transfers.push({
          order_id,
          recipient_type: "coco",
          recipient_id: cocoConfig.id,
          stripe_transfer_id: null,
          amount_cents: cocoShareCents,
          status: "failed",
          failure_reason: error.message,
        });
      }
    } else {
      console.warn("CoCo has no stripe_account_id - skipping transfer");
      if (cocoConfig) {
        transfers.push({
          order_id,
          recipient_type: "coco",
          recipient_id: cocoConfig.id,
          stripe_transfer_id: null,
          amount_cents: cocoShareCents,
          status: "skipped",
          failure_reason: "No stripe_account_id",
        });
      }
    }

    if (order.deliveries?.drivers?.connect_account_id) {
      try {
        const transfer = await stripe.transfers.create({
          amount: driverPaymentCents,
          currency: "usd",
          destination: order.deliveries.drivers.connect_account_id,
          transfer_group: `order_${order_id}`,
          source_transaction: chargeId,
          metadata: { order_id, recipient_type: "driver" },
        });

        transfers.push({
          order_id,
          recipient_type: "driver",
          recipient_id: order.deliveries.drivers.id,
          stripe_transfer_id: transfer.id,
          amount_cents: driverPaymentCents,
          status: "succeeded",
        });
      } catch (error) {
        console.error("Driver transfer failed:", error);
        transfers.push({
          order_id,
          recipient_type: "driver",
          recipient_id: order.deliveries.drivers.id,
          stripe_transfer_id: null,
          amount_cents: driverPaymentCents,
          status: "failed",
          failure_reason: error.message,
        });
      }
    } else {
      console.warn(
        `Driver ${order.deliveries?.driver_id} has no connect_account_id - skipping transfer`,
      );
      if (order.deliveries?.drivers?.id) {
        transfers.push({
          order_id,
          recipient_type: "driver",
          recipient_id: order.deliveries.drivers.id,
          stripe_transfer_id: null,
          amount_cents: driverPaymentCents,
          status: "skipped",
          failure_reason: "No connect_account_id",
        });
      }
    }

    const { error: insertError } = await supabaseAdmin
      .from("payment_transfers")
      .insert(transfers);

    if (insertError) {
      console.error("Error inserting payment_transfers:", insertError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        transfers: transfers.length,
        platform_retained_cents: platformShareCents,
        details: transfers.map((t) => ({
          recipient_type: t.recipient_type,
          amount_cents: t.amount_cents,
          status: t.status,
        })),
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Error distributing payment:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
