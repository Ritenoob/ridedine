import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@14.10.0?target=deno';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
});

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
    const {
      order_id,
      amount_cents,
      chef_connect_account_id,
      platform_fee_cents,
      success_url,
      cancel_url,
    } = await req.json();

    if (!order_id || !amount_cents || !chef_connect_account_id) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Calculate application fee (platform fee)
    const applicationFee = platform_fee_cents || Math.floor(amount_cents * 0.15); // 15% default

    // Create Checkout Session with destination charge
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Order #${order_id}`,
            },
            unit_amount: amount_cents,
          },
          quantity: 1,
        },
      ],
      payment_intent_data: {
        application_fee_amount: applicationFee,
        transfer_data: {
          destination: chef_connect_account_id,
        },
      },
      success_url: success_url || `${Deno.env.get('APP_URL')}/order/${order_id}/success`,
      cancel_url: cancel_url || `${Deno.env.get('APP_URL')}/order/${order_id}/cancel`,
      metadata: {
        order_id,
      },
    });

    // TODO: Update order with payment session ID via Supabase

    return new Response(
      JSON.stringify({
        session_id: session.id,
        session_url: session.url,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
});
