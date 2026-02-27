import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(request: NextRequest) {
  try {
    const { name, email, password, bio, cuisines, address } = await request.json();

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Create auth user
    const { data: authData, error: authErr } = await supabaseAdmin.auth.signUp({
      email,
      password,
    });

    if (authErr || !authData.user) {
      return NextResponse.json({ error: authErr?.message || "Signup failed" }, { status: 400 });
    }

    const userId = authData.user.id;

    // Create profile
    const { error: profileErr } = await supabaseAdmin.from("profiles").upsert({
      id: userId,
      name,
      email,
      role: "chef",
    });

    if (profileErr) {
      return NextResponse.json({ error: profileErr.message }, { status: 400 });
    }

    // Create chef application
    const { error: chefErr } = await supabaseAdmin.from("chefs").insert({
      profile_id: userId,
      bio,
      cuisine_types: cuisines,
      address,
      status: "pending",
    });

    if (chefErr) {
      return NextResponse.json({ error: chefErr.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, userId });
  } catch (error) {
    console.error("Chef signup error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
