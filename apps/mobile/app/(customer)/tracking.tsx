import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { useEffect, useState, useRef } from "react";
import { useLocalSearchParams } from "expo-router";
import { supabase } from "../../lib/supabase";
import type { RealtimeChannel } from "@supabase/supabase-js";

const STATUS_STEPS = [
  { key: "placed", label: "Order Placed" },
  { key: "accepted", label: "Accepted by Chef" },
  { key: "preparing", label: "Preparing" },
  { key: "ready", label: "Ready for Pickup" },
  { key: "picked_up", label: "Picked Up" },
  { key: "delivered", label: "Delivered" },
];

export default function Tracking() {
  const { trackingToken } = useLocalSearchParams();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [driverLocation, setDriverLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const broadcastChannel = useRef<RealtimeChannel | null>(null);
  const lastBroadcastUpdate = useRef<number>(Date.now());

  useEffect(() => {
    if (trackingToken) {
      loadOrder();
      const interval = setInterval(loadOrder, 10000);
      return () => clearInterval(interval);
    }
  }, [trackingToken]);

  useEffect(() => {
    if (!order?.deliveries?.[0]?.id) return;

    const deliveryId = order.deliveries[0].id;
    broadcastChannel.current = supabase.channel(`delivery:${deliveryId}`);

    broadcastChannel.current.on(
      "broadcast",
      { event: "driver_location" },
      (payload: any) => {
        lastBroadcastUpdate.current = Date.now();
        setDriverLocation({
          lat: payload.payload.lat,
          lng: payload.payload.lng,
        });
      },
    );

    broadcastChannel.current.on("system", {}, (payload: any) => {
      if (payload.event === "error") {
        setTimeout(() => broadcastChannel.current?.subscribe(), 5000);
      }
    });

    broadcastChannel.current.subscribe();

    const fallback = setInterval(() => {
      if (Date.now() - lastBroadcastUpdate.current > 60000) loadOrder();
    }, 10000);

    return () => {
      broadcastChannel.current?.unsubscribe();
      clearInterval(fallback);
    };
  }, [order?.deliveries?.[0]?.id]);

  const loadOrder = async () => {
    try {
      const { data, error: queryError } = await supabase
        .from("orders")
        .select(
          `
          *,
          chefs!inner (
            profiles!inner (
              name
            )
          )
        `,
        )
        .eq("tracking_token", trackingToken)
        .single();

      if (queryError) throw queryError;
      setOrder(data);
      setError("");
    } catch (err) {
      console.error("Error loading order:", err);
      setError("Order not found");
    } finally {
      setLoading(false);
    }
  };

  const getCurrentStepIndex = () => {
    if (!order) return -1;
    return STATUS_STEPS.findIndex((step) => step.key === order.status);
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#1976d2" />
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

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Order Tracking</Text>
        <Text style={styles.trackingToken}>Token: {trackingToken}</Text>
      </View>

      {order && (
        <>
          <View style={styles.infoCard}>
            <Text style={styles.label}>Customer</Text>
            <Text style={styles.value}>{order.customer_name}</Text>

            <Text style={styles.label}>Chef</Text>
            <Text style={styles.value}>{order.chefs?.profiles?.name}</Text>

            <Text style={styles.label}>Total</Text>
            <Text style={styles.value}>
              ${(order.total_cents / 100).toFixed(2)}
            </Text>

            <Text style={styles.label}>Delivery Method</Text>
            <Text style={styles.value}>{order.delivery_method}</Text>
          </View>

          {driverLocation && (
            <View style={styles.driverLocationCard}>
              <Text style={styles.driverLocationTitle}>Driver Location</Text>
              <Text style={styles.driverLocationCoords}>
                {driverLocation.lat.toFixed(4)}, {driverLocation.lng.toFixed(4)}
              </Text>
              <Text style={styles.driverLocationLive}>
                Live tracking active
              </Text>
            </View>
          )}

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
    backgroundColor: "#fff",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
  },
  errorText: {
    fontSize: 16,
    color: "#d32f2f",
  },
  header: {
    padding: 20,
    backgroundColor: "#1976d2",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
    marginBottom: 5,
  },
  trackingToken: {
    fontSize: 14,
    color: "rgba(255,255,255,0.9)",
  },
  infoCard: {
    margin: 20,
    padding: 15,
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
  },
  label: {
    fontSize: 12,
    color: "#666",
    marginTop: 10,
    marginBottom: 2,
  },
  value: {
    fontSize: 16,
    fontWeight: "600",
  },
  timeline: {
    margin: 20,
  },
  timelineTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 20,
  },
  timelineItem: {
    position: "relative",
    marginBottom: 30,
    flexDirection: "row",
    alignItems: "flex-start",
  },
  timelineDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#ddd",
    marginRight: 15,
  },
  timelineDotActive: {
    backgroundColor: "#1976d2",
  },
  timelineLine: {
    position: "absolute",
    left: 9,
    top: 20,
    width: 2,
    height: 40,
    backgroundColor: "#ddd",
  },
  timelineLineActive: {
    backgroundColor: "#1976d2",
  },
  timelineContent: {
    flex: 1,
  },
  timelineLabel: {
    fontSize: 16,
    color: "#666",
  },
  timelineLabelActive: {
    color: "#000",
    fontWeight: "600",
  },
  currentLabel: {
    fontSize: 12,
    color: "#1976d2",
    marginTop: 4,
    fontWeight: "600",
  },
  driverLocationCard: {
    margin: 20,
    marginBottom: 0,
    padding: 15,
    backgroundColor: "#e3f2fd",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#1976d2",
  },
  driverLocationTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1976d2",
    marginBottom: 5,
  },
  driverLocationCoords: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
  },
  driverLocationLive: {
    fontSize: 12,
    color: "#4caf50",
    marginTop: 5,
    fontWeight: "600",
  },
});
