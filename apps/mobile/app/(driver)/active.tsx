import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { DeliveriesRepository } from '@home-chef/data';
import { DeliveryStatus } from '@home-chef/shared';
import { startLocationTracking, stopLocationTracking } from '@/lib/location';
import MapView, { Marker } from 'react-native-maps';

const STATUS_STEPS = [
  { key: DeliveryStatus.ASSIGNED, label: 'Assigned' },
  { key: DeliveryStatus.EN_ROUTE_TO_PICKUP, label: 'En Route to Pickup' },
  { key: DeliveryStatus.ARRIVED_AT_PICKUP, label: 'Arrived at Pickup' },
  { key: DeliveryStatus.PICKED_UP, label: 'Picked Up' },
  { key: DeliveryStatus.EN_ROUTE_TO_DROPOFF, label: 'En Route to Dropoff' },
  { key: DeliveryStatus.ARRIVED_AT_DROPOFF, label: 'Arrived at Dropoff' },
  { key: DeliveryStatus.DELIVERED, label: 'Delivered' },
];

type DeliveryOrder = {
  id: string;
  order_id: string;
  status: DeliveryStatus;
  pickup_address?: string | null;
  dropoff_address?: string | null;
  pickup_lat?: number | null;
  pickup_lng?: number | null;
  dropoff_lat?: number | null;
  dropoff_lng?: number | null;
  delivery_fee_cents?: number | null;
  order?: { customer_name?: string | null; total_cents?: number | null } | null;
};

export default function DriverActive() {
  const [delivery, setDelivery] = useState<DeliveryOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [showProofUpload, setShowProofUpload] = useState(false);
  const [driverId, setDriverId] = useState<string | null>(null);

  useEffect(() => {
    loadActiveDelivery();
  }, []);

  useEffect(() => {
    // Start location tracking when en route
    if (delivery && driverId && [
      DeliveryStatus.EN_ROUTE_TO_PICKUP,
      DeliveryStatus.PICKED_UP,
      DeliveryStatus.EN_ROUTE_TO_DROPOFF,
    ].includes(delivery.status)) {
      const repository = new DeliveriesRepository(supabase);
      startLocationTracking(delivery.id, repository);
    } else {
      stopLocationTracking();
    }

    return () => {
      stopLocationTracking();
    };
  }, [delivery?.status, delivery?.id, driverId]);

  const loadActiveDelivery = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Get driver profile
      const { data: driver } = await supabase
        .from('drivers')
        .select('id')
        .eq('profile_id', user.id)
        .single();

      if (!driver) {
        setLoading(false);
        return;
      }

      setDriverId(driver.id);

      // Get active delivery
      const repository = new DeliveriesRepository(supabase);
      const activeDelivery = await repository.getActiveDelivery(driver.id);

      if (activeDelivery) {
        // Fetch related order details
        const { data: orderData } = await supabase
          .from('orders')
          .select('customer_name, total_cents')
          .eq('id', activeDelivery.order_id)
          .single();

        setDelivery({ ...activeDelivery, order: orderData });
      }
    } catch (error) {
      console.error('Error loading active delivery:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (newStatus: DeliveryStatus) => {
    if (!delivery) return;

    try {
      setUpdating(true);
      const repository = new DeliveriesRepository(supabase);
      await repository.updateDeliveryStatus(delivery.id, newStatus);

      // If delivered, show proof upload
      if (newStatus === DeliveryStatus.DELIVERED) {
        setShowProofUpload(true);
      } else {
        setDelivery({ ...delivery, status: newStatus });
      }
    } catch (error: unknown) {
      console.error('Error updating status:', error);
      const message = error instanceof Error ? error.message : 'Failed to update status';
      Alert.alert('Error', message);
    } finally {
      setUpdating(false);
    }
  };

  const getNextStatus = (): DeliveryStatus | null => {
    if (!delivery) return null;
    const currentIndex = STATUS_STEPS.findIndex(s => s.key === delivery.status);
    if (currentIndex < STATUS_STEPS.length - 1) {
      return STATUS_STEPS[currentIndex + 1].key;
    }
    return null;
  };

  const getCurrentStepIndex = () => {
    if (!delivery) return -1;
    return STATUS_STEPS.findIndex(s => s.key === delivery.status);
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#FF7A00" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (!delivery) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.emptyText}>No active delivery</Text>
        <Text style={styles.emptySubtext}>
          Accept a job from the Jobs tab to start
        </Text>
      </View>
    );
  }

  if (showProofUpload) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Upload Delivery Proof</Text>
        <Text style={styles.subtitle}>
          Take a photo to confirm delivery completion
        </Text>
        <View style={styles.uploadPlaceholder}>
          <Text style={styles.uploadPlaceholderTitle}>Proof upload unavailable</Text>
          <Text style={styles.uploadPlaceholderText}>
            Image upload component is not configured for mobile.
          </Text>
        </View>
      </View>
    );
  }

  const nextStatus = getNextStatus();
  const currentStepIndex = getCurrentStepIndex();

  // Show map when we have location data
  const showMap =
    delivery.pickup_lat != null &&
    delivery.pickup_lng != null &&
    delivery.dropoff_lat != null &&
    delivery.dropoff_lng != null;

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Active Delivery</Text>

      {/* Map View - shown when we have location data */}
      {showMap && (
        <View style={styles.mapContainer}>
          <MapView
            style={styles.map}
            initialRegion={{
              latitude: delivery.pickup_lat ?? 0,
              longitude: delivery.pickup_lng ?? 0,
              latitudeDelta: 0.05,
              longitudeDelta: 0.05,
            }}
          >
            {/* Pickup location */}
            <Marker
              coordinate={{
                  latitude: delivery.pickup_lat ?? 0,
                  longitude: delivery.pickup_lng ?? 0,
                }}
                title="Pickup"
                description={delivery.pickup_address ?? undefined}
              pinColor="green"
            />

            {/* Dropoff location */}
            <Marker
              coordinate={{
                  latitude: delivery.dropoff_lat ?? 0,
                  longitude: delivery.dropoff_lng ?? 0,
                }}
                title="Dropoff"
                description={delivery.dropoff_address ?? undefined}
              pinColor="red"
            />
          </MapView>
        </View>
      )}

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Delivery Details</Text>

        <Text style={styles.label}>Pickup</Text>
        <Text style={styles.address}>{delivery.pickup_address}</Text>

        <Text style={[styles.label, { marginTop: 15 }]}>Dropoff</Text>
        <Text style={styles.address}>{delivery.dropoff_address}</Text>

        {delivery.order && (
          <>
            <Text style={[styles.label, { marginTop: 15 }]}>Customer</Text>
            <Text style={styles.value}>{delivery.order.customer_name}</Text>

            <Text style={[styles.label, { marginTop: 10 }]}>Order Total</Text>
            <Text style={styles.value}>
              ${((delivery.order.total_cents ?? 0) / 100).toFixed(2)}
            </Text>
          </>
        )}

        <Text style={[styles.label, { marginTop: 15 }]}>Delivery Fee</Text>
        <Text style={[styles.value, { color: '#FF7A00', fontWeight: 'bold' }]}>
          ${((delivery.delivery_fee_cents ?? 0) / 100).toFixed(2)}
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Delivery Progress</Text>
        {STATUS_STEPS.map((step, index) => (
          <View key={step.key} style={styles.statusItem}>
            <View style={[
              styles.statusDot,
              index <= currentStepIndex && styles.statusDotActive
            ]} />
            <Text style={[
              styles.statusLabel,
              index <= currentStepIndex && styles.statusLabelActive
            ]}>
              {step.label}
            </Text>
            {index === currentStepIndex && (
              <Text style={styles.currentBadge}>Current</Text>
            )}
          </View>
        ))}
      </View>

      {nextStatus && (
        <TouchableOpacity
          style={[styles.nextButton, updating && styles.nextButtonDisabled]}
          onPress={() => updateStatus(nextStatus)}
          disabled={updating}
        >
          <Text style={styles.nextButtonText}>
            {updating ? 'Updating...' : `Mark as ${STATUS_STEPS.find(s => s.key === nextStatus)?.label}`}
          </Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    padding: 20,
    paddingBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  mapContainer: {
    marginHorizontal: 20,
    marginBottom: 10,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  map: {
    width: '100%',
    height: 250,
  },
  card: {
    margin: 20,
    marginTop: 10,
    padding: 15,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  label: {
    fontSize: 12,
    color: '#666',
    marginBottom: 5,
  },
  address: {
    fontSize: 16,
    color: '#333',
  },
  value: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  statusDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#ddd',
    marginRight: 10,
  },
  statusDotActive: {
    backgroundColor: '#FF7A00',
  },
  statusLabel: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  statusLabelActive: {
    color: '#000',
    fontWeight: '600',
  },
  currentBadge: {
    fontSize: 12,
    color: '#FF7A00',
    fontWeight: '600',
  },
  nextButton: {
    margin: 20,
    marginTop: 10,
    backgroundColor: '#FF7A00',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  nextButtonDisabled: {
    backgroundColor: '#ccc',
  },
  nextButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  uploadPlaceholder: {
    padding: 16,
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
  },
  uploadPlaceholderTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 6,
  },
  uploadPlaceholderText: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
});
