import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl 
} from 'react-native';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'expo-router';

interface DashboardStats {
  todayOrders: number;
  pendingOrders: number;
  totalRevenue: number;
  activeDishes: number;
}

export default function ChefDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    todayOrders: 0,
    pendingOrders: 0,
    totalRevenue: 0,
    activeDishes: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [chefName, setChefName] = useState('');
  const router = useRouter();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get chef profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('name')
        .eq('id', user.id)
        .single();
      
      setChefName(profile?.name || '');

      // Get chef ID
      const { data: chef } = await supabase
        .from('chefs')
        .select('id')
        .eq('profile_id', user.id)
        .single();

      if (!chef) return;

      // Get today's date at midnight
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Get stats
      const [ordersData, dishesData] = await Promise.all([
        supabase
          .from('orders')
          .select('status, total_cents, created_at')
          .eq('chef_id', chef.id),
        supabase
          .from('dishes')
          .select('id')
          .eq('chef_id', chef.id)
          .eq('available', true),
      ]);

      const orders = ordersData.data || [];
      const todayOrders = orders.filter(
        (o) => new Date(o.created_at) >= today
      ).length;
      const pendingOrders = orders.filter(
        (o) => ['placed', 'accepted', 'preparing'].includes(o.status)
      ).length;
      const totalRevenue = orders
        .filter((o) => o.status === 'delivered')
        .reduce((sum, o) => sum + o.total_cents, 0) / 100;

      setStats({
        todayOrders,
        pendingOrders,
        totalRevenue,
        activeDishes: dishesData.data?.length || 0,
      });
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#FF7A00" />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
    >
      <Text style={styles.greeting}>Welcome back, {chefName}! 👨‍🍳</Text>
      <Text style={styles.subtitle}>Here's your kitchen overview</Text>

      {/* Stats Cards */}
      <View style={styles.statsGrid}>
        <View style={[styles.statCard, { backgroundColor: '#e3f2fd' }]}>
          <Text style={styles.statNumber}>{stats.todayOrders}</Text>
          <Text style={styles.statLabel}>Today's Orders</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#fff3e0' }]}>
          <Text style={styles.statNumber}>{stats.pendingOrders}</Text>
          <Text style={styles.statLabel}>Pending Orders</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#e8f5e9' }]}>
          <Text style={styles.statNumber}>${stats.totalRevenue.toFixed(0)}</Text>
          <Text style={styles.statLabel}>Total Revenue</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#f3e5f5' }]}>
          <Text style={styles.statNumber}>{stats.activeDishes}</Text>
          <Text style={styles.statLabel}>Active Dishes</Text>
        </View>
      </View>

      {/* Quick Actions */}
      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.actionsGrid}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => router.push('/(chef)/orders')}
        >
          <Text style={styles.actionIcon}>📦</Text>
          <Text style={styles.actionText}>View Orders</Text>
          {stats.pendingOrders > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{stats.pendingOrders}</Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => router.push('/(chef)/menu')}
        >
          <Text style={styles.actionIcon}>🍱</Text>
          <Text style={styles.actionText}>Manage Menu</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => alert('Profile coming soon!')}
        >
          <Text style={styles.actionIcon}>⚙️</Text>
          <Text style={styles.actionText}>Settings</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => alert('Analytics coming soon!')}
        >
          <Text style={styles.actionIcon}>📊</Text>
          <Text style={styles.actionText}>Analytics</Text>
        </TouchableOpacity>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 30,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#f5f5f5',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    position: 'relative',
  },
  actionIcon: {
    fontSize: 36,
    marginBottom: 8,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  badge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#f44336',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
});

