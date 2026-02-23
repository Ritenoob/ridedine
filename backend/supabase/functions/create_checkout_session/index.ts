import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@14.10.0?target=deno';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
});

type OrderRecord = {
  id: string;
  total_cents: number;
  platform_fee_cents: number;
  customer_id: string;
  chefs: { connect_account_id: string | null } | null;
};

const jsonHeaders = { 'Content-Type': 'application/json' };

serve(async (req) => {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401,
        headers: jsonHeaders,
      });
    }

    const { order_id, success_url, cancel_url } = await req.json();
    if (!order_id) {
      return new Response(JSON.stringify({ error: 'order_id is required' }), {
        status: 400,
        headers: jsonHeaders,
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') || '';

    if (!supabaseUrl || !supabaseServiceRoleKey || !supabaseAnonKey) {
      return new Response(
        JSON.stringify({ error: 'Missing required Supabase environment variables' }),
        { status: 500, headers: jsonHeaders }
      );
    }

    const userResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
      method: 'GET',
      headers: {
        Authorization: authHeader,
        apikey: supabaseAnonKey,
      },
    });

    if (!userResponse.ok) {
      return new Response(JSON.stringify({ error: 'Unauthorized request' }), {
        status: 401,
        headers: jsonHeaders,
      });
    }

    const user = await userResponse.json();
    const userId = user?.id;

    if (!userId) {
      return new Response(JSON.stringify({ error: 'Unable to resolve authenticated user' }), {
        status: 401,
        headers: jsonHeaders,
      });
    }

    const query = new URLSearchParams({
      select: 'id,total_cents,platform_fee_cents,customer_id,chefs(connect_account_id)',
      id: `eq.${order_id}`,
      customer_id: `eq.${userId}`,
      limit: '1',
    });

    const orderResponse = await fetch(`${supabaseUrl}/rest/v1/orders?${query.toString()}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${supabaseServiceRoleKey}`,
        apikey: supabaseServiceRoleKey,
      },
    });

    if (!orderResponse.ok) {
      return new Response(JSON.stringify({ error: 'Failed to load order' }), {
        status: 500,
        headers: jsonHeaders,
      });
    }

    const orders = (await orderResponse.json()) as OrderRecord[];
    const order = orders[0];

    if (!order) {
      return new Response(JSON.stringify({ error: 'Order not found' }), {
        status: 404,
        headers: jsonHeaders,
      });
    }

    const amountCents = order.total_cents;
    const applicationFee = order.platform_fee_cents;
    const chefConnectAccountId = order.chefs?.connect_account_id;

    if (!chefConnectAccountId) {
      return new Response(JSON.stringify({ error: 'Chef payout account is not configured' }), {
        status: 400,
        headers: jsonHeaders,
      });
    }

    if (!amountCents || amountCents <= 0) {
      return new Response(JSON.stringify({ error: 'Order amount is invalid' }), {
        status: 400,
        headers: jsonHeaders,
      });
    }

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
            unit_amount: amountCents,
          },
          quantity: 1,
        },
      ],
      payment_intent_data: {
        application_fee_amount: applicationFee,
        transfer_data: {
          destination: chefConnectAccountId,
        },
      },
      success_url: success_url || `${Deno.env.get('APP_URL')}/order/${order_id}/success`,
      cancel_url: cancel_url || `${Deno.env.get('APP_URL')}/order/${order_id}/cancel`,
      metadata: {
        order_id,
      },
    });

    return new Response(
      JSON.stringify({
        session_id: session.id,
        session_url: session.url,
      }),
      { status: 200, headers: jsonHeaders }
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: jsonHeaders,
    });
  }
});
