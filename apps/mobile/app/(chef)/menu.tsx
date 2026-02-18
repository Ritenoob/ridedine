import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Modal,
  Alert,
  ScrollView
} from 'react-native';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface Dish {
  id: string;
  name: string;
  description: string;
  price: number;
  cuisine_type: string;
  available: boolean;
  created_at: string;
}

export default function ChefMenu() {
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingDish, setEditingDish] = useState<Dish | null>(null);
  const [chefId, setChefId] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    cuisine_type: '',
  });

  useEffect(() => {
    loadMenu();
  }, []);

  const loadMenu = async () => {
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
      setChefId(chef.id);

      // Get dishes
      const { data, error } = await supabase
        .from('dishes')
        .select('*')
        .eq('chef_id', chef.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDishes(data || []);
    } catch (error) {
      console.error('Error loading menu:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadMenu();
  };

  const openAddModal = () => {
    setEditingDish(null);
    setFormData({
      name: '',
      description: '',
      price: '',
      cuisine_type: '',
    });
    setModalVisible(true);
  };

  const openEditModal = (dish: Dish) => {
    setEditingDish(dish);
    setFormData({
      name: dish.name,
      description: dish.description,
      price: dish.price.toString(),
      cuisine_type: dish.cuisine_type,
    });
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.price) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    const price = parseFloat(formData.price);
    if (isNaN(price) || price <= 0) {
      Alert.alert('Error', 'Please enter a valid price');
      return;
    }

    try {
      const dishData = {
        name: formData.name,
        description: formData.description,
        price: price,
        cuisine_type: formData.cuisine_type,
      };

      if (editingDish) {
        // Update existing dish
        const { error } = await supabase
          .from('dishes')
          .update(dishData)
          .eq('id', editingDish.id);

        if (error) throw error;
        Alert.alert('Success', 'Dish updated successfully');
      } else {
        // Create new dish
        const { error } = await supabase
          .from('dishes')
          .insert({
            ...dishData,
            chef_id: chefId,
            available: true,
          });

        if (error) throw error;
        Alert.alert('Success', 'Dish created successfully');
      }

      setModalVisible(false);
      loadMenu();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to save dish');
    }
  };

  const toggleAvailability = async (dish: Dish) => {
    try {
      const { error } = await supabase
        .from('dishes')
        .update({ available: !dish.available })
        .eq('id', dish.id);

      if (error) throw error;
      loadMenu();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update dish');
    }
  };

  const handleDelete = (dish: Dish) => {
    Alert.alert(
      'Delete Dish',
      `Are you sure you want to delete "${dish.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('dishes')
                .delete()
                .eq('id', dish.id);

              if (error) throw error;
              loadMenu();
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to delete dish');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#1976d2" />
        <Text style={styles.loadingText}>Loading menu...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Menu Management</Text>
        <TouchableOpacity style={styles.addButton} onPress={openAddModal}>
          <Text style={styles.addButtonText}>+ Add Dish</Text>
        </TouchableOpacity>
      </View>

      {dishes.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>🍱</Text>
          <Text style={styles.emptyTitle}>No dishes yet</Text>
          <Text style={styles.emptyText}>Start adding dishes to your menu</Text>
          <TouchableOpacity style={styles.emptyButton} onPress={openAddModal}>
            <Text style={styles.emptyButtonText}>Create First Dish</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={dishes}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
          renderItem={({ item }) => (
            <View style={styles.dishCard}>
              <View style={styles.dishHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.dishName}>{item.name}</Text>
                  <Text style={styles.dishDescription}>{item.description}</Text>
                  <Text style={styles.dishCuisine}>{item.cuisine_type}</Text>
                </View>
                <View>
                  <Text style={styles.dishPrice}>${item.price}</Text>
                  <TouchableOpacity
                    style={[
                      styles.availabilityBadge,
                      { backgroundColor: item.available ? '#4caf50' : '#f44336' },
                    ]}
                    onPress={() => toggleAvailability(item)}
                  >
                    <Text style={styles.availabilityText}>
                      {item.available ? 'Available' : 'Unavailable'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.dishActions}>
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={() => openEditModal(item)}
                >
                  <Text style={styles.editButtonText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleDelete(item)}
                >
                  <Text style={styles.deleteButtonText}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}

      {/* Add/Edit Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView>
              <Text style={styles.modalTitle}>
                {editingDish ? 'Edit Dish' : 'Add New Dish'}
              </Text>

              <Text style={styles.label}>Dish Name *</Text>
              <TextInput
                style={styles.input}
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
                placeholder="e.g., Chicken Tikka Masala"
              />

              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.description}
                onChangeText={(text) => setFormData({ ...formData, description: text })}
                placeholder="Describe your dish..."
                multiline
                numberOfLines={3}
              />

              <Text style={styles.label}>Price ($) *</Text>
              <TextInput
                style={styles.input}
                value={formData.price}
                onChangeText={(text) => setFormData({ ...formData, price: text })}
                placeholder="12.99"
                keyboardType="decimal-pad"
              />

              <Text style={styles.label}>Cuisine Type</Text>
              <TextInput
                style={styles.input}
                value={formData.cuisine_type}
                onChangeText={(text) => setFormData({ ...formData, cuisine_type: text })}
                placeholder="e.g., Indian, Italian, Mexican"
              />

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                  <Text style={styles.saveButtonText}>
                    {editingDish ? 'Update' : 'Create'}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  addButton: {
    backgroundColor: '#1976d2',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 6,
  },
  addButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  dishCard: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 15,
    marginBottom: 12,
  },
  dishHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  dishName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  dishDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  dishCuisine: {
    fontSize: 12,
    color: '#999',
  },
  dishPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1976d2',
    marginBottom: 8,
  },
  availabilityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },
  availabilityText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '600',
  },
  dishActions: {
    flexDirection: 'row',
    gap: 10,
  },
  editButton: {
    flex: 1,
    backgroundColor: '#1976d2',
    padding: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  editButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  deleteButton: {
    flex: 1,
    backgroundColor: 'white',
    padding: 10,
    borderRadius: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f44336',
  },
  deleteButtonText: {
    color: '#f44336',
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
    marginBottom: 30,
  },
  emptyButton: {
    backgroundColor: '#1976d2',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 6,
    fontSize: 16,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  cancelButton: {
    flex: 1,
    padding: 14,
    borderRadius: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#1976d2',
    padding: 14,
    borderRadius: 6,
    alignItems: 'center',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

