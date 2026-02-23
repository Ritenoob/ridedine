import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import type { Profile, SavedAddress } from '@home-chef/shared';

export default function ProfileScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [editingProfile, setEditingProfile] = useState(false);
  const [editingAddress, setEditingAddress] = useState<SavedAddress | null>(
    null
  );

  // Profile form fields
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  // Address form fields
  const [addressLabel, setAddressLabel] = useState('');
  const [addressText, setAddressText] = useState('');
  const [isDefault, setIsDefault] = useState(false);

  useEffect(() => {
    loadProfile();
    loadAddresses();
  }, []);

  const loadProfile = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        router.replace('/(auth)/signin');
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (error) throw error;

      setProfile(data);
      setName(data.name || '');
      setPhone(data.phone || '');
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAddresses = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase
        .from('saved_addresses')
        .select('*')
        .eq('user_id', session.user.id)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;

      setAddresses(data || []);
    } catch (error) {
      console.error('Error loading addresses:', error);
    }
  };

  const saveProfile = async () => {
    if (!profile) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          name,
          phone,
          updated_at: new Date().toISOString(),
        })
        .eq('id', profile.id);

      if (error) throw error;

      setProfile({ ...profile, name, phone });
      setEditingProfile(false);
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert('Error', 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const startEditAddress = (address: SavedAddress | null) => {
    if (address) {
      setEditingAddress(address);
      setAddressLabel(address.label);
      setAddressText(address.address);
      setIsDefault(address.is_default);
    } else {
      setEditingAddress(null);
      setAddressLabel('');
      setAddressText('');
      setIsDefault(false);
    }
  };

  const saveAddress = async () => {
    if (!profile) return;

    setSaving(true);
    try {
      if (editingAddress) {
        // Update existing address
        const { error } = await supabase
          .from('saved_addresses')
          .update({
            label: addressLabel,
            address: addressText,
            is_default: isDefault,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingAddress.id);

        if (error) throw error;
      } else {
        // Create new address
        const { error } = await supabase.from('saved_addresses').insert({
          user_id: profile.id,
          label: addressLabel,
          address: addressText,
          is_default: isDefault,
        });

        if (error) throw error;
      }

      await loadAddresses();
      startEditAddress(null);
      Alert.alert(
        'Success',
        `Address ${editingAddress ? 'updated' : 'added'} successfully`
      );
    } catch (error) {
      console.error('Error saving address:', error);
      Alert.alert('Error', 'Failed to save address');
    } finally {
      setSaving(false);
    }
  };

  const deleteAddress = async (addressId: string) => {
    Alert.alert('Delete Address', 'Are you sure you want to delete this address?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            const { error } = await supabase
              .from('saved_addresses')
              .delete()
              .eq('id', addressId);

            if (error) throw error;

            await loadAddresses();
            Alert.alert('Success', 'Address deleted successfully');
          } catch (error) {
            console.error('Error deleting address:', error);
            Alert.alert('Error', 'Failed to delete address');
          }
        },
      },
    ]);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.replace('/(auth)/signin');
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B35" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Profile Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Profile Information</Text>
          {!editingProfile && (
            <TouchableOpacity onPress={() => setEditingProfile(true)}>
              <Ionicons name="pencil" size={20} color="#FF6B35" />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.card}>
          <View style={styles.field}>
            <Text style={styles.label}>Email</Text>
            <Text style={styles.value}>{profile?.email}</Text>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Name</Text>
            {editingProfile ? (
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Enter your name"
              />
            ) : (
              <Text style={styles.value}>{name || 'Not set'}</Text>
            )}
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Phone</Text>
            {editingProfile ? (
              <TextInput
                style={styles.input}
                value={phone}
                onChangeText={setPhone}
                placeholder="Enter your phone"
                keyboardType="phone-pad"
              />
            ) : (
              <Text style={styles.value}>{phone || 'Not set'}</Text>
            )}
          </View>

          {editingProfile && (
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.button, styles.secondaryButton]}
                onPress={() => {
                  setEditingProfile(false);
                  setName(profile?.name || '');
                  setPhone(profile?.phone || '');
                }}
              >
                <Text style={styles.secondaryButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.primaryButton]}
                onPress={saveProfile}
                disabled={saving}
              >
                <Text style={styles.primaryButtonText}>
                  {saving ? 'Saving...' : 'Save'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>

      {/* Saved Addresses Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Saved Addresses</Text>
          <TouchableOpacity onPress={() => startEditAddress(null)}>
            <Ionicons name="add-circle" size={24} color="#FF6B35" />
          </TouchableOpacity>
        </View>

        {addresses.map((addr) => (
          <View key={addr.id} style={styles.card}>
            <View style={styles.addressHeader}>
              <View style={styles.addressLabelContainer}>
                <Text style={styles.addressLabel}>{addr.label}</Text>
                {addr.is_default && (
                  <View style={styles.defaultBadge}>
                    <Text style={styles.defaultBadgeText}>Default</Text>
                  </View>
                )}
              </View>
              <View style={styles.addressActions}>
                <TouchableOpacity onPress={() => startEditAddress(addr)}>
                  <Ionicons
                    name="pencil"
                    size={20}
                    color="#FF6B35"
                    style={styles.iconButton}
                  />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => deleteAddress(addr.id)}>
                  <Ionicons name="trash" size={20} color="#FF3B30" />
                </TouchableOpacity>
              </View>
            </View>
            <Text style={styles.addressText}>{addr.address}</Text>
          </View>
        ))}

        {addresses.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="location-outline" size={48} color="#ccc" />
            <Text style={styles.emptyText}>No saved addresses</Text>
          </View>
        )}

        {/* Address Form */}
        {editingAddress !== undefined && (
          <View style={[styles.card, styles.formCard]}>
            <Text style={styles.formTitle}>
              {editingAddress ? 'Edit Address' : 'New Address'}
            </Text>

            <TextInput
              style={styles.input}
              value={addressLabel}
              onChangeText={setAddressLabel}
              placeholder="Label (e.g., Home, Work)"
            />

            <TextInput
              style={[styles.input, styles.textArea]}
              value={addressText}
              onChangeText={setAddressText}
              placeholder="Address"
              multiline
              numberOfLines={3}
            />

            <TouchableOpacity
              style={styles.checkboxRow}
              onPress={() => setIsDefault(!isDefault)}
            >
              <Ionicons
                name={isDefault ? 'checkbox' : 'square-outline'}
                size={24}
                color="#FF6B35"
              />
              <Text style={styles.checkboxLabel}>Set as default address</Text>
            </TouchableOpacity>

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.button, styles.secondaryButton]}
                onPress={() => startEditAddress(null)}
              >
                <Text style={styles.secondaryButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.primaryButton]}
                onPress={saveAddress}
                disabled={saving || !addressLabel || !addressText}
              >
                <Text style={styles.primaryButtonText}>
                  {saving ? 'Saving...' : 'Save'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      {/* Sign Out Button */}
      <TouchableOpacity
        style={[styles.button, styles.signOutButton]}
        onPress={handleSignOut}
      >
        <Text style={styles.signOutButtonText}>Sign Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  card: {
    backgroundColor: 'white',
    marginHorizontal: 15,
    marginBottom: 10,
    padding: 15,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  formCard: {
    marginTop: 10,
  },
  field: {
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  value: {
    fontSize: 16,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: 'white',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  button: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  primaryButton: {
    backgroundColor: '#FF6B35',
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  secondaryButtonText: {
    color: '#666',
    fontSize: 16,
  },
  addressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  addressLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addressLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  defaultBadge: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  defaultBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  addressActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    marginRight: 15,
  },
  addressText: {
    fontSize: 14,
    color: '#666',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 10,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
  },
  checkboxLabel: {
    fontSize: 16,
    marginLeft: 8,
  },
  signOutButton: {
    backgroundColor: '#FF3B30',
    marginHorizontal: 15,
    marginVertical: 20,
  },
  signOutButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
