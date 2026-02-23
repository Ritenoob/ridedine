import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@14.10.0?target=deno';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
});

const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET') || '';

// Create Supabase client with service role key for admin operations
const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

serve(async (req) => {
  const signature = req.headers.get('stripe-signature');

  if (!signature) {
    return new Response(JSON.stringify({ error: 'Missing signature' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await req.text();
    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);

    console.log('Webhook event received:', event.type);

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const orderId = session.metadata?.order_id;

        if (orderId) {
          // Update order payment status to 'succeeded'
          const { error } = await supabaseAdmin
            .from('orders')
            .update({ 
              payment_status: 'succeeded',
              payment_intent_id: session.payment_intent as string
            })
            .eq('id', orderId);

          if (error) {
            console.error('Error updating order payment status:', error);
          } else {
            console.log(`Payment succeeded for order: ${orderId}`);
          }
        }
        break;
      }

      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log('PaymentIntent succeeded:', paymentIntent.id);
        
        // Find order by payment_intent_id and update status
        const { error } = await supabaseAdmin
          .from('orders')
          .update({ payment_status: 'succeeded' })
          .eq('payment_intent_id', paymentIntent.id);

        if (error) {
          console.error('Error updating payment status:', error);
        }
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log('PaymentIntent failed:', paymentIntent.id);
        
        // Update order status to failed and notify customer
        const { error } = await supabaseAdmin
          .from('orders')
          .update({ 
            payment_status: 'failed',
            status: 'cancelled'
          })
          .eq('payment_intent_id', paymentIntent.id);

        if (error) {
          console.error('Error updating payment failure:', error);
        }
        break;
      }

      case 'account.updated': {
        const account = event.data.object as Stripe.Account;
        
        // Update chef payout_enabled status based on account.charges_enabled
        const { error } = await supabaseAdmin
          .from('chefs')
          .update({ 
            payout_enabled: account.charges_enabled || false 
          })
          .eq('connect_account_id', account.id);

        if (error) {
          console.error('Error updating chef payout status:', error);
        } else {
          console.log(
            'Account updated:', 
            account.id, 
            'Charges enabled:', 
            account.charges_enabled
          );
        }
        break;
      }

      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge;
        console.log('Charge refunded:', charge.id);
        
        // Update order status to 'refunded'
        const { error } = await supabaseAdmin
          .from('orders')
          .update({ 
            payment_status: 'refunded',
            status: 'refunded'
          })
          .eq('payment_intent_id', charge.payment_intent as string);

        if (error) {
          console.error('Error updating refund status:', error);
        }
        break;
      }

      default:
        console.log('Unhandled event type:', event.type);
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Webhook error:', error.message);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
});
