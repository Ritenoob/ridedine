import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { DeliveriesRepository } from "@packages/data";
import { supabase } from "@/lib/supabase";
import type { Delivery } from "@packages/shared";

export default function DriverEarnings() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [todayEarnings, setTodayEarnings] = useState(0);
  const [weekEarnings, setWeekEarnings] = useState(0);
  const [monthEarnings, setMonthEarnings] = useState(0);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [payoutEnabled, setPayoutEnabled] = useState(false);
  const [hasConnectAccount, setHasConnectAccount] = useState(false);

  useEffect(() => {
    if (user) {
      loadEarningsData();
    }
  }, [user]);

  const loadEarningsData = async () => {
    try {
      setLoading(true);
      const deliveriesRepo = new DeliveriesRepository(supabase);

      const { data: drivers, error: driverError } = await supabase
        .from("drivers")
        .select("id, connect_account_id, payout_enabled")
        .eq("profile_id", user!.id)
        .single();

      if (!driverError && drivers) {
        setHasConnectAccount(!!drivers.connect_account_id);
        setPayoutEnabled(drivers.payout_enabled || false);

        const now = new Date();
        const todayStart = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate(),
        ).toISOString();
        const todayEnd = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate() + 1,
        ).toISOString();

        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay());
        weekStart.setHours(0, 0, 0, 0);

        const monthStart = new Date(
          now.getFullYear(),
          now.getMonth(),
          1,
        ).toISOString();
        const monthEnd = new Date(
          now.getFullYear(),
          now.getMonth() + 1,
          1,
        ).toISOString();

        const todayData = await deliveriesRepo.getDriverEarnings(
          drivers.id,
          todayStart,
          todayEnd,
        );
        const weekData = await deliveriesRepo.getDriverEarnings(
          drivers.id,
          weekStart.toISOString(),
          now.toISOString(),
        );
        const monthData = await deliveriesRepo.getDriverEarnings(
          drivers.id,
          monthStart,
          monthEnd,
        );

        setTodayEarnings(todayData.total_cents);
        setWeekEarnings(weekData.total_cents);
        setMonthEarnings(monthData.total_cents);
        setDeliveries(monthData.deliveries);
      }
    } catch (error) {
      console.error("Error loading earnings:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Loading earnings...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Earnings</Text>

      {/* Payout Status */}
      <View style={styles.payoutStatus}>
        {hasConnectAccount && payoutEnabled ? (
          <Text style={styles.payoutEnabled}>✓ Payouts Enabled</Text>
        ) : hasConnectAccount && !payoutEnabled ? (
          <Text style={styles.payoutPending}>⏳ Payout Setup Pending</Text>
        ) : (
          <Text style={styles.payoutDisabled}>
            ⚠️ Set up payouts to receive earnings
          </Text>
        )}
      </View>

      {/* Earnings Summary */}
      <View style={styles.summaryContainer}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Today</Text>
          <Text style={styles.summaryAmount}>
            {formatCurrency(todayEarnings)}
          </Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>This Week</Text>
          <Text style={styles.summaryAmount}>
            {formatCurrency(weekEarnings)}
          </Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>This Month</Text>
          <Text style={styles.summaryAmount}>
            {formatCurrency(monthEarnings)}
          </Text>
        </View>
      </View>

      {/* Deliveries List */}
      <Text style={styles.sectionTitle}>Completed Deliveries</Text>
      {deliveries.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>
            No completed deliveries this month
          </Text>
        </View>
      ) : (
        <FlatList
          data={deliveries}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.deliveryCard}>
              <View style={styles.deliveryInfo}>
                <Text style={styles.deliveryDate}>
                  {formatDate(item.created_at)}
                </Text>
                <Text style={styles.deliveryStatus}>{item.status}</Text>
              </View>
              <Text style={styles.deliveryFee}>
                {formatCurrency(item.delivery_fee_cents || 0)}
              </Text>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f5f5f5",
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    color: "#666",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },
  payoutStatus: {
    padding: 15,
    borderRadius: 8,
    backgroundColor: "#fff",
    marginBottom: 20,
  },
  payoutEnabled: {
    color: "#22c55e",
    fontWeight: "600",
  },
  payoutPending: {
    color: "#f59e0b",
    fontWeight: "600",
  },
  payoutDisabled: {
    color: "#ef4444",
    fontWeight: "600",
  },
  summaryContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
    gap: 10,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
  },
  summaryLabel: {
    fontSize: 12,
    color: "#666",
    marginBottom: 5,
  },
  summaryAmount: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#000",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 10,
  },
  emptyState: {
    padding: 40,
    alignItems: "center",
  },
  emptyText: {
    color: "#666",
    fontSize: 14,
  },
  deliveryCard: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  deliveryInfo: {
    flex: 1,
  },
  deliveryDate: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
  },
  deliveryStatus: {
    fontSize: 12,
    color: "#666",
    textTransform: "capitalize",
  },
  deliveryFee: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#22c55e",
  },
});
