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

    const { driver_id, return_url, refresh_url } = await req.json();

    if (!driver_id) {
      return new Response(JSON.stringify({ error: "driver_id is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { data: driver, error: driverError } = await supabaseAdmin
      .from("drivers")
      .select("profile_id")
      .eq("id", driver_id)
      .single();

    if (driverError || !driver) {
      return new Response(JSON.stringify({ error: "Driver not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (driver.profile_id !== user.id) {
      return new Response(
        JSON.stringify({ error: "Forbidden - not your driver account" }),
        {
          status: 403,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    const account = await stripe.accounts.create({
      type: "express",
      country: "US",
      capabilities: {
        transfers: { requested: true },
      },
    });

    const { error: updateError } = await supabaseAdmin
      .from("drivers")
      .update({ connect_account_id: account.id })
      .eq("id", driver_id);

    if (updateError) {
      console.error("Error updating driver with Stripe account:", updateError);
    }

    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url:
        refresh_url || `${Deno.env.get("APP_URL")}/driver/onboarding/refresh`,
      return_url:
        return_url || `${Deno.env.get("APP_URL")}/driver/onboarding/complete`,
      type: "account_onboarding",
    });

    return new Response(
      JSON.stringify({
        account_id: account.id,
        onboarding_url: accountLink.url,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Error creating driver Connect account:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
