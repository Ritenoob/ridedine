import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
  Alert,
} from "react-native";
import { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { supabase } from "@/lib/supabase";
import { DeliveriesRepository } from "@home-chef/data";
import { getCurrentLocation } from "@/lib/location";
import { calculateDistance } from "@home-chef/shared";
import type { LocationObject } from "expo-location";

interface DeliveryWithDistance {
  id: string;
  pickup_address: string;
  pickup_lat: number;
  pickup_lng: number;
  dropoff_address: string;
  dropoff_lat: number;
  dropoff_lng: number;
  delivery_fee_cents: number;
  distance_km: number;
}

export default function DriverJobs() {
  const router = useRouter();
  const [deliveries, setDeliveries] = useState<DeliveryWithDistance[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [accepting, setAccepting] = useState<string | null>(null);
  const [driverId, setDriverId] = useState<string | null>(null);
  const [driverLocation, setDriverLocation] = useState<LocationObject | null>(
    null,
  );

  useEffect(() => {
    loadJobs();
  }, []);

  const loadJobs = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: driver } = await supabase
        .from("drivers")
        .select("id")
        .eq("profile_id", user.id)
        .single();

      if (!driver) {
        setLoading(false);
        return;
      }

      setDriverId(driver.id);

      const location = await getCurrentLocation();
      setDriverLocation(location);

      const repository = new DeliveriesRepository(supabase);
      const availableDeliveries = await repository.getAvailableDeliveries(50);

      const deliveriesWithDistance: DeliveryWithDistance[] = [];

      for (const delivery of availableDeliveries) {
        if (!delivery.pickup_lat || !delivery.pickup_lng) continue;

        const distance_km = location
          ? calculateDistance(
              location.coords.latitude,
              location.coords.longitude,
              delivery.pickup_lat,
              delivery.pickup_lng,
            )
          : 0;

        if (!location || distance_km <= 15) {
          deliveriesWithDistance.push({
            id: delivery.id,
            pickup_address: delivery.pickup_address,
            pickup_lat: delivery.pickup_lat,
            pickup_lng: delivery.pickup_lng,
            dropoff_address: delivery.dropoff_address,
            dropoff_lat: delivery.dropoff_lat,
            dropoff_lng: delivery.dropoff_lng,
            delivery_fee_cents: delivery.delivery_fee_cents,
            distance_km,
          });
        }
      }

      deliveriesWithDistance.sort((a, b) => a.distance_km - b.distance_km);

      setDeliveries(deliveriesWithDistance);
    } catch (error) {
      console.error("Error loading jobs:", error);
      Alert.alert("Error", "Failed to load available jobs");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadJobs();
  };

  const handleAcceptJob = async (deliveryId: string) => {
    if (!driverId) {
      Alert.alert("Error", "Driver profile not found");
      return;
    }

    try {
      setAccepting(deliveryId);
      const repository = new DeliveriesRepository(supabase);
      await repository.assignDelivery(deliveryId, driverId);

      Alert.alert("Success", "Job accepted!", [
        {
          text: "OK",
          onPress: () => {
            router.push("/(driver)/active");
          },
        },
      ]);
    } catch (error: unknown) {
      console.error("Error accepting job:", error);
      const message =
        error instanceof Error ? error.message : "Failed to accept job";
      Alert.alert("Error", message);
      setAccepting(null);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#FF7A00" />
        <Text style={styles.loadingText}>Loading available jobs...</Text>
      </View>
    );
  }

  if (deliveries.length === 0) {
    return (
      <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#FF7A00"
          />
        }
      >
        <Text style={styles.title}>Available Jobs</Text>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No jobs available</Text>
          <Text style={styles.emptySubtext}>
            {driverLocation
              ? "No deliveries within 15km of your location"
              : "Pull down to refresh"}
          </Text>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor="#FF7A00"
        />
      }
    >
      <Text style={styles.title}>Available Jobs</Text>
      <Text style={styles.subtitle}>
        {deliveries.length}{" "}
        {deliveries.length === 1 ? "delivery" : "deliveries"} within 15km
      </Text>

      {deliveries.map((delivery) => (
        <View key={delivery.id} style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.feeText}>
              ${(delivery.delivery_fee_cents / 100).toFixed(2)}
            </Text>
            {driverLocation && (
              <Text style={styles.distanceText}>
                {delivery.distance_km.toFixed(1)} km away
              </Text>
            )}
          </View>

          <View style={styles.addressSection}>
            <Text style={styles.label}>Pickup</Text>
            <Text style={styles.address}>{delivery.pickup_address}</Text>
          </View>

          <View style={[styles.addressSection, { marginTop: 15 }]}>
            <Text style={styles.label}>Dropoff</Text>
            <Text style={styles.address}>{delivery.dropoff_address}</Text>
          </View>

          <TouchableOpacity
            style={[
              styles.acceptButton,
              accepting === delivery.id && styles.acceptButtonDisabled,
            ]}
            onPress={() => handleAcceptJob(delivery.id)}
            disabled={accepting !== null}
          >
            <Text style={styles.acceptButtonText}>
              {accepting === delivery.id ? "Accepting..." : "Accept Job"}
            </Text>
          </TouchableOpacity>
        </View>
      ))}
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
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    padding: 20,
    paddingBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
  },
  emptyContainer: {
    padding: 40,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 10,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
  },
  card: {
    margin: 20,
    marginTop: 10,
    padding: 15,
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  feeText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FF7A00",
  },
  distanceText: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  addressSection: {
    marginBottom: 5,
  },
  label: {
    fontSize: 12,
    color: "#666",
    marginBottom: 5,
  },
  address: {
    fontSize: 16,
    color: "#333",
  },
  acceptButton: {
    marginTop: 15,
    backgroundColor: "#FF7A00",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  acceptButtonDisabled: {
    backgroundColor: "#ccc",
  },
  acceptButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
});
