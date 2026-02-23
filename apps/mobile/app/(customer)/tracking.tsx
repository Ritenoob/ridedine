import { View, Text, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import { useEffect, useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { supabase } from '../../lib/supabase';
import MapView, { Marker } from 'react-native-maps';

const STATUS_STEPS = [
  { key: 'placed', label: 'Order Placed' },
  { key: 'accepted', label: 'Accepted by Chef' },
  { key: 'preparing', label: 'Preparing' },
  { key: 'ready', label: 'Ready for Pickup' },
  { key: 'picked_up', label: 'Picked Up' },
  { key: 'delivered', label: 'Delivered' },
];

interface Delivery {
  id: string;
  driver_lat: number | null;
  driver_lng: number | null;
  pickup_lat: number | null;
  pickup_lng: number | null;
  dropoff_lat: number | null;
  dropoff_lng: number | null;
  pickup_address: string;
  dropoff_address: string;
}

export default function Tracking() {
  const { trackingToken } = useLocalSearchParams();
  const [order, setOrder] = useState<any>(null);
  const [delivery, setDelivery] = useState<Delivery | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!trackingToken) return;

    // Initial load
    loadOrder();

    // Set up real-time subscription
    const orderChannel = supabase
      .channel(`order-tracking-${trackingToken}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `tracking_token=eq.${trackingToken}`,
        },
        async (payload) => {
          setOrder(payload.new);

          // Fetch delivery when order transitions to picked_up
          if (payload.new.status === 'picked_up' || payload.new.status === 'delivered') {
            loadDelivery(payload.new.id);
          }
        }
      )
      .subscribe();

    // Subscribe to delivery location updates
    const deliveryChannel = supabase
      .channel(`delivery-location-${trackingToken}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'deliveries',
        },
        (payload) => {
          if (delivery && payload.new.id === delivery.id) {
            setDelivery((prev) => (prev ? { ...prev, ...payload.new } : null));
          }
        }
      )
      .subscribe();

    // Cleanup subscriptions on unmount
    return () => {
      supabase.removeChannel(orderChannel);
      supabase.removeChannel(deliveryChannel);
    };
  }, [trackingToken, delivery?.id]);

  const loadOrder = async () => {
    try {
      const { data, error: queryError } = await supabase
        .from('orders')
        .select(`
          *,
          chefs!inner (
            profiles!inner (
              name
            )
          )
        `)
        .eq('tracking_token', trackingToken)
        .single();

      if (queryError) throw queryError;
      setOrder(data);

      // Fetch delivery if order is picked_up or delivered
      if (data && (data.status === 'picked_up' || data.status === 'delivered')) {
        await loadDelivery(data.id);
      }

      setError('');
    } catch (err) {
      console.error('Error loading order:', err);
      setError('Order not found');
    } finally {
      setLoading(false);
    }
  };

  const loadDelivery = async (orderId: string) => {
    try {
      const { data: deliveryData } = await supabase
        .from('deliveries')
        .select('*')
        .eq('order_id', orderId)
        .single();

      if (deliveryData) {
        setDelivery(deliveryData);
      }
    } catch (err) {
      console.error('Error loading delivery:', err);
    }
  };

  const getCurrentStepIndex = () => {
    if (!order) return -1;
    return STATUS_STEPS.findIndex(step => step.key === order.status);
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#FF7A00" />
        <Text style={styles.loadingText}>Loading order...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  const currentStepIndex = getCurrentStepIndex();

  // Show map when delivery is in progress and we have location data
  const showMap =
    delivery &&
    delivery.pickup_lat &&
    delivery.pickup_lng &&
    delivery.dropoff_lat &&
    delivery.dropoff_lng;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Order Tracking</Text>
        <Text style={styles.trackingToken}>Token: {trackingToken}</Text>
      </View>

      {/* Map View - shown when delivery is in progress */}
      {showMap && (
        <View style={styles.mapContainer}>
          <MapView
            style={styles.map}
            initialRegion={{
              latitude: delivery.driver_lat || delivery.pickup_lat!,
              longitude: delivery.driver_lng || delivery.pickup_lng!,
              latitudeDelta: 0.05,
              longitudeDelta: 0.05,
            }}
          >
            {/* Pickup location */}
            <Marker
              coordinate={{
                latitude: delivery.pickup_lat!,
                longitude: delivery.pickup_lng!,
              }}
              title="Pickup"
              description={delivery.pickup_address}
              pinColor="green"
            />

            {/* Driver location */}
            {delivery.driver_lat && delivery.driver_lng && (
              <Marker
                coordinate={{
                  latitude: delivery.driver_lat,
                  longitude: delivery.driver_lng,
                }}
                title="Driver"
                description="Current location"
                pinColor="blue"
              >
                <Text style={{ fontSize: 24 }}>🚗</Text>
              </Marker>
            )}

            {/* Dropoff location */}
            <Marker
              coordinate={{
                latitude: delivery.dropoff_lat!,
                longitude: delivery.dropoff_lng!,
              }}
              title="Dropoff"
              description={delivery.dropoff_address}
              pinColor="red"
            />
          </MapView>
          <View style={styles.mapInfo}>
            <Text style={styles.mapInfoText}>
              <Text style={{ fontWeight: 'bold' }}>Pickup:</Text> {delivery.pickup_address}
            </Text>
            <Text style={styles.mapInfoText}>
              <Text style={{ fontWeight: 'bold' }}>Dropoff:</Text> {delivery.dropoff_address}
            </Text>
          </View>
        </View>
      )}

      {order && (
        <>
          <View style={styles.infoCard}>
            <Text style={styles.label}>Customer</Text>
            <Text style={styles.value}>{order.customer_name}</Text>

            <Text style={styles.label}>Chef</Text>
            <Text style={styles.value}>{order.chefs?.profiles?.name}</Text>

            <Text style={styles.label}>Total</Text>
            <Text style={styles.value}>${(order.total_cents / 100).toFixed(2)}</Text>

            <Text style={styles.label}>Delivery Method</Text>
            <Text style={styles.value}>{order.delivery_method}</Text>
          </View>

          <View style={styles.timeline}>
            <Text style={styles.timelineTitle}>Order Status</Text>
            {STATUS_STEPS.map((step, index) => (
              <View key={step.key} style={styles.timelineItem}>
                <View
                  style={[
                    styles.timelineDot,
                    index <= currentStepIndex && styles.timelineDotActive,
                  ]}
                />
                <View style={styles.timelineContent}>
                  <Text
                    style={[
                      styles.timelineLabel,
                      index <= currentStepIndex && styles.timelineLabelActive,
                    ]}
                  >
                    {step.label}
                  </Text>
                  {index === currentStepIndex && (
                    <Text style={styles.currentLabel}>Current</Text>
                  )}
                </View>
                {index < STATUS_STEPS.length - 1 && (
                  <View
                    style={[
                      styles.timelineLine,
                      index < currentStepIndex && styles.timelineLineActive,
                    ]}
                  />
                )}
              </View>
            ))}
          </View>
        </>
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
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    fontSize: 16,
    color: '#d32f2f',
  },
  header: {
    padding: 20,
    backgroundColor: '#FF7A00',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
  },
  trackingToken: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
  },
  mapContainer: {
    marginHorizontal: 20,
    marginVertical: 10,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  map: {
    width: '100%',
    height: 300,
  },
  mapInfo: {
    padding: 12,
    backgroundColor: '#f9f9f9',
    borderTopWidth: 1,
    borderTopColor: '#ddd',
  },
  mapInfoText: {
    fontSize: 14,
    marginBottom: 4,
  },
  infoCard: {
    margin: 20,
    padding: 15,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  label: {
    fontSize: 12,
    color: '#666',
    marginTop: 10,
    marginBottom: 2,
  },
  value: {
    fontSize: 16,
    fontWeight: '600',
  },
  timeline: {
    margin: 20,
  },
  timelineTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  timelineItem: {
    position: 'relative',
    marginBottom: 30,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  timelineDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#ddd',
    marginRight: 15,
  },
  timelineDotActive: {
    backgroundColor: '#FF7A00',
  },
  timelineLine: {
    position: 'absolute',
    left: 9,
    top: 20,
    width: 2,
    height: 40,
    backgroundColor: '#ddd',
  },
  timelineLineActive: {
    backgroundColor: '#FF7A00',
  },
  timelineContent: {
    flex: 1,
  },
  timelineLabel: {
    fontSize: 16,
    color: '#666',
  },
  timelineLabelActive: {
    color: '#000',
    fontWeight: '600',
  },
  currentLabel: {
    fontSize: 12,
    color: '#FF7A00',
    marginTop: 4,
    fontWeight: '600',
  },
});
