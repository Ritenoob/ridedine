const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { requireAuth } = require('../middleware/auth');

// In-memory order storage (replace with database in production)
const orders = new Map();

// Create Stripe Checkout Session
router.post('/create-checkout-session', async (req, res) => {
  try {
    const { items, chefId, chefSlug } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Items are required' });
    }

    // Calculate total
    const lineItems = items.map(item => ({
      price_data: {
        currency: 'cad',
        product_data: {
          name: item.name,
          description: item.description || '',
        },
        unit_amount: Math.round(item.price * 100), // Convert to cents
      },
      quantity: item.quantity || 1,
    }));

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${req.protocol}://${req.get('host')}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.protocol}://${req.get('host')}/checkout/cancel`,
      metadata: {
        chefId: chefId || 'unknown',
        chefSlug: chefSlug || 'unknown'
      }
    });

    // Store pending order
    const orderId = `RD-${String(Math.floor(1000 + Math.random() * 9000))}`;
    orders.set(session.id, {
      orderId,
      sessionId: session.id,
      items,
      chefId,
      chefSlug,
      status: 'pending',
      paymentStatus: 'pending',
      createdAt: new Date().toISOString(),
      total: session.amount_total / 100
    });

    res.json({ 
      sessionId: session.id,
      url: session.url,
      orderId
    });
  } catch (error) {
    console.error('Stripe checkout error:', error);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

// Stripe webhook handler
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    
    // Update order status
    const order = orders.get(session.id);
    if (order) {
      order.paymentStatus = 'paid';
      order.status = 'confirmed';
      order.paidAt = new Date().toISOString();
      
      // TODO: Dispatch to Mealbridge
      console.log(`✅ Order ${order.orderId} paid - ready for dispatch`);
    }
  }

  res.json({ received: true });
});

// Verify payment
router.get('/verify/:sessionId', async (req, res) => {
  try {
    const session = await stripe.checkout.sessions.retrieve(req.params.sessionId);
    const order = orders.get(req.params.sessionId);

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json({
      orderId: order.orderId,
      paymentStatus: session.payment_status,
      orderStatus: order.status,
      total: order.total
    });
  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(500).json({ error: 'Failed to verify payment' });
  }
});

// Get all orders (admin only)
router.get('/orders', requireAuth, (req, res) => {
  const ordersList = Array.from(orders.values());
  res.json({ orders: ordersList });
});

module.exports = router;
