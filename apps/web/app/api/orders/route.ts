export const runtime = "nodejs";
export async function GET() {
  // TODO: Replace with Supabase query of orders
  return Response.json({ orders: [] });
}
