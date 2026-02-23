import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, ScrollView } from 'react-native';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { DeliveriesRepository } from '@home-chef/data';

type Period = 'today' | 'week' | 'month';

export default function DriverEarnings() {
  const [earnings, setEarnings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<Period>('today');
  const [driverId, setDriverId] = useState<string | null>(null);

  useEffect(() => {
    loadDriver();
  }, []);

  useEffect(() => {
    if (driverId) {
      loadEarnings();
    }
  }, [period, driverId]);

  const loadDriver = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: driver } = await supabase
        .from('drivers')
        .select('id, total_deliveries, rating')
        .eq('profile_id', user.id)
        .single();

      if (driver) {
        setDriverId(driver.id);
      }
    } catch (error) {
      console.error('Error loading driver:', error);
    }
  };

  const loadEarnings = async () => {
    if (!driverId) return;

    try {
      setLoading(true);
      const { startDate, endDate } = getDateRange(period);

      const repository = new DeliveriesRepository(supabase);
      const earningsData = await repository.getDriverEarnings(
        driverId,
        startDate,
        endDate
      );

      setEarnings(earningsData);
    } catch (error) {
      console.error('Error loading earnings:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDateRange = (period: Period): { startDate: string; endDate: string } => {
    const now = new Date();
    const endDate = now.toISOString();
    let startDate: string;

    if (period === 'today') {
      const start = new Date(now);
      start.setHours(0, 0, 0, 0);
      startDate = start.toISOString();
    } else if (period === 'week') {
      const start = new Date(now);
      start.setDate(now.getDate() - 7);
      startDate = start.toISOString();
    } else {
      const start = new Date(now);
      start.setDate(now.getDate() - 30);
      startDate = start.toISOString();
    }

    return { startDate, endDate };
  };

  if (!driverId) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.emptyText}>Driver profile not found</Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#FF7A00" />
        <Text style={styles.loadingText}>Loading earnings...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Earnings</Text>

      <View style={styles.periodSelector}>
        <TouchableOpacity
          style={[styles.periodButton, period === 'today' && styles.periodButtonActive]}
          onPress={() => setPeriod('today')}
        >
          <Text style={[styles.periodButtonText, period === 'today' && styles.periodButtonTextActive]}>
            Today
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.periodButton, period === 'week' && styles.periodButtonActive]}
          onPress={() => setPeriod('week')}
        >
          <Text style={[styles.periodButtonText, period === 'week' && styles.periodButtonTextActive]}>
            Week
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.periodButton, period === 'month' && styles.periodButtonActive]}
          onPress={() => setPeriod('month')}
        >
          <Text style={[styles.periodButtonText, period === 'month' && styles.periodButtonTextActive]}>
            Month
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>Total Earnings</Text>
        <Text style={styles.summaryAmount}>
          ${earnings ? (earnings.total_cents / 100).toFixed(2) : '0.00'}
        </Text>
        <Text style={styles.summaryDetail}>
          {earnings?.delivery_count || 0} {earnings?.delivery_count === 1 ? 'delivery' : 'deliveries'}
        </Text>
      </View>

      {earnings && earnings.deliveries.length > 0 && (
        <View style={styles.deliveriesSection}>
          <Text style={styles.sectionTitle}>Recent Deliveries</Text>
          {earnings.deliveries.map((delivery: any) => (
            <View key={delivery.id} style={styles.deliveryCard}>
              <View style={styles.deliveryHeader}>
                <Text style={styles.deliveryFee}>
                  ${(delivery.delivery_fee_cents / 100).toFixed(2)}
                </Text>
                <Text style={styles.deliveryDate}>
                  {new Date(delivery.created_at).toLocaleDateString()}
                </Text>
              </View>
              <Text style={styles.deliveryAddress} numberOfLines={1}>
                {delivery.pickup_address} → {delivery.dropoff_address}
              </Text>
            </View>
          ))}
        </View>
      )}

      {earnings && earnings.deliveries.length === 0 && (
        <View style={styles.emptyDeliveries}>
          <Text style={styles.emptyText}>No deliveries in this period</Text>
        </View>
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
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  periodSelector: {
    flexDirection: 'row',
    padding: 20,
    paddingTop: 10,
    gap: 10,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
  },
  periodButtonActive: {
    backgroundColor: '#FF7A00',
  },
  periodButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  periodButtonTextActive: {
    color: 'white',
  },
  summaryCard: {
    margin: 20,
    marginTop: 10,
    padding: 30,
    backgroundColor: '#FF7A00',
    borderRadius: 12,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 10,
  },
  summaryAmount: {
    fontSize: 48,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 10,
  },
  summaryDetail: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
  },
  deliveriesSection: {
    padding: 20,
    paddingTop: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  deliveryCard: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  deliveryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  deliveryFee: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF7A00',
  },
  deliveryDate: {
    fontSize: 12,
    color: '#666',
  },
  deliveryAddress: {
    fontSize: 14,
    color: '#333',
  },
  emptyDeliveries: {
    padding: 40,
    alignItems: 'center',
  },
});
