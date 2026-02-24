import * as Location from 'expo-location';
import { DeliveriesRepository } from '@home-chef/data';

let locationSubscription: Location.LocationSubscription | null = null;
let currentDeliveryId: string | null = null;
let currentRepository: DeliveriesRepository | null = null;

/**
 * Request location permission from the user
 */
export async function requestLocationPermission(): Promise<boolean> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();

    if (status !== 'granted') {
      console.warn('Location permission denied');
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error requesting location permission:', error);
    return false;
  }
}

/**
 * Start tracking driver location for an active delivery
 * Updates location every 15 seconds
 */
export async function startLocationTracking(
  deliveryId: string,
  repository: DeliveriesRepository
): Promise<boolean> {
  // Stop any existing tracking first
  stopLocationTracking();

  // Request permission
  const hasPermission = await requestLocationPermission();
  if (!hasPermission) {
    return false;
  }

  try {
    currentDeliveryId = deliveryId;
    currentRepository = repository;

    // Start watching position
    locationSubscription = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        timeInterval: 15000, // Update every 15 seconds
        distanceInterval: 10, // Or when moved 10 meters
      },
      async (location) => {
        if (currentDeliveryId && currentRepository) {
          try {
            await currentRepository.updateDriverLocation(
              currentDeliveryId,
              location.coords.latitude,
              location.coords.longitude
            );
            console.log('Location updated:', location.coords.latitude, location.coords.longitude);
          } catch (error) {
            console.error('Error updating driver location:', error);
          }
        }
      }
    );

    console.log('Location tracking started for delivery:', deliveryId);
    return true;
  } catch (error) {
    console.error('Error starting location tracking:', error);
    return false;
  }
}

/**
 * Stop tracking driver location
 */
export function stopLocationTracking(): void {
  if (locationSubscription) {
    locationSubscription.remove();
    locationSubscription = null;
  }

  currentDeliveryId = null;
  currentRepository = null;

  console.log('Location tracking stopped');
}

/**
 * Get current location once (no tracking)
 */
export async function getCurrentLocation(): Promise<Location.LocationObject | null> {
  try {
    const hasPermission = await requestLocationPermission();
    if (!hasPermission) {
      return null;
    }

    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });

    return location;
  } catch (error) {
    console.error('Error getting current location:', error);
    return null;
  }
}

/**
 * Check if location tracking is currently active
 */
export function isTrackingActive(): boolean {
  return locationSubscription !== null && currentDeliveryId !== null;
}
