import * as Location from 'expo-location';
import { DeliveriesRepository } from '@home-chef/data';
import { supabase } from './supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

let locationSubscription: Location.LocationSubscription | null = null;
let currentDeliveryId: string | null = null;
let currentRepository: DeliveriesRepository | null = null;
let broadcastChannel: RealtimeChannel | null = null;

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
  stopLocationTracking();

  const hasPermission = await requestLocationPermission();
  if (!hasPermission) {
    return false;
  }

  try {
    currentDeliveryId = deliveryId;
    currentRepository = repository;

    broadcastChannel = supabase.channel(`delivery:${deliveryId}`);

    broadcastChannel.on('system', {}, (payload: any) => {
      if (payload.event === 'error') {
        console.warn('Broadcast channel error, reconnecting in 5s...', payload);
        setTimeout(() => {
          if (broadcastChannel) {
            broadcastChannel.subscribe();
          }
        }, 5000);
      }
    });

    await broadcastChannel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log('Broadcast channel ready for delivery:', deliveryId);
      }
    });

    locationSubscription = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        timeInterval: 15000,
        distanceInterval: 10,
      },
      async (location) => {
        if (currentDeliveryId && currentRepository) {
          try {
            await currentRepository.updateDriverLocation(
              currentDeliveryId,
              location.coords.latitude,
              location.coords.longitude
            );

            if (broadcastChannel) {
              await broadcastChannel.send({
                type: 'broadcast',
                event: 'driver_location',
                payload: {
                  lat: location.coords.latitude,
                  lng: location.coords.longitude,
                  heading: location.coords.heading,
                  speed: location.coords.speed,
                  timestamp: new Date().toISOString(),
                },
              });
            }

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

  if (broadcastChannel) {
    broadcastChannel.unsubscribe();
    broadcastChannel = null;
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
