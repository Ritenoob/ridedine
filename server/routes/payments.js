const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const orderService = require('../services/orders');

// Robust env parsing
const DEMO_MODE = ['true', '1', 'yes', 'y', 'on'].includes(String(process.env.DEMO_MODE || '').toLowerCase());
const HAS_STRIPE_KEYS = !!(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_PUBLISHABLE_KEY);

// Only require stripe if keys are available
let stripe = null;
if (HAS_STRIPE_KEYS) {
  stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
}

// Create Payment Intent or Mock Payment
router.post('/create-intent', async (req, res) => {
  try {
    const { items, chefId, chefSlug, customerInfo, amount } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Items are required' });
    }

    // Calculate total
    const total = amount || items.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);

    // If demo mode OR no Stripe keys, return mock success
    if (DEMO_MODE || !HAS_STRIPE_KEYS) {
      const mockPaymentId = `demo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Create order immediately
      const order = orderService.createOrder({
        sessionId: mockPaymentId,
        items,
        chefId,
        chefSlug,
        customerInfo,
        status: 'confirmed',
        paymentStatus: 'paid',
        total,
        paidAt: new Date().toISOString(),
        demoMode: true
      });

      return res.json({
        status: 'succeeded',
        paymentId: mockPaymentId,
        orderId: order.orderId,
        demoMode: true,
        message: 'Demo payment succeeded automatically'
      });
    }

    // Real Stripe payment
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(total * 100), // Convert to cents
      currency: 'cad',
      metadata: {
        chefId: chefId || 'unknown',
        chefSlug: chefSlug || 'unknown',
        customerInfo: JSON.stringify(customerInfo || {})
      }
    });

    // Store pending order
    const order = orderService.createOrder({
      sessionId: paymentIntent.id,
      items,
      chefId,
      chefSlug,
      customerInfo,
      status: 'pending',
      paymentStatus: 'pending',
      total
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentId: paymentIntent.id,
      orderId: order.orderId
    });
  } catch (error) {
    console.error('Payment intent error:', error);
    res.status(500).json({ error: 'Failed to create payment intent' });
  }
});

// Legacy: Create Stripe Checkout Session (keep for backward compatibility)
router.post('/create-checkout-session', async (req, res) => {
  try {
    const { items, chefId, chefSlug, customerInfo } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Items are required' });
    }

    // Calculate total
    const total = items.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);

    // If demo mode OR no Stripe keys, return mock success
    if (DEMO_MODE || !HAS_STRIPE_KEYS) {
      const mockSessionId = `demo_session_${Date.now()}`;
      const successUrl = `${req.protocol}://${req.get('host')}/checkout/success.html?session_id=${mockSessionId}`;
      
      // Create order immediately
      const order = orderService.createOrder({
        sessionId: mockSessionId,
        items,
        chefId,
        chefSlug,
        customerInfo,
        status: 'confirmed',
        paymentStatus: 'paid',
        total,
        paidAt: new Date().toISOString(),
        demoMode: true
      });

      return res.json({
        sessionId: mockSessionId,
        url: successUrl,
        orderId: order.orderId,
        demoMode: true
      });
    }

    // Real Stripe checkout
    const lineItems = items.map(item => ({
      price_data: {
        currency: 'cad',
        product_data: {
          name: item.name,
          description: item.description || '',
        },
        unit_amount: Math.round(item.price * 100),
      },
      quantity: item.quantity || 1,
    }));

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${req.protocol}://${req.get('host')}/checkout/success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.protocol}://${req.get('host')}/checkout/cancel.html`,
      metadata: {
        chefId: chefId || 'unknown',
        chefSlug: chefSlug || 'unknown'
      }
    });

    // Store pending order
    const order = orderService.createOrder({
      sessionId: session.id,
      items,
      chefId,
      chefSlug,
      customerInfo,
      status: 'pending',
      paymentStatus: 'pending',
      total: session.amount_total / 100
    });

    res.json({
      sessionId: session.id,
      url: session.url,
      orderId: order.orderId
    });
  } catch (error) {
    console.error('Stripe checkout error:', error);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

// Stripe webhook handler
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  if (!HAS_STRIPE_KEYS) {
    return res.json({ received: true, note: 'Webhooks disabled in demo mode' });
  }

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
    
    // Update order status using shared service
    const order = orderService.findOrderBySessionId(session.id);
    if (order) {
      orderService.updateOrder(order.orderId, {
        paymentStatus: 'paid',
        status: 'confirmed',
        paidAt: new Date().toISOString()
      });
      
      console.log(`✅ Order ${order.orderId} paid - ready for dispatch`);
    }
  }

  res.json({ received: true });
});

// Verify payment
router.get('/verify/:sessionId', async (req, res) => {
  try {
    const order = orderService.findOrderBySessionId(req.params.sessionId);

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // For demo mode, return order status directly
    if (DEMO_MODE || !HAS_STRIPE_KEYS || order.demoMode) {
      return res.json({
        orderId: order.orderId,
        paymentStatus: order.paymentStatus,
        orderStatus: order.status,
        total: order.total,
        demoMode: true
      });
    }

    // For real Stripe payments, verify with Stripe
    const session = await stripe.checkout.sessions.retrieve(req.params.sessionId);

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
  const ordersList = orderService.listOrders();
  res.json({ orders: ordersList });
});

module.exports = router;
