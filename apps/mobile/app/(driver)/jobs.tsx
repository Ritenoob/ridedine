import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { DeliveriesRepository } from '@home-chef/data';

interface AvailableJob {
  id: string;
  order_id: string;
  pickup_address: string;
  dropoff_address: string;
  delivery_fee_cents: number;
  distance_km?: number;
  order: {
    customer_name: string;
    total_cents: number;
  };
}

export default function DriverJobs() {
  const [jobs, setJobs] = useState<AvailableJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState<string | null>(null);

  useEffect(() => {
    loadJobs();

    // Set up realtime subscription for new jobs
    const channel = supabase
      .channel('available-deliveries')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'deliveries',
          filter: 'driver_id=is.null',
        },
        () => {
          loadJobs();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadJobs = async () => {
    try {
      const repository = new DeliveriesRepository(supabase);
      const availableJobs = await repository.getAvailableDeliveries(20);
      setJobs(availableJobs as any);
    } catch (error) {
      console.error('Error loading jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const acceptJob = async (deliveryId: string) => {
    try {
      setAccepting(deliveryId);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Get driver profile
      const { data: driver } = await supabase
        .from('drivers')
        .select('id')
        .eq('profile_id', user.id)
        .single();

      if (!driver) {
        Alert.alert('Error', 'Driver profile not found');
        return;
      }

      // Assign delivery to driver
      const repository = new DeliveriesRepository(supabase);
      await repository.assignDelivery(deliveryId, driver.id);

      Alert.alert('Success', 'Delivery accepted! Check Active tab.');
      loadJobs();
    } catch (error: any) {
      console.error('Error accepting job:', error);
      Alert.alert('Error', error.message || 'Failed to accept delivery');
    } finally {
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

  if (jobs.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.emptyText}>No available deliveries</Text>
        <Text style={styles.emptySubtext}>
          New delivery jobs will appear here automatically
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Available Jobs</Text>
      <FlatList
        data={jobs}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.jobCard}>
            <View style={styles.jobHeader}>
              <Text style={styles.jobFee}>
                ${(item.delivery_fee_cents / 100).toFixed(2)}
              </Text>
              {item.distance_km && (
                <Text style={styles.jobDistance}>
                  {item.distance_km.toFixed(1)} km
                </Text>
              )}
            </View>

            <View style={styles.jobDetails}>
              <Text style={styles.label}>Pickup</Text>
              <Text style={styles.address}>{item.pickup_address}</Text>

              <Text style={[styles.label, { marginTop: 10 }]}>Dropoff</Text>
              <Text style={styles.address}>{item.dropoff_address}</Text>

              {item.order && (
                <Text style={styles.orderTotal}>
                  Order total: ${(item.order.total_cents / 100).toFixed(2)}
                </Text>
              )}
            </View>

            <TouchableOpacity
              style={[
                styles.acceptButton,
                accepting === item.id && styles.acceptButtonDisabled,
              ]}
              onPress={() => acceptJob(item.id)}
              disabled={accepting === item.id}
            >
              <Text style={styles.acceptButtonText}>
                {accepting === item.id ? 'Accepting...' : 'Accept Delivery'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
        contentContainerStyle={styles.listContent}
      />
    </View>
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
  listContent: {
    padding: 20,
    paddingTop: 10,
  },
  jobCard: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  jobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  jobFee: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF7A00',
  },
  jobDistance: {
    fontSize: 14,
    color: '#666',
    backgroundColor: '#fff',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 4,
  },
  jobDetails: {
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
  orderTotal: {
    fontSize: 14,
    color: '#666',
    marginTop: 10,
  },
  acceptButton: {
    backgroundColor: '#FF7A00',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  acceptButtonDisabled: {
    backgroundColor: '#ccc',
  },
  acceptButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
