import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": Deno.env.get("ALLOWED_ORIGIN") || "http://localhost:3000",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface GeocodeResult {
  address: string;
  place_id: string;
  lat: number;
  lng: number;
}

interface GoogleGeocodeResponse {
  status: string;
  results: Array<{
    place_id: string;
    geometry: {
      location: {
        lat: number;
        lng: number;
      };
    };
  }>;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Validate HTTP method
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { address } = await req.json();

    if (!address || typeof address !== "string") {
      return new Response(
        JSON.stringify({ error: "Address is required and must be a string" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Normalize address for consistent caching (trim, lowercase)
    const normalizedAddress = address.trim().toLowerCase();

    // 1. Check cache first (30-day TTL)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const { data: cached, error: cacheError } = await supabase
      .from("geocode_cache")
      .select("*")
      .eq("address", normalizedAddress)
      .gte("created_at", thirtyDaysAgo)
      .single();

    if (cached && !cacheError) {
      console.log(`Cache HIT for address: ${normalizedAddress}`);

      // Update cached_at timestamp for LRU tracking (optional)
      await supabase
        .from("geocode_cache")
        .update({ cached_at: new Date().toISOString() })
        .eq("id", cached.id);

      return new Response(
        JSON.stringify({
          address: normalizedAddress,
          place_id: cached.place_id,
          lat: cached.lat,
          lng: cached.lng,
          cached: true,
        } as GeocodeResult & { cached: boolean }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log(`Cache MISS for address: ${normalizedAddress}`);

    // 2. Cache miss - call Google Geocoding API
    const apiKey = Deno.env.get("GOOGLE_MAPS_API_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "Google Maps API key not configured" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`;

    // Add 10-second timeout
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    let response;
    try {
      response = await fetch(url, { signal: controller.signal });
    } finally {
      clearTimeout(timeout);
    }

    const data = (await response.json()) as GoogleGeocodeResponse;

    if (data.status !== "OK" || !data.results[0]) {
      console.error(`Geocoding failed: ${data.status}`);
      return new Response(
        JSON.stringify({
          error: "Geocoding failed",
          details: data.status,
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const result = data.results[0];
    const { lat, lng } = result.geometry.location;
    const place_id = result.place_id;

    // 3. Store in cache
    const { error: insertError } = await supabase.from("geocode_cache").insert({
      address: normalizedAddress,
      place_id,
      lat,
      lng,
    });

    if (insertError) {
      console.error("Failed to cache geocode result:", insertError);
      // Continue anyway - we have the result
    }

    return new Response(
      JSON.stringify({
        address: normalizedAddress,
        place_id,
        lat,
        lng,
        cached: false,
      } as GeocodeResult & { cached: boolean }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: unknown) {
    console.error("Error in geocode_address:", error);
    const message = error instanceof Error ? error.message : "Unknown error occurred";
    return new Response(
      JSON.stringify({ error: "Internal server error", details: message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
