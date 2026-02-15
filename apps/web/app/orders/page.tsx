export default function OrdersPage() {
  return (
    <main style={{ padding: "2rem", maxWidth: 1040, margin: "0 auto" }}>
      <h1>Orders</h1>
      <p>Your order history will appear here.</p>
      <p style={{ opacity: 0.8 }}>
        Next: fetch orders for the signed-in user from Supabase.
      </p>
    </main>
  );
}
