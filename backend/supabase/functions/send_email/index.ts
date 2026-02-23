import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const RESEND_API_URL = 'https://api.resend.com/emails';
const FROM_EMAIL = Deno.env.get('FROM_EMAIL') || 'notifications@ridendine.com';

interface EmailPayload {
  to?: string;
  orderId?: string;
  type: 'order_confirmation' | 'status_update' | 'custom';
  subject?: string;
  html?: string;
  text?: string;
  status?: string;
}

serve(async (req) => {
  try {
    // Only allow POST requests
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Parse request body
    const payload: EmailPayload = await req.json();
    const { type, orderId, status } = payload;
    let { to, subject, html, text } = payload;

    // Initialize Supabase client if we need to fetch order data
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Generate email content based on type
    if (type === 'order_confirmation' || type === 'status_update') {
      if (!orderId) {
        return new Response(
          JSON.stringify({ error: 'orderId required for order emails' }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

      // Fetch order data with related information
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select(`
          *,
          customer:profiles!customer_id(name, email),
          chef:chefs(
            profiles!inner(name)
          ),
          order_items(
            quantity,
            price_cents,
            special_instructions,
            menu_items(name)
          )
        `)
        .eq('id', orderId)
        .single();

      if (orderError || !order) {
        return new Response(
          JSON.stringify({ error: 'Order not found' }),
          {
            status: 404,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

      to = order.customer.email;

      if (type === 'order_confirmation') {
        subject = `Order Confirmation - #${order.tracking_token || order.id.slice(0, 8)}`;

        const items = order.order_items.map((item: any) => `
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.menu_items.name}</td>
            <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
            <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">$${(item.price_cents / 100).toFixed(2)}</td>
          </tr>
        `).join('');

        html = `
          <!DOCTYPE html>
          <html>
          <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: #FF7A00; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0;">RidenDine</h1>
              <p style="margin: 10px 0 0 0;">Order Confirmed!</p>
            </div>
            <div style="background-color: #f9f9f9; padding: 20px; border: 1px solid #eee; border-top: none; border-radius: 0 0 8px 8px;">
              <p>Hi ${order.customer.name},</p>
              <p>Thank you for your order! Your order has been confirmed and sent to <strong>${order.chef.profiles.name}</strong>.</p>
              <div style="background-color: white; padding: 15px; border-radius: 4px; margin: 20px 0;">
                <h2 style="margin-top: 0; color: #FF7A00;">Order Details</h2>
                <p><strong>Order Number:</strong> #${order.tracking_token || order.id.slice(0, 8)}</p>
                <p><strong>Chef:</strong> ${order.chef.profiles.name}</p>
                ${order.delivery_method === 'delivery' && order.address ? `<p><strong>Delivery Address:</strong> ${order.address}</p>` : ''}
                <p><strong>Delivery Method:</strong> ${order.delivery_method === 'delivery' ? 'Delivery' : 'Pickup'}</p>
              </div>
              <table style="width: 100%; border-collapse: collapse; background-color: white; border-radius: 4px; overflow: hidden;">
                <thead>
                  <tr style="background-color: #f5f5f5;">
                    <th style="padding: 12px; text-align: left; border-bottom: 2px solid #ddd;">Item</th>
                    <th style="padding: 12px; text-align: center; border-bottom: 2px solid #ddd;">Qty</th>
                    <th style="padding: 12px; text-align: right; border-bottom: 2px solid #ddd;">Price</th>
                  </tr>
                </thead>
                <tbody>${items}</tbody>
                <tfoot>
                  <tr>
                    <td colspan="2" style="padding: 8px; text-align: right; border-bottom: 1px solid #eee;">Subtotal:</td>
                    <td style="padding: 8px; text-align: right; border-bottom: 1px solid #eee;">$${(order.subtotal_cents / 100).toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td colspan="2" style="padding: 8px; text-align: right; border-bottom: 1px solid #eee;">Delivery Fee:</td>
                    <td style="padding: 8px; text-align: right; border-bottom: 1px solid #eee;">$${(order.delivery_fee_cents / 100).toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td colspan="2" style="padding: 8px; text-align: right; border-bottom: 1px solid #eee;">Platform Fee:</td>
                    <td style="padding: 8px; text-align: right; border-bottom: 1px solid #eee;">$${(order.platform_fee_cents / 100).toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td colspan="2" style="padding: 12px; text-align: right; font-weight: bold; font-size: 18px; border-top: 2px solid #FF7A00;">Total:</td>
                    <td style="padding: 12px; text-align: right; font-weight: bold; font-size: 18px; color: #FF7A00; border-top: 2px solid #FF7A00;">$${(order.total_cents / 100).toFixed(2)}</td>
                  </tr>
                </tfoot>
              </table>
              <p style="margin-top: 20px;">We'll send you updates as your order progresses!</p>
            </div>
          </body>
          </html>
        `;

        text = `RidenDine - Order Confirmed!\n\nHi ${order.customer.name},\n\nThank you for your order! Your order has been confirmed and sent to ${order.chef.profiles.name}.\n\nOrder Number: #${order.tracking_token || order.id.slice(0, 8)}\nChef: ${order.chef.profiles.name}\nTotal: $${(order.total_cents / 100).toFixed(2)}`;

      } else if (type === 'status_update') {
        const statusLabels: Record<string, string> = {
          accepted: 'Accepted by Chef',
          preparing: 'Preparing',
          ready: 'Ready for Pickup',
          picked_up: 'Picked Up',
          delivered: 'Delivered',
          cancelled: 'Cancelled',
        };

        const statusLabel = statusLabels[status || order.status] || order.status;
        subject = `Order Update - #${order.tracking_token || order.id.slice(0, 8)}`;

        html = `
          <!DOCTYPE html>
          <html>
          <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: #FF7A00; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0;">RidenDine</h1>
              <p style="margin: 10px 0 0 0;">Order Status Update</p>
            </div>
            <div style="background-color: #f9f9f9; padding: 20px; border: 1px solid #eee; border-top: none; border-radius: 0 0 8px 8px;">
              <p>Hi ${order.customer.name},</p>
              <p>Your order status has been updated!</p>
              <div style="background-color: white; padding: 20px; border-radius: 4px; margin: 20px 0; text-align: center;">
                <p style="margin: 0; color: #666;">Order #${order.tracking_token || order.id.slice(0, 8)}</p>
                <p style="margin: 10px 0; font-size: 24px; font-weight: bold; color: #FF7A00;">${statusLabel}</p>
                <p style="margin: 0; color: #666;">Chef: ${order.chef.profiles.name}</p>
              </div>
            </div>
          </body>
          </html>
        `;

        text = `RidenDine - Order Status Update\n\nHi ${order.customer.name},\n\nYour order status has been updated!\n\nOrder #${order.tracking_token || order.id.slice(0, 8)}\nStatus: ${statusLabel}\nChef: ${order.chef.profiles.name}`;
      }
    } else if (type === 'custom') {
      // Custom email with provided content
      if (!to || !subject || !html) {
        return new Response(
          JSON.stringify({ error: 'to, subject, html required for custom emails' }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }
    }

    if (!RESEND_API_KEY) {
      console.error('RESEND_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'Email service not configured' }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Send email via Resend
    const response = await fetch(RESEND_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [to],
        subject,
        html,
        text: text || undefined,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Resend API error:', errorText);
      return new Response(
        JSON.stringify({
          error: 'Failed to send email',
          details: errorText,
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const result = await response.json();

    return new Response(
      JSON.stringify({
        success: true,
        result,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in send_email function:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
});
