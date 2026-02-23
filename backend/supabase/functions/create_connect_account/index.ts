import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@14.10.0?target=deno';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
});

// Create Supabase client with service role key for admin operations
const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

serve(async (req) => {
  try {
    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get request body
    const { chef_id, return_url, refresh_url } = await req.json();

    if (!chef_id) {
      return new Response(JSON.stringify({ error: 'chef_id is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Create Stripe Connect account
    const account = await stripe.accounts.create({
      type: 'express',
      country: 'US',
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
    });

    // Store account ID in chefs table
    const { error: updateError } = await supabaseAdmin
      .from('chefs')
      .update({ connect_account_id: account.id })
      .eq('id', chef_id);

    if (updateError) {
      console.error('Error updating chef with Stripe account:', updateError);
      // Continue anyway - the account is created, we can retry the update later
    }

    // Create account link for onboarding
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: refresh_url || `${Deno.env.get('APP_URL')}/chef/onboarding/refresh`,
      return_url: return_url || `${Deno.env.get('APP_URL')}/chef/onboarding/complete`,
      type: 'account_onboarding',
    });

    return new Response(
      JSON.stringify({
        account_id: account.id,
        onboarding_url: accountLink.url,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error creating Connect account:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
});
