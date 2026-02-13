import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert 
} from 'react-native';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface Order {
  id: string;
  status: string;
  total_cents: number;
  created_at: string;
  address: string;
  notes: string | null;
  tracking_token: string;
  profiles: {
    name: string;
  };
  order_items: Array<{
    quantity: number;
    dishes: {
      name: string;
    };
  }>;
}

export default function ChefOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'pending' | 'completed'>('pending');

  useEffect(() => {
    loadOrders();
  }, [filter]);

  const loadOrders = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get chef ID
      const { data: chef } = await supabase
        .from('chefs')
        .select('id')
        .eq('profile_id', user.id)
        .single();

      if (!chef) return;

      // Build query based on filter
      let statusFilter;
      if (filter === 'pending') {
        statusFilter = ['placed', 'accepted', 'preparing', 'ready', 'picked_up'];
      } else {
        statusFilter = ['delivered', 'cancelled', 'refunded'];
      }

      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          profiles (name),
          order_items (
            quantity,
            dishes (name)
          )
        `)
        .eq('chef_id', chef.id)
        .in('status', statusFilter)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadOrders();
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);

      if (error) throw error;
      
      Alert.alert('Success', `Order updated to ${newStatus}`);
      loadOrders();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update order');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered':
        return '#4caf50';
      case 'cancelled':
      case 'refunded':
        return '#f44336';
      case 'placed':
        return '#ff9800';
      default:
        return '#1976d2';
    }
  };

  const getNextStatus = (currentStatus: string): string | null => {
    const statusFlow: { [key: string]: string } = {
      placed: 'accepted',
      accepted: 'preparing',
      preparing: 'ready',
      ready: 'picked_up',
      picked_up: 'delivered',
    };
    return statusFlow[currentStatus] || null;
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#1976d2" />
        <Text style={styles.loadingText}>Loading orders...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Incoming Orders</Text>

      {/* Filter Tabs */}
      <View style={styles.filterTabs}>
        <TouchableOpacity
          style={[styles.tab, filter === 'pending' && styles.tabActive]}
          onPress={() => setFilter('pending')}
        >
          <Text style={[styles.tabText, filter === 'pending' && styles.tabTextActive]}>
            Pending
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, filter === 'completed' && styles.tabActive]}
          onPress={() => setFilter('completed')}
        >
          <Text style={[styles.tabText, filter === 'completed' && styles.tabTextActive]}>
            Completed
          </Text>
        </TouchableOpacity>
      </View>

      {orders.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>
            {filter === 'pending' ? '🔔' : '✅'}
          </Text>
          <Text style={styles.emptyTitle}>
            {filter === 'pending' ? 'No pending orders' : 'No completed orders'}
          </Text>
          <Text style={styles.emptyText}>
            {filter === 'pending' 
              ? 'New orders will appear here' 
              : 'Delivered and cancelled orders will appear here'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
          renderItem={({ item }) => {
            const nextStatus = getNextStatus(item.status);
            return (
              <View style={styles.orderCard}>
                <View style={styles.orderHeader}>
                  <View>
                    <Text style={styles.customerName}>{item.profiles?.name}</Text>
                    <Text style={styles.orderDate}>
                      {new Date(item.created_at).toLocaleString()}
                    </Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
                    <Text style={styles.statusText}>
                      {item.status.toUpperCase().replace('_', ' ')}
                    </Text>
                  </View>
                </View>

                {/* Order Items */}
                <View style={styles.itemsList}>
                  {item.order_items?.map((orderItem, idx) => (
                    <Text key={idx} style={styles.itemText}>
                      {orderItem.quantity}x {orderItem.dishes?.name}
                    </Text>
                  ))}
                </View>

                {/* Delivery Info */}
                <View style={styles.deliveryInfo}>
                  <Text style={styles.infoLabel}>Delivery Address:</Text>
                  <Text style={styles.infoText}>{item.address || 'N/A'}</Text>
                  {item.notes && (
                    <>
                      <Text style={styles.infoLabel}>Notes:</Text>
                      <Text style={styles.infoText}>{item.notes}</Text>
                    </>
                  )}
                </View>

                <View style={styles.orderFooter}>
                  <Text style={styles.totalAmount}>
                    ${(item.total_cents / 100).toFixed(2)}
                  </Text>

                  {nextStatus && filter === 'pending' && (
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => updateOrderStatus(item.id, nextStatus)}
                    >
                      <Text style={styles.actionButtonText}>
                        {nextStatus === 'accepted' ? 'Accept Order' : 
                         nextStatus === 'preparing' ? 'Start Preparing' :
                         nextStatus === 'ready' ? 'Mark Ready' :
                         nextStatus === 'picked_up' ? 'Mark Picked Up' :
                         'Mark Delivered'}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>

                {item.status === 'placed' && (
                  <TouchableOpacity
                    style={styles.rejectButton}
                    onPress={() => {
                      Alert.alert(
                        'Reject Order',
                        'Are you sure you want to reject this order?',
                        [
                          { text: 'Cancel', style: 'cancel' },
                          {
                            text: 'Reject',
                            style: 'destructive',
                            onPress: () => updateOrderStatus(item.id, 'cancelled'),
                          },
                        ]
                      );
                    }}
                  >
                    <Text style={styles.rejectButtonText}>Reject Order</Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          }}
        />
      )}
    </View>
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  filterTabs: {
    flexDirection: 'row',
    marginBottom: 20,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 6,
  },
  tabActive: {
    backgroundColor: '#1976d2',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  tabTextActive: {
    color: 'white',
  },
  orderCard: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 15,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  customerName: {
    fontSize: 16,
    fontWeight: '600',
  },
  orderDate: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 4,
  },
  statusText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '600',
  },
  itemsList: {
    marginBottom: 12,
    paddingLeft: 10,
  },
  itemText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  deliveryInfo: {
    marginBottom: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1976d2',
  },
  actionButton: {
    backgroundColor: '#1976d2',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 6,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  rejectButton: {
    marginTop: 10,
    padding: 10,
    alignItems: 'center',
  },
  rejectButtonText: {
    color: '#f44336',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});

