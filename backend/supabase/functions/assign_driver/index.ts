import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface AssignDriverRequest {
  delivery_id: string;
}

interface AssignDriverResponse {
  driver_id: string | null;
  score?: number;
  distance_km?: number;
  reason?: string;
}

interface NearbyDriver {
  driver_id: string;
  profile_id: string;
  distance_km: number;
  current_lat: number;
  current_lng: number;
}

interface DriverScore {
  driver_id: string;
  score: number;
}

export function scoreDriver(reliability: number, distance_km: number): number {
  return reliability - distance_km * 8;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { delivery_id }: AssignDriverRequest = await req.json();

    if (!delivery_id) {
      return new Response(
        JSON.stringify({ error: "delivery_id is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const { data: delivery, error: deliveryError } = await supabase
      .from("deliveries")
      .select("pickup_lat, pickup_lng, driver_id")
      .eq("id", delivery_id)
      .single();

    if (deliveryError || !delivery) {
      return new Response(JSON.stringify({ error: "Delivery not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (delivery.driver_id) {
      return new Response(
        JSON.stringify({ error: "Delivery already assigned" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    if (!delivery.pickup_lat || !delivery.pickup_lng) {
      return new Response(
        JSON.stringify({ error: "Delivery missing pickup coordinates" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const { data: nearbyDrivers, error: driversError } = await supabase.rpc(
      "find_nearby_drivers",
      {
        p_lat: delivery.pickup_lat,
        p_lng: delivery.pickup_lng,
        p_max_distance_km: 10.0,
        p_limit: 10,
      },
    );

    if (driversError) {
      console.error("Error finding nearby drivers:", driversError);
      return new Response(
        JSON.stringify({ error: "Failed to find nearby drivers" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    if (!nearbyDrivers || nearbyDrivers.length === 0) {
      return new Response(
        JSON.stringify({ driver_id: null, reason: "no_drivers_available" }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const { data: driverScores } = await supabase
      .from("driver_scores")
      .select("driver_id, score")
      .in(
        "driver_id",
        nearbyDrivers.map((d: NearbyDriver) => d.driver_id),
      );

    const scoreMap = new Map<string, number>();
    if (driverScores) {
      driverScores.forEach((ds: DriverScore) => {
        scoreMap.set(ds.driver_id, ds.score);
      });
    }

    let bestDriver: NearbyDriver | null = null;
    let bestScore = -Infinity;

    nearbyDrivers.forEach((driver: NearbyDriver) => {
      const reliability = scoreMap.get(driver.driver_id) ?? 50;
      const score = scoreDriver(reliability, driver.distance_km);

      if (score > bestScore) {
        bestScore = score;
        bestDriver = driver;
      }
    });

    if (!bestDriver) {
      return new Response(
        JSON.stringify({ driver_id: null, reason: "no_drivers_available" }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const { error: driverUpdateError } = await supabase.rpc(
      "assign_driver_atomic",
      {
        p_driver_id: bestDriver.driver_id,
        p_delivery_id: delivery_id,
      },
    );

    if (
      driverUpdateError?.message?.includes("function") ||
      driverUpdateError?.code === "42883"
    ) {
      const { error: updateError } = await supabase
        .from("drivers")
        .update({ is_available: false })
        .eq("id", bestDriver.driver_id);

      if (updateError) {
        console.error("Error updating driver availability:", updateError);
        return new Response(
          JSON.stringify({ error: "Failed to assign driver" }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }

      const { error: deliveryUpdateError } = await supabase
        .from("deliveries")
        .update({
          driver_id: bestDriver.driver_id,
          status: "assigned",
        })
        .eq("id", delivery_id);

      if (deliveryUpdateError) {
        console.error("Error updating delivery:", deliveryUpdateError);
        await supabase
          .from("drivers")
          .update({ is_available: true })
          .eq("id", bestDriver.driver_id);

        return new Response(
          JSON.stringify({ error: "Failed to update delivery" }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }
    } else if (driverUpdateError) {
      console.error("Error in atomic assignment:", driverUpdateError);
      return new Response(
        JSON.stringify({ error: "Failed to assign driver" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const response: AssignDriverResponse = {
      driver_id: bestDriver.driver_id,
      score: bestScore,
      distance_km: bestDriver.distance_km,
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Error in assign_driver:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
