export interface OrderConfirmationData {
  customerName: string;
  orderNumber: string;
  chefName: string;
  items: Array<{ name: string; quantity: number; price: number }>;
  subtotal: number;
  deliveryFee: number;
  platformFee: number;
  total: number;
  deliveryMethod: 'delivery' | 'pickup';
  address?: string;
  scheduledFor?: string;
}

export interface OrderStatusUpdateData {
  customerName: string;
  orderNumber: string;
  status: string;
  statusLabel: string;
  chefName: string;
  trackingUrl?: string;
}

export function generateOrderConfirmationEmail(data: OrderConfirmationData): { subject: string; html: string; text: string } {
  const subject = `Order Confirmation - #${data.orderNumber}`;

  const itemsHtml = data.items.map(item => `
    <tr>
      <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.name}</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">$${(item.price / 100).toFixed(2)}</td>
    </tr>
  `).join('');

  const itemsText = data.items.map(item =>
    `${item.name} x${item.quantity} - $${(item.price / 100).toFixed(2)}`
  ).join('\n');

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background-color: #FF7A00; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="margin: 0;">RidenDine</h1>
        <p style="margin: 10px 0 0 0;">Order Confirmed!</p>
      </div>

      <div style="background-color: #f9f9f9; padding: 20px; border: 1px solid #eee; border-top: none; border-radius: 0 0 8px 8px;">
        <p>Hi ${data.customerName},</p>

        <p>Thank you for your order! Your order has been confirmed and sent to <strong>${data.chefName}</strong>.</p>

        <div style="background-color: white; padding: 15px; border-radius: 4px; margin: 20px 0;">
          <h2 style="margin-top: 0; color: #FF7A00;">Order Details</h2>
          <p><strong>Order Number:</strong> #${data.orderNumber}</p>
          <p><strong>Chef:</strong> ${data.chefName}</p>
          ${data.deliveryMethod === 'delivery' && data.address ? `<p><strong>Delivery Address:</strong> ${data.address}</p>` : ''}
          ${data.scheduledFor ? `<p><strong>Scheduled For:</strong> ${new Date(data.scheduledFor).toLocaleString()}</p>` : ''}
          <p><strong>Delivery Method:</strong> ${data.deliveryMethod === 'delivery' ? 'Delivery' : 'Pickup'}</p>
        </div>

        <table style="width: 100%; border-collapse: collapse; background-color: white; border-radius: 4px; overflow: hidden;">
          <thead>
            <tr style="background-color: #f5f5f5;">
              <th style="padding: 12px; text-align: left; border-bottom: 2px solid #ddd;">Item</th>
              <th style="padding: 12px; text-align: center; border-bottom: 2px solid #ddd;">Qty</th>
              <th style="padding: 12px; text-align: right; border-bottom: 2px solid #ddd;">Price</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
          <tfoot>
            <tr>
              <td colspan="2" style="padding: 8px; text-align: right; border-bottom: 1px solid #eee;">Subtotal:</td>
              <td style="padding: 8px; text-align: right; border-bottom: 1px solid #eee;">$${(data.subtotal / 100).toFixed(2)}</td>
            </tr>
            <tr>
              <td colspan="2" style="padding: 8px; text-align: right; border-bottom: 1px solid #eee;">Delivery Fee:</td>
              <td style="padding: 8px; text-align: right; border-bottom: 1px solid #eee;">$${(data.deliveryFee / 100).toFixed(2)}</td>
            </tr>
            <tr>
              <td colspan="2" style="padding: 8px; text-align: right; border-bottom: 1px solid #eee;">Platform Fee:</td>
              <td style="padding: 8px; text-align: right; border-bottom: 1px solid #eee;">$${(data.platformFee / 100).toFixed(2)}</td>
            </tr>
            <tr>
              <td colspan="2" style="padding: 12px; text-align: right; font-weight: bold; font-size: 18px; border-top: 2px solid #FF7A00;">Total:</td>
              <td style="padding: 12px; text-align: right; font-weight: bold; font-size: 18px; color: #FF7A00; border-top: 2px solid #FF7A00;">$${(data.total / 100).toFixed(2)}</td>
            </tr>
          </tfoot>
        </table>

        <p style="margin-top: 20px;">We'll send you updates as your order progresses!</p>

        <p style="color: #666; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
          If you have any questions, please contact us at support@ridendine.com
        </p>
      </div>
    </body>
    </html>
  `;

  const text = `
RidenDine - Order Confirmed!

Hi ${data.customerName},

Thank you for your order! Your order has been confirmed and sent to ${data.chefName}.

Order Details:
--------------
Order Number: #${data.orderNumber}
Chef: ${data.chefName}
${data.deliveryMethod === 'delivery' && data.address ? `Delivery Address: ${data.address}` : ''}
${data.scheduledFor ? `Scheduled For: ${new Date(data.scheduledFor).toLocaleString()}` : ''}
Delivery Method: ${data.deliveryMethod === 'delivery' ? 'Delivery' : 'Pickup'}

Items:
------
${itemsText}

Subtotal: $${(data.subtotal / 100).toFixed(2)}
Delivery Fee: $${(data.deliveryFee / 100).toFixed(2)}
Platform Fee: $${(data.platformFee / 100).toFixed(2)}
Total: $${(data.total / 100).toFixed(2)}

We'll send you updates as your order progresses!

If you have any questions, please contact us at support@ridendine.com
  `.trim();

  return { subject, html, text };
}

export function generateOrderStatusUpdateEmail(data: OrderStatusUpdateData): { subject: string; html: string; text: string } {
  const subject = `Order Update - #${data.orderNumber}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background-color: #FF7A00; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="margin: 0;">RidenDine</h1>
        <p style="margin: 10px 0 0 0;">Order Status Update</p>
      </div>

      <div style="background-color: #f9f9f9; padding: 20px; border: 1px solid #eee; border-top: none; border-radius: 0 0 8px 8px;">
        <p>Hi ${data.customerName},</p>

        <p>Your order status has been updated!</p>

        <div style="background-color: white; padding: 20px; border-radius: 4px; margin: 20px 0; text-align: center;">
          <p style="margin: 0; color: #666;">Order #${data.orderNumber}</p>
          <p style="margin: 10px 0; font-size: 24px; font-weight: bold; color: #FF7A00;">${data.statusLabel}</p>
          <p style="margin: 0; color: #666;">Chef: ${data.chefName}</p>
        </div>

        ${data.trackingUrl ? `
          <div style="text-align: center; margin: 30px 0;">
            <a href="${data.trackingUrl}" style="display: inline-block; background-color: #FF7A00; color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px; font-weight: bold;">Track Your Order</a>
          </div>
        ` : ''}

        <p style="color: #666; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
          If you have any questions, please contact us at support@ridendine.com
        </p>
      </div>
    </body>
    </html>
  `;

  const text = `
RidenDine - Order Status Update

Hi ${data.customerName},

Your order status has been updated!

Order #${data.orderNumber}
Status: ${data.statusLabel}
Chef: ${data.chefName}

${data.trackingUrl ? `Track your order: ${data.trackingUrl}` : ''}

If you have any questions, please contact us at support@ridendine.com
  `.trim();

  return { subject, html, text };
}
