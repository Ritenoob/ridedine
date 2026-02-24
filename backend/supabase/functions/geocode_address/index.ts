import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';

interface GeocodeRequest {
  address: string;
}

interface GeocodeResponse {
  lat: number;
  lng: number;
  formattedAddress: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const googleApiKey = Deno.env.get('GOOGLE_MAPS_API_KEY');
    if (!googleApiKey) {
      console.error('GOOGLE_MAPS_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'Geocoding service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { address }: GeocodeRequest = await req.json();

    if (!address || address.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: 'Address is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Call Google Geocoding API
    const url = new URL('https://maps.googleapis.com/maps/api/geocode/json');
    url.searchParams.set('address', address);
    url.searchParams.set('key', googleApiKey);

    const response = await fetch(url.toString());
    const data = await response.json();

    if (data.status !== 'OK') {
      console.error('Geocoding error:', data.status, data.error_message);
      return new Response(
        JSON.stringify({ error: `Geocoding failed: ${data.status}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!data.results || data.results.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No results found for address' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const result = data.results[0];
    const location = result.geometry.location;

    const response_data: GeocodeResponse = {
      lat: location.lat,
      lng: location.lng,
      formattedAddress: result.formatted_address,
    };

    return new Response(JSON.stringify(response_data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Error in geocode_address:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
