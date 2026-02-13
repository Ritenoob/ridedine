import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'expo-router';

export default function Dishes() {
  const [dishes, setDishes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<any[]>([]);
  const router = useRouter();

  useEffect(() => {
    loadDishes();
  }, []);

  const loadDishes = async () => {
    try {
      const { data, error } = await supabase
        .from('dishes')
        .select(`
          *,
          chefs!inner (
            id,
            status,
            rating,
            profiles!inner (
              name
            )
          )
        `)
        .eq('available', true)
        .eq('chefs.status', 'approved');
      
      if (error) throw error;
      setDishes(data || []);
    } catch (error) {
      console.error('Error loading dishes:', error);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (dish: any) => {
    setCart([...cart, dish]);
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#1976d2" />
        <Text style={styles.loadingText}>Loading dishes...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Available Dishes</Text>
      
      {cart.length > 0 && (
        <View style={styles.cartBanner}>
          <Text style={styles.cartText}>{cart.length} items in cart</Text>
          <TouchableOpacity 
            style={styles.checkoutButton}
            onPress={() => router.push('/(customer)/checkout')}
          >
            <Text style={styles.checkoutButtonText}>Checkout</Text>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={dishes}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.dishCard}>
            <View style={styles.dishHeader}>
              <Text style={styles.dishName}>{item.name}</Text>
              <Text style={styles.price}>${item.price}</Text>
            </View>
            <Text style={styles.description}>{item.description}</Text>
            <Text style={styles.chefInfo}>
              by {item.chefs?.profiles?.name} • {item.cuisine_type}
            </Text>
            <TouchableOpacity 
              style={styles.addButton}
              onPress={() => addToCart(item)}
            >
              <Text style={styles.addButtonText}>Add to Order</Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  cartBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#e3f2fd',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
  },
  cartText: {
    fontSize: 16,
    fontWeight: '600',
  },
  checkoutButton: {
    backgroundColor: '#1976d2',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 4,
  },
  checkoutButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  dishCard: {
    padding: 15,
    marginBottom: 10,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  dishHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  dishName: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
  },
  price: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1976d2',
  },
  description: {
    color: '#666',
    marginBottom: 8,
  },
  chefInfo: {
    fontSize: 12,
    color: '#888',
    marginBottom: 10,
  },
  addButton: {
    backgroundColor: '#1976d2',
    padding: 10,
    borderRadius: 4,
    alignItems: 'center',
  },
  addButtonText: {
    color: 'white',
    fontWeight: '600',
  },
});
