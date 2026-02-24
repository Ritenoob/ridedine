import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface Coordinate {
  lat: number;
  lng: number;
}

interface GetRouteRequest {
  coordinates: Coordinate[];
  provider?: "google" | "osrm" | "mapbox";
  profile?: string;
}

interface RouteResponse {
  provider: string;
  distanceMeters: number;
  durationSeconds: number;
  geometry: number[][];
}

export function decodePolyline(encoded: string): number[][] {
  if (!encoded || encoded.length === 0) return [];

  let index = 0;
  let lat = 0;
  let lng = 0;
  const coordinates: number[][] = [];

  while (index < encoded.length) {
    let result = 0;
    let shift = 0;
    let byte: number;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    const deltaLat = result & 1 ? ~(result >> 1) : result >> 1;
    lat += deltaLat;

    result = 0;
    shift = 0;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    const deltaLng = result & 1 ? ~(result >> 1) : result >> 1;
    lng += deltaLng;

    coordinates.push([lat / 1e5, lng / 1e5]);
  }

  return coordinates;
}

async function routeWithGoogle(coords: Coordinate[]): Promise<RouteResponse> {
  const key = Deno.env.get("GOOGLE_MAPS_API_KEY");
  if (!key) throw new Error("GOOGLE_MAPS_API_KEY not set");
  if (coords.length < 2) throw new Error("Google: need at least 2 coordinates");

  const origin = coords[0];
  const destination = coords[coords.length - 1];
  const intermediates = coords.slice(1, -1).map((c) => ({
    location: { latLng: { latitude: c.lat, longitude: c.lng } },
  }));

  const body = JSON.stringify({
    origin: {
      location: { latLng: { latitude: origin.lat, longitude: origin.lng } },
    },
    destination: {
      location: {
        latLng: { latitude: destination.lat, longitude: destination.lng },
      },
    },
    intermediates,
    travelMode: "DRIVE",
    routingPreference: "TRAFFIC_AWARE",
    polylineQuality: "HIGH_QUALITY",
  });

  const response = await fetch(
    "https://routes.googleapis.com/directions/v2:computeRoutes",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": key,
        "X-Goog-FieldMask":
          "routes.distanceMeters,routes.duration,routes.polyline.encodedPolyline",
      },
      body,
    },
  );

  if (!response.ok) {
    const errorText = await response.text();
    const error: any = new Error(`Google Maps API error: ${response.status}`);
    error.status = response.status;
    error.body = errorText;
    throw error;
  }

  const json = await response.json();
  const route = json.routes && json.routes[0];
  if (!route || !route.polyline) throw new Error("Google: no routes");

  const decoded = decodePolyline(route.polyline.encodedPolyline);
  return {
    provider: "google",
    distanceMeters: route.distanceMeters,
    durationSeconds: route.duration
      ? parseInt(route.duration.replace("s", ""), 10)
      : 0,
    geometry: decoded,
  };
}

async function routeWithOsrm(
  coords: Coordinate[],
  profile: string = "driving",
): Promise<RouteResponse> {
  const base =
    Deno.env.get("OSRM_BASE_URL") || "https://router.project-osrm.org";
  const coordString = coords.map((c) => `${c.lng},${c.lat}`).join(";");
  const url = `${base}/route/v1/${profile}/${coordString}?geometries=geojson&overview=full`;

  const response = await fetch(url);
  if (!response.ok) {
    const error: any = new Error(`OSRM API error: ${response.status}`);
    error.status = response.status;
    throw error;
  }

  const json = await response.json();
  const route = json.routes && json.routes[0];
  if (!route) throw new Error("OSRM: no routes");

  return {
    provider: "osrm",
    distanceMeters: route.distance,
    durationSeconds: route.duration,
    geometry: route.geometry.coordinates.map((c: number[]) => [c[1], c[0]]),
  };
}

async function routeWithMapbox(
  coords: Coordinate[],
  profile: string = "driving",
): Promise<RouteResponse> {
  const token = Deno.env.get("MAPBOX_TOKEN");
  if (!token) throw new Error("MAPBOX_TOKEN not set");

  const coordString = coords.map((c) => `${c.lng},${c.lat}`).join(";");
  const url =
    `https://api.mapbox.com/directions/v5/mapbox/${profile}/${coordString}` +
    `?geometries=geojson&overview=full&access_token=${token}`;

  const response = await fetch(url);
  if (!response.ok) {
    const error: any = new Error(`Mapbox API error: ${response.status}`);
    error.status = response.status;
    throw error;
  }

  const json = await response.json();
  const route = json.routes && json.routes[0];
  if (!route) throw new Error("Mapbox: no routes");

  return {
    provider: "mapbox",
    distanceMeters: route.distance,
    durationSeconds: route.duration,
    geometry: route.geometry.coordinates.map((c: number[]) => [c[1], c[0]]),
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { coordinates, provider, profile }: GetRouteRequest =
      await req.json();

    if (!coordinates || !Array.isArray(coordinates) || coordinates.length < 2) {
      return new Response(
        JSON.stringify({ error: "At least 2 coordinates are required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const routeProfile = profile || "driving";
    let route: RouteResponse | null = null;
    let lastError: any = null;

    if (!provider || provider === "google") {
      try {
        route = await routeWithGoogle(coordinates);
        console.log("Route calculated with Google Maps");
      } catch (err: any) {
        lastError = err;
        if (err.status === 429 || err.status === 403) {
          console.warn(
            `Google Maps ${err.status} error, falling back to OSRM:`,
            err.message,
          );
          try {
            route = await routeWithOsrm(coordinates, routeProfile);
            console.log("Route calculated with OSRM (Google fallback)");
          } catch (osrmErr: any) {
            lastError = osrmErr;
            console.warn("OSRM also failed, trying Mapbox:", osrmErr.message);
            const mapboxToken = Deno.env.get("MAPBOX_TOKEN");
            if (mapboxToken) {
              try {
                route = await routeWithMapbox(coordinates, routeProfile);
                console.log("Route calculated with Mapbox (OSRM fallback)");
              } catch (mapboxErr: any) {
                lastError = mapboxErr;
                console.error("All providers failed:", mapboxErr.message);
              }
            }
          }
        } else {
          console.error("Google Maps error (not quota/auth):", err.message);
        }
      }
    } else if (provider === "osrm") {
      route = await routeWithOsrm(coordinates, routeProfile);
      console.log("Route calculated with OSRM (explicit)");
    } else if (provider === "mapbox") {
      route = await routeWithMapbox(coordinates, routeProfile);
      console.log("Route calculated with Mapbox (explicit)");
    }

    if (!route) {
      return new Response(
        JSON.stringify({
          error:
            lastError?.message || "Failed to calculate route with any provider",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    return new Response(JSON.stringify(route), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Error in get_route:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
