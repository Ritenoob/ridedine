import { View, Text, StyleSheet, TouchableOpacity, Switch, Alert, ActivityIndicator } from 'react-native';
import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';

type ProfileRow = {
  name?: string | null;
  email?: string | null;
  phone?: string | null;
};

type DriverRow = {
  id: string;
  total_deliveries: number;
  rating: number;
  vehicle_type?: string | null;
  is_verified: boolean;
  is_available: boolean;
};

export default function DriverProfile() {
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [driver, setDriver] = useState<DriverRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingAvailability, setUpdatingAvailability] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Get user profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      // Get driver profile
      const { data: driverData } = await supabase
        .from('drivers')
        .select('*')
        .eq('profile_id', user.id)
        .single();

      setProfile(profileData);
      setDriver(driverData);
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleAvailability = async (value: boolean) => {
    if (!driver) return;

    try {
      setUpdatingAvailability(true);

      const { error } = await supabase
        .from('drivers')
        .update({ is_available: value })
        .eq('id', driver.id);

      if (error) throw error;

      setDriver({ ...driver, is_available: value });
    } catch (error: unknown) {
      console.error('Error updating availability:', error);
      const message = error instanceof Error ? error.message : 'Failed to update availability';
      Alert.alert('Error', message);
    } finally {
      setUpdatingAvailability(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      router.replace('/(auth)/signin');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to sign out';
      Alert.alert('Error', message);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#FF7A00" />
      </View>
    );
  }

  if (!profile || !driver) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Profile not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profile</Text>

      <View style={styles.card}>
        <Text style={styles.name}>{profile.name}</Text>
        <Text style={styles.email}>{profile.email}</Text>
        {profile.phone && <Text style={styles.phone}>{profile.phone}</Text>}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Driver Stats</Text>

        <View style={styles.statRow}>
          <Text style={styles.statLabel}>Total Deliveries</Text>
          <Text style={styles.statValue}>{driver.total_deliveries}</Text>
        </View>

        <View style={styles.statRow}>
          <Text style={styles.statLabel}>Rating</Text>
          <Text style={styles.statValue}>
            {driver.rating > 0 ? `${driver.rating.toFixed(2)} ⭐` : 'No ratings yet'}
          </Text>
        </View>

        {driver.vehicle_type && (
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Vehicle Type</Text>
            <Text style={styles.statValue}>{driver.vehicle_type}</Text>
          </View>
        )}

        <View style={styles.statRow}>
          <Text style={styles.statLabel}>Status</Text>
          <Text style={[
            styles.statValue,
            { color: driver.is_verified ? '#4CAF50' : '#FF9800' }
          ]}>
            {driver.is_verified ? 'Verified' : 'Pending Verification'}
          </Text>
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.availabilityRow}>
          <View>
            <Text style={styles.cardTitle}>Availability</Text>
            <Text style={styles.availabilitySubtext}>
              {driver.is_available ? 'Accepting new deliveries' : 'Not accepting deliveries'}
            </Text>
          </View>
          <Switch
            value={driver.is_available}
            onValueChange={toggleAvailability}
            disabled={updatingAvailability || !driver.is_verified}
            trackColor={{ false: '#ddd', true: '#FF7A00' }}
            thumbColor={driver.is_available ? '#fff' : '#f4f3f4'}
          />
        </View>
        {!driver.is_verified && (
          <Text style={styles.warningText}>
            You must be verified to accept deliveries
          </Text>
        )}
      </View>

      <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
        <Text style={styles.signOutButtonText}>Sign Out</Text>
      </TouchableOpacity>
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
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    padding: 20,
    paddingBottom: 10,
  },
  errorText: {
    fontSize: 16,
    color: '#d32f2f',
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
  name: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  email: {
    fontSize: 16,
    color: '#666',
    marginBottom: 3,
  },
  phone: {
    fontSize: 16,
    color: '#666',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  statLabel: {
    fontSize: 16,
    color: '#666',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  availabilityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  availabilitySubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  warningText: {
    fontSize: 14,
    color: '#FF9800',
    marginTop: 15,
    fontStyle: 'italic',
  },
  signOutButton: {
    margin: 20,
    marginTop: 10,
    padding: 15,
    backgroundColor: '#d32f2f',
    borderRadius: 8,
    alignItems: 'center',
  },
  signOutButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
