export const runtime = "nodejs";
export async function GET() {
  // TODO: Replace with Supabase query of chefs + availability
  return Response.json({ chefs: [] });
}
