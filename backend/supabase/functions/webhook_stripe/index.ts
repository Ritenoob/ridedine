import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.10.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2023-10-16",
  httpClient: Stripe.createFetchHttpClient(),
});

const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET") || "";

const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
);

serve(async (req) => {
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return new Response(JSON.stringify({ error: "Missing signature" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.text();
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      webhookSecret,
    );

    console.log("Webhook event received:", event.type);

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const orderId = session.metadata?.order_id;

        if (orderId) {
          const { error } = await supabaseAdmin
            .from("orders")
            .update({
              payment_status: "succeeded",
              payment_intent_id: session.payment_intent as string,
            })
            .eq("id", orderId);

          if (error) {
            console.error("Error updating order payment status:", error);
          } else {
            console.log(`Payment succeeded for order: ${orderId}`);
          }
        }
        break;
      }

      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log("PaymentIntent succeeded:", paymentIntent.id);

        const { data: orderData, error } = await supabaseAdmin
          .from("orders")
          .update({ payment_status: "succeeded" })
          .eq("payment_intent_id", paymentIntent.id)
          .select("id")
          .single();

        if (error) {
          console.error("Error updating payment status:", error);
        } else if (orderData) {
          try {
            const distributionResponse = await fetch(
              `${Deno.env.get("SUPABASE_URL")}/functions/v1/distribute_payment`,
              {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  order_id: orderData.id,
                  payment_intent_id: paymentIntent.id,
                }),
              },
            );

            if (!distributionResponse.ok) {
              const errorText = await distributionResponse.text();
              console.error("Payment distribution failed:", errorText);
            } else {
              const result = await distributionResponse.json();
              console.log("Payment distributed:", result);
            }
          } catch (distributionError) {
            console.error(
              "Error calling distribute_payment:",
              distributionError,
            );
          }
        }
        break;
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log("PaymentIntent failed:", paymentIntent.id);

        const { error } = await supabaseAdmin
          .from("orders")
          .update({
            payment_status: "failed",
            status: "cancelled",
          })
          .eq("payment_intent_id", paymentIntent.id);

        if (error) {
          console.error("Error updating payment failure:", error);
        }
        break;
      }

      case "account.updated": {
        const account = event.data.object as Stripe.Account;

        const { error: chefError } = await supabaseAdmin
          .from("chefs")
          .update({
            payout_enabled: account.charges_enabled || false,
          })
          .eq("connect_account_id", account.id);

        if (chefError) {
          console.error("Error updating chef payout status:", chefError);
        }

        const { error: driverError } = await supabaseAdmin
          .from("drivers")
          .update({
            payout_enabled: account.charges_enabled || false,
          })
          .eq("connect_account_id", account.id);

        if (driverError) {
          console.error("Error updating driver payout status:", driverError);
        }

        if (!chefError || !driverError) {
          console.log(
            "Account updated:",
            account.id,
            "Charges enabled:",
            account.charges_enabled,
          );
        }
        break;
      }

      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge;
        console.log("Charge refunded:", charge.id);

        const { error } = await supabaseAdmin
          .from("orders")
          .update({
            payment_status: "refunded",
            status: "refunded",
          })
          .eq("payment_intent_id", charge.payment_intent as string);

        if (error) {
          console.error("Error updating refund status:", error);
        }
        break;
      }

      default:
        console.log("Unhandled event type:", event.type);
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Webhook error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
});
