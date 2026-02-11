// Payment helpers for RideNDine
// Handles both mock and real payment flows

(function () {
  'use strict';

  // Create checkout session (Stripe-compatible)
  async function createCheckoutSession(cart) {
    try {
      const body = {
        items: cart.items || [],
        chefId: cart.chefId || null,
        chefSlug: cart.chefSlug || null,
        customerInfo: cart.customerInfo || {},
        metadata: cart.metadata || {},
      };

      const result = await window.apiFetch('/api/payments/create-checkout-session', {
        method: 'POST',
        body,
      });

      if (!result.ok) {
        throw new Error(result.data?.error || 'Failed to create checkout session');
      }

      return result.data; // { sessionId, url, orderId, demoMode }
    } catch (error) {
      console.error('Create checkout session error:', error);
      throw error;
    }
  }

  // Create payment intent (for embedded payment form)
  async function createPaymentIntent(cart) {
    try {
      const body = {
        items: cart.items || [],
        chefId: cart.chefId || null,
        chefSlug: cart.chefSlug || null,
        customerInfo: cart.customerInfo || {},
        amount: cart.amount || null,
      };

      const result = await window.apiFetch('/api/payments/create-intent', {
        method: 'POST',
        body,
      });

      if (!result.ok) {
        throw new Error(result.data?.error || 'Failed to create payment intent');
      }

      return result.data; // { clientSecret, paymentId, orderId, demoMode }
    } catch (error) {
      console.error('Create payment intent error:', error);
      throw error;
    }
  }

  // Start mock checkout flow (for demo mode)
  async function startMockCheckout(cart) {
    try {
      const session = await createCheckoutSession(cart);
      console.log('Mock checkout session:', session);

      if (session.demoMode) {
        // Show success notification
        showMockPaymentSuccess(session);
        return session;
      } else {
        // Redirect to Stripe Checkout
        if (session.url) {
          window.location.href = session.url;
        } else {
          throw new Error('No checkout URL returned');
        }
      }
    } catch (error) {
      console.error('Checkout failed:', error);
      showPaymentError(error.message);
      throw error;
    }
  }

  // Show mock payment success UI
  function showMockPaymentSuccess(session) {
    // Show toast notification
    if (window.showToast) {
      window.showToast(
        `✅ Payment successful (Demo Mode)! Order #${session.orderId}`,
        'success',
        5000
      );
    }

    // Update payment status element if it exists
    const statusEl = document.getElementById('payment-status');
    if (statusEl) {
      statusEl.textContent = `✅ Payment successful (Demo Mode)! Session ID: ${session.sessionId}`;
      statusEl.className = 'payment-success';
      statusEl.style.cssText = `
        padding: 16px;
        background: rgba(34, 197, 94, 0.1);
        border: 2px solid rgba(34, 197, 94, 0.5);
        border-radius: 8px;
        color: #15803d;
        font-weight: 600;
        margin: 16px 0;
      `;
    }

    // Navigate to success page after a short delay
    setTimeout(() => {
      if (window.navigateTo) {
        window.navigateTo(`/checkout/success?session_id=${session.sessionId}&order_id=${session.orderId}`);
      } else if (window.Router) {
        window.Router.navigate(`/checkout/success?session_id=${session.sessionId}&order_id=${session.orderId}`);
      }
    }, 2000);
  }

  // Show payment error UI
  function showPaymentError(message) {
    if (window.showToast) {
      window.showToast(`❌ ${message}`, 'error', 5000);
    } else {
      alert(`Payment Error: ${message}`);
    }

    const statusEl = document.getElementById('payment-status');
    if (statusEl) {
      statusEl.textContent = `❌ Payment failed: ${message}`;
      statusEl.className = 'payment-error';
      statusEl.style.cssText = `
        padding: 16px;
        background: rgba(220, 38, 38, 0.1);
        border: 2px solid rgba(220, 38, 38, 0.5);
        border-radius: 8px;
        color: #991b1b;
        font-weight: 600;
        margin: 16px 0;
      `;
    }
  }

  // Verify payment status
  async function verifyPayment(sessionId) {
    try {
      const result = await window.apiFetch(`/api/payments/verify/${sessionId}`);
      
      if (!result.ok) {
        throw new Error(result.data?.error || 'Failed to verify payment');
      }

      return result.data;
    } catch (error) {
      console.error('Payment verification error:', error);
      throw error;
    }
  }

  // Export payment utilities
  window.PaymentUtils = {
    createCheckoutSession,
    createPaymentIntent,
    startMockCheckout,
    showMockPaymentSuccess,
    showPaymentError,
    verifyPayment,
  };

  console.log('[RideNDine] Payment utilities loaded');
})();
