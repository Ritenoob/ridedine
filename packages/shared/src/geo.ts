/**
 * Geographic utilities for distance calculation and coordinate validation.
 * Uses Haversine formula for accurate distance calculation on a sphere.
 */

/**
 * Calculate distance between two geographic coordinates using Haversine formula.
 *
 * @param lat1 - Latitude of first point (degrees)
 * @param lng1 - Longitude of first point (degrees)
 * @param lat2 - Latitude of second point (degrees)
 * @param lng2 - Longitude of second point (degrees)
 * @returns Distance in kilometers
 */
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  // Earth's radius in kilometers
  const R = 6371;

  // Convert degrees to radians
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  const lat1Rad = toRadians(lat1);
  const lat2Rad = toRadians(lat2);

  // Haversine formula
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1Rad) * Math.cos(lat2Rad) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Convert degrees to radians.
 *
 * @param degrees - Angle in degrees
 * @returns Angle in radians
 */
function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Format distance for display.
 * Under 1km displays in meters, 1km and above displays in km.
 *
 * @param distanceKm - Distance in kilometers
 * @returns Formatted distance string
 */
export function formatDistance(distanceKm: number): string {
  if (distanceKm < 1) {
    const meters = Math.round(distanceKm * 1000);
    return `${meters} m`;
  }

  return `${distanceKm.toFixed(1)} km`;
}

/**
 * Validate geographic coordinates.
 *
 * @param lat - Latitude (must be between -90 and 90)
 * @param lng - Longitude (must be between -180 and 180)
 * @returns true if coordinates are valid
 */
export function isValidCoordinate(lat: number, lng: number): boolean {
  if (typeof lat !== 'number' || typeof lng !== 'number') {
    return false;
  }

  if (isNaN(lat) || isNaN(lng)) {
    return false;
  }

  if (lat < -90 || lat > 90) {
    return false;
  }

  if (lng < -180 || lng > 180) {
    return false;
  }

  return true;
}

/**
 * Types for geocoding results.
 */
export interface GeocodeResult {
  lat: number;
  lng: number;
  formattedAddress: string;
}

/**
 * Types for route information.
 */
export interface RouteInfo {
  distanceKm: number;
  durationMinutes: number;
  polyline?: string; // Encoded polyline for map rendering
}
