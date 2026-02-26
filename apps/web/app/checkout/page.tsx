"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "../../lib/CartContext";
import { getSupabaseClient } from "../../lib/supabaseClient";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import { PaymentMethodSelector } from "../../components/PaymentMethodSelector";
import { StripePaymentForm } from "../../components/StripePaymentForm";
import { CryptoPayment } from "../../components/CryptoPayment";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
);

type PaymentMethod = "stripe" | "crypto";

export default function CheckoutPage() {
  const { items, total, chefId, clearCart } = useCart();
  const router = useRouter();
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("stripe");
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (items.length === 0) router.push("/cart");
    const supabase = getSupabaseClient();
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) return;
      setEmail(data.session.user.email ?? "");
      const { data: profile } = await supabase
        .from("profiles")
        .select("name")
        .eq("id", data.session.user.id)
        .single();
      if (profile?.name) setName(profile.name);
    });
  }, [items.length, router]);

  const handleProceedToPayment = async () => {
    const supabase = getSupabaseClient();
    if (!chefId || items.length === 0) return;
    if (!deliveryAddress.trim()) {
      setError("Please enter a delivery address.");
      return;
    }
    if (!name.trim()) {
      setError("Please enter your name.");
      return;
    }
    if (!email.trim()) {
      setError("Please enter your email.");
      return;
    }

    setIsCreatingOrder(true);
    setError(null);

    try {
      const { data: session } = await supabase.auth.getSession();
      const userId = session.session?.user?.id ?? null;
      const customerName = name.trim();
      const customerEmail = email.trim();

      const { data: order, error: orderErr } = await supabase
        .from("orders")
        .insert({
          chef_id: chefId,
          customer_id: userId,
          customer_name: customerName,
          customer_email: customerEmail,
          delivery_address: deliveryAddress,
          status: "pending",
          payment_status: "unpaid",
          payment_method: paymentMethod,
          total_cents: Math.round(total * 100),
        })
        .select()
        .single();

      if (orderErr) {
        setError(orderErr.message);
        setIsCreatingOrder(false);
        return;
      }

      await supabase.from("order_items").insert(
        items.map((i) => ({
          order_id: order.id,
          dish_id: i.id,
          quantity: i.quantity,
          price_cents: Math.round(i.price * 100),
        })),
      );

      setOrderId(order.id);

      if (paymentMethod === "stripe") {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/create_checkout_session`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
            },
            body: JSON.stringify({
              order_id: order.id,
              amount: Math.round(total * 100),
            }),
          },
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to create payment");
        }

        const data = await response.json();
        setClientSecret(data.clientSecret);
      }

      setIsCreatingOrder(false);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "An unexpected error occurred";
      setError(message);
      setIsCreatingOrder(false);
    }
  };

  const handleStripeSuccess = () => {
    clearCart();
    router.push(`/payment/success?order_id=${orderId}`);
  };

  const handleStripeError = (errorMessage: string) => {
    setError(errorMessage);
  };

  const handleCryptoError = (errorMessage: string) => {
    setError(errorMessage);
  };

  const showPaymentUI = orderId !== null;

  return (
    <div>
      <nav className="nav">
        <Link href="/" className="nav-brand">
          🍜 RidenDine
        </Link>
        <Link href="/cart" className="nav-link">
          ← Back to Cart
        </Link>
      </nav>

      <div className="page" style={{ maxWidth: 900 }}>
        <h1 className="page-title" style={{ marginBottom: 16 }}>
          Checkout
        </h1>

        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 24 }}
        >
          <div>
            {/* Delivery Details */}
            <div className="card card-body" style={{ marginBottom: 20 }}>
              <h3 style={{ fontWeight: 700, marginBottom: 16 }}>
                Delivery Details
              </h3>
              <div
                style={{ display: "flex", flexDirection: "column", gap: 12 }}
              >
                <div>
                  <label className="form-label">Your Name</label>
                  <input
                    className="form-input"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Full name"
                    disabled={showPaymentUI}
                  />
                </div>
                <div>
                  <label className="form-label">Email</label>
                  <input
                    className="form-input"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    disabled={showPaymentUI}
                  />
                </div>
                <div>
                  <label className="form-label">Delivery Address</label>
                  <input
                    className="form-input"
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    placeholder="123 Main St, City, State"
                    required
                    disabled={showPaymentUI}
                  />
                </div>
              </div>
            </div>

            {/* Payment Section */}
            <div className="card card-body">
              {!showPaymentUI ? (
                <>
                  <h3 style={{ fontWeight: 700, marginBottom: 16 }}>
                    Payment Method
                  </h3>
                  <PaymentMethodSelector
                    selected={paymentMethod}
                    onSelect={setPaymentMethod}
                  />

                  {error && (
                    <div
                      style={{
                        marginTop: 16,
                        padding: 12,
                        backgroundColor: "#fee",
                        border: "1px solid #fcc",
                        borderRadius: 6,
                        color: "#c33",
                        fontSize: 14,
                      }}
                    >
                      {error}
                    </div>
                  )}

                  <button
                    className="btn btn-primary btn-lg"
                    style={{ width: "100%", marginTop: 16 }}
                    onClick={handleProceedToPayment}
                    disabled={isCreatingOrder}
                  >
                    {isCreatingOrder
                      ? "Processing..."
                      : `Proceed to Payment — $${total.toFixed(2)}`}
                  </button>
                </>
              ) : (
                <>
                  <h3 style={{ fontWeight: 700, marginBottom: 16 }}>
                    Complete Payment
                  </h3>

                  {error && (
                    <div
                      style={{
                        marginBottom: 16,
                        padding: 12,
                        backgroundColor: "#fee",
                        border: "1px solid #fcc",
                        borderRadius: 6,
                        color: "#c33",
                        fontSize: 14,
                      }}
                    >
                      {error}
                    </div>
                  )}

                  {paymentMethod === "stripe" && clientSecret && (
                    <Elements stripe={stripePromise} options={{ clientSecret }}>
                      <StripePaymentForm
                        onSuccess={handleStripeSuccess}
                        onError={handleStripeError}
                      />
                    </Elements>
                  )}

                  {paymentMethod === "crypto" && orderId && (
                    <CryptoPayment
                      orderId={orderId}
                      amount={Math.round(total * 100)}
                      currency="CAD"
                      customerName={name}
                      customerEmail={email}
                      onError={handleCryptoError}
                    />
                  )}
                </>
              )}
            </div>
          </div>

          {/* Order Summary */}
          <div>
            <div className="card card-body">
              <h3 style={{ fontWeight: 700, marginBottom: 16 }}>
                Order Summary
              </h3>
              {items.map((i) => (
                <div
                  key={i.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: 10,
                    fontSize: 14,
                  }}
                >
                  <span>
                    {i.name} × {i.quantity}
                  </span>
                  <span style={{ fontWeight: 600 }}>
                    ${(i.price * i.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
              <div
                style={{
                  borderTop: "1px solid var(--border)",
                  marginTop: 12,
                  paddingTop: 12,
                  display: "flex",
                  justifyContent: "space-between",
                  fontWeight: 700,
                  fontSize: 16,
                }}
              >
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>

              {showPaymentUI && (
                <div
                  style={{
                    marginTop: 12,
                    paddingTop: 12,
                    borderTop: "1px solid var(--border)",
                    fontSize: 14,
                    color: "var(--text-secondary)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: 4,
                    }}
                  >
                    <span>Order ID:</span>
                    <span style={{ fontFamily: "monospace", fontSize: 12 }}>
                      {orderId?.slice(0, 8)}
                    </span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                    }}
                  >
                    <span>Payment:</span>
                    <span>
                      {paymentMethod === "stripe"
                        ? "Credit Card"
                        : "Cryptocurrency"}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
