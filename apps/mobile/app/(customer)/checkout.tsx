import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  TextInput, 
  ScrollView, 
  Alert,
  ActivityIndicator
} from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useCart } from '@/lib/context/CartContext';
import { supabase } from '@/lib/supabase';

export default function Checkout() {
  const router = useRouter();
  const { items, getTotalPrice, clearCart, getChefId } = useCart();
  const [loading, setLoading] = useState(false);
  
  // Form state
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedTip, setSelectedTip] = useState(0);

  const deliveryFee = 4.99;
  const platformFeeRate = 0.15;
  const subtotal = getTotalPrice();
  const platformFee = subtotal * platformFeeRate;
  const tipAmount = selectedTip;
  const total = subtotal + deliveryFee + platformFee + tipAmount;

  const tipOptions = [
    { label: 'No Tip', value: 0 },
    { label: '$2', value: 2 },
    { label: '$5', value: 5 },
    { label: '$10', value: 10 },
  ];

  const handlePlaceOrder = async () => {
    if (!address.trim()) {
      Alert.alert('Missing Information', 'Please enter a delivery address.');
      return;
    }

    setLoading(true);
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('Error', 'You must be logged in to place an order.');
        setLoading(false);
        return;
      }

      const chefId = getChefId();
      if (!chefId) {
        Alert.alert('Error', 'No items in cart.');
        setLoading(false);
        return;
      }

      // Create order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          customer_id: user.id,
          chef_id: chefId,
          status: 'placed',
          subtotal_cents: Math.round(subtotal * 100),
          delivery_fee_cents: Math.round(deliveryFee * 100),
          platform_fee_cents: Math.round(platformFee * 100),
          tip_cents: Math.round(tipAmount * 100),
          total_cents: Math.round(total * 100),
          delivery_method: 'delivery',
          address: address,
          notes: notes || null,
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItems = items.map(item => ({
        order_id: order.id,
        dish_id: item.dishId,
        quantity: item.quantity,
        price_cents: Math.round(item.price * 100),
        special_instructions: item.specialInstructions || null,
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // Clear cart and redirect
      clearCart();
      Alert.alert(
        'Order Placed!',
        `Your order #${order.id.slice(0, 8)} has been placed successfully.`,
        [
          {
            text: 'View Orders',
            onPress: () => router.replace('/(customer)/orders'),
          },
        ]
      );
    } catch (error: unknown) {
      console.error('Error placing order:', error);
      const message = error instanceof Error ? error.message : 'Failed to place order. Please try again.';
      Alert.alert('Error', message);
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyTitle}>No items to checkout</Text>
        <TouchableOpacity
          style={styles.browseButton}
          onPress={() => router.push('/(customer)/dishes')}
        >
          <Text style={styles.browseButtonText}>Browse Meals</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Checkout</Text>

      {/* Delivery Address */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Delivery Address</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your delivery address"
          value={address}
          onChangeText={setAddress}
          multiline
          numberOfLines={3}
        />
      </View>

      {/* Delivery Instructions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Delivery Instructions (Optional)</Text>
        <TextInput
          style={styles.input}
          placeholder="E.g., Ring doorbell, leave at door"
          value={notes}
          onChangeText={setNotes}
          multiline
          numberOfLines={2}
        />
      </View>

      {/* Tip Selection */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Add a Tip for the Chef</Text>
        <View style={styles.tipOptions}>
          {tipOptions.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.tipButton,
                selectedTip === option.value && styles.tipButtonSelected,
              ]}
              onPress={() => setSelectedTip(option.value)}
            >
              <Text
                style={[
                  styles.tipButtonText,
                  selectedTip === option.value && styles.tipButtonTextSelected,
                ]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Order Summary */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Order Summary</Text>
        <View style={styles.summary}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal ({items.length} items)</Text>
            <Text style={styles.summaryValue}>${subtotal.toFixed(2)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Delivery Fee</Text>
            <Text style={styles.summaryValue}>${deliveryFee.toFixed(2)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Platform Fee (15%)</Text>
            <Text style={styles.summaryValue}>${platformFee.toFixed(2)}</Text>
          </View>
          {tipAmount > 0 && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Tip</Text>
              <Text style={styles.summaryValue}>${tipAmount.toFixed(2)}</Text>
            </View>
          )}
          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>${total.toFixed(2)}</Text>
          </View>
        </View>
      </View>

      {/* Place Order Button */}
      <TouchableOpacity
        style={[styles.placeOrderButton, loading && styles.placeOrderButtonDisabled]}
        onPress={handlePlaceOrder}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={styles.placeOrderButtonText}>
            Place Order (${total.toFixed(2)})
          </Text>
        )}
      </TouchableOpacity>

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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  input: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  tipOptions: {
    flexDirection: 'row',
    gap: 10,
  },
  tipButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    alignItems: 'center',
  },
  tipButtonSelected: {
    borderColor: '#FF7A00',
    backgroundColor: '#e3f2fd',
  },
  tipButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  tipButtonTextSelected: {
    color: '#FF7A00',
  },
  summary: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingTop: 10,
    marginTop: 5,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF7A00',
  },
  placeOrderButton: {
    backgroundColor: '#FF7A00',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  placeOrderButtonDisabled: {
    backgroundColor: '#999',
  },
  placeOrderButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#fff',
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  browseButton: {
    backgroundColor: '#FF7A00',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
  },
  browseButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
