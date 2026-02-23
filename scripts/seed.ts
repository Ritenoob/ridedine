/**
 * RideNDine Demo Seed Script
 *
 * Populates a Supabase project with demo data for development and demos.
 * Requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables.
 *
 * Usage:
 *   npx tsx scripts/seed.ts
 *   # or via package script:
 *   pnpm seed
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("❌ Missing environment variables:");
  console.error("   SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL)");
  console.error("   SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// ── Demo Users ──────────────────────────────────────────────────
const DEMO_USERS = [
  { email: "customer@ridendine.demo", password: "demo1234", role: "customer", full_name: "Demo Customer" },
  { email: "chef@ridendine.demo", password: "demo1234", role: "chef", full_name: "Demo Chef" },
  { email: "driver@ridendine.demo", password: "demo1234", role: "driver", full_name: "Demo Driver" },
  { email: "admin@ridendine.demo", password: "demo1234", role: "admin", full_name: "Demo Admin" },
];

// ── Demo Restaurant / Chef ──────────────────────────────────────
const DEMO_CHEF = {
  business_name: "RideNDine Demo Kitchen",
  bio: "A demo kitchen showcasing the RideNDine platform with a variety of cuisines.",
  cuisine_types: ["American", "Mexican", "Italian"],
  status: "approved",
};

const DEMO_DISHES = [
  { name: "Classic Burger", description: "Juicy beef patty with fresh toppings", price_cents: 1299, cuisine_type: "American", is_available: true, is_featured: true },
  { name: "Street Tacos", description: "Three soft-shell tacos with cilantro and lime", price_cents: 999, cuisine_type: "Mexican", is_available: true, is_featured: true },
  { name: "Margherita Pizza", description: "Fresh mozzarella, basil, and tomato sauce", price_cents: 1499, cuisine_type: "Italian", is_available: true, is_featured: false },
  { name: "Caesar Salad", description: "Romaine lettuce, parmesan, croutons, house dressing", price_cents: 899, cuisine_type: "American", is_available: true, is_featured: false },
  { name: "Chicken Quesadilla", description: "Grilled chicken with melted cheese in a flour tortilla", price_cents: 1099, cuisine_type: "Mexican", is_available: true, is_featured: false },
];

// ── Seed Logic ──────────────────────────────────────────────────

async function seed() {
  console.log("🌱 Starting RideNDine seed...\n");

  // 1. Create demo auth users & profiles
  const userIds: Record<string, string> = {};
  for (const user of DEMO_USERS) {
    // Check if user already exists
    const { data: existing } = await supabase.auth.admin.listUsers();
    const found = existing?.users?.find((u) => u.email === user.email);
    if (found) {
      console.log(`  ✅ User ${user.email} already exists (${found.id})`);
      userIds[user.role] = found.id;
      // Ensure profile exists
      await supabase.from("profiles").upsert({
        id: found.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
      });
      continue;
    }

    const { data, error } = await supabase.auth.admin.createUser({
      email: user.email,
      password: user.password,
      email_confirm: true,
      user_metadata: { full_name: user.full_name, role: user.role },
    });
    if (error) {
      console.error(`  ❌ Failed to create user ${user.email}:`, error.message);
      continue;
    }
    userIds[user.role] = data.user.id;
    console.log(`  ✅ Created user ${user.email} (${data.user.id})`);

    // Create profile
    await supabase.from("profiles").upsert({
      id: data.user.id,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
    });
  }

  // 2. Create demo chef record
  if (userIds.chef) {
    const { data: chef, error } = await supabase
      .from("chefs")
      .upsert({
        profile_id: userIds.chef,
        business_name: DEMO_CHEF.business_name,
        bio: DEMO_CHEF.bio,
        cuisine_types: DEMO_CHEF.cuisine_types,
        status: DEMO_CHEF.status,
      }, { onConflict: "profile_id" })
      .select()
      .single();

    if (error) {
      console.error("  ❌ Failed to create chef:", error.message);
    } else {
      console.log(`  ✅ Created chef: ${DEMO_CHEF.business_name}`);

      // 3. Create demo dishes
      for (const dish of DEMO_DISHES) {
        const { error: dishErr } = await supabase.from("dishes").insert({
          chef_id: chef.id,
          ...dish,
        });
        if (dishErr && dishErr.code !== "23505") {
          console.error(`  ❌ Failed to create dish ${dish.name}:`, dishErr.message);
        } else {
          console.log(`  ✅ Created dish: ${dish.name} ($${(dish.price_cents / 100).toFixed(2)})`);
        }
      }
    }
  }

  // 4. Create demo driver record
  if (userIds.driver) {
    const { error } = await supabase.from("drivers").upsert({
      profile_id: userIds.driver,
      full_name: "Demo Driver",
      vehicle_type: "car",
      is_available: true,
      rating: 4.8,
      total_deliveries: 42,
    }, { onConflict: "profile_id" });
    if (error) {
      console.error("  ❌ Failed to create driver:", error.message);
    } else {
      console.log("  ✅ Created driver: Demo Driver");
    }
  }

  // 5. Create demo orders in various statuses
  if (userIds.customer && userIds.chef) {
    const { data: chefRecord } = await supabase
      .from("chefs")
      .select("id")
      .eq("profile_id", userIds.chef)
      .single();

    if (chefRecord) {
      const statuses = ["placed", "accepted", "preparing", "delivered"];
      for (const status of statuses) {
        const { data: order, error } = await supabase
          .from("orders")
          .insert({
            customer_id: userIds.customer,
            chef_id: chefRecord.id,
            status,
            total_cents: 2499,
            delivery_address: "123 Demo Street, Anytown, USA",
            customer_name: "Demo Customer",
            customer_email: "customer@ridendine.demo",
            payment_status: status === "delivered" ? "succeeded" : "pending",
          })
          .select()
          .single();

        if (error) {
          console.error(`  ❌ Failed to create ${status} order:`, error.message);
        } else {
          console.log(`  ✅ Created demo order: ${status} (${order?.tracking_token ?? order?.id})`);
        }
      }
    }
  }

  // 6. Seed default platform settings
  const { error: settingsErr } = await supabase
    .from("platform_settings")
    .upsert({ key: "commission_rate", value: "0.15" }, { onConflict: "key" });
  if (!settingsErr) {
    console.log("  ✅ Platform settings: commission_rate = 15%");
  }

  console.log("\n🎉 Seed complete! Demo credentials:");
  console.log("   Customer: customer@ridendine.demo / demo1234");
  console.log("   Chef:     chef@ridendine.demo / demo1234");
  console.log("   Driver:   driver@ridendine.demo / demo1234");
  console.log("   Admin:    admin@ridendine.demo / demo1234");
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
