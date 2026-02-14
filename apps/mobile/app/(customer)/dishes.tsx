import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'expo-router';
import { useCart } from '@/lib/context/CartContext';

export default function Dishes() {
  const [dishes, setDishes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { items, addItem, getTotalItems, getTotalPrice, getChefId } = useCart();

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

  const handleAddToCart = (dish: any) => {
    const cartChefId = getChefId();
    
    // Check if adding from a different chef
    if (cartChefId && cartChefId !== dish.chefs.id) {
      alert('You can only order from one chef at a time. Please clear your cart first.');
      return;
    }

    addItem({
      dishId: dish.id,
      name: dish.name,
      price: dish.price,
      chefId: dish.chefs.id,
      chefName: dish.chefs.profiles.name,
    });
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
      
      {items.length > 0 && (
        <TouchableOpacity 
          style={styles.cartBanner}
          onPress={() => router.push('/(customer)/cart')}
        >
          <View>
            <Text style={styles.cartText}>{getTotalItems()} items in cart</Text>
            <Text style={styles.cartSubtext}>${getTotalPrice().toFixed(2)} total</Text>
          </View>
          <View style={styles.checkoutButton}>
            <Text style={styles.checkoutButtonText}>View Cart →</Text>
          </View>
        </TouchableOpacity>
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
              onPress={() => handleAddToCart(item)}
            >
              <Text style={styles.addButtonText}>Add to Cart</Text>
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
    backgroundColor: '#1976d2',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
  },
  cartText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  cartSubtext: {
    fontSize: 14,
    color: '#e3f2fd',
    marginTop: 4,
  },
  checkoutButton: {
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 4,
  },
  checkoutButtonText: {
    color: '#1976d2',
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
