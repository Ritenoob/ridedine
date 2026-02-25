import type { SupabaseClient } from '@supabase/supabase-js';

export interface Favorite {
  id: string;
  user_id: string;
  favoritable_type: 'chef' | 'dish';
  favoritable_id: string;
  created_at: string;
}

export interface SavedAddress {
  id: string;
  user_id: string;
  label?: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  lat?: number;
  lng?: number;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export class FavoritesRepository {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Get all favorites for a user
   */
  async getUserFavorites(userId: string): Promise<Favorite[]> {
    const { data, error } = await this.supabase
      .from('favorites')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching favorites:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Add a favorite
   */
  async addFavorite(
    userId: string,
    favoritableType: 'chef' | 'dish',
    favoritableId: string
  ): Promise<{ data: Favorite | null; error: Error | null }> {
    const { data, error } = await this.supabase
      .from('favorites')
      .insert({
        user_id: userId,
        favoritable_type: favoritableType,
        favoritable_id: favoritableId,
      })
      .select()
      .single();

    if (error) {
      return { data: null, error: new Error(error.message) };
    }

    return { data, error: null };
  }

  /**
   * Remove a favorite
   */
  async removeFavorite(
    userId: string,
    favoritableType: 'chef' | 'dish',
    favoritableId: string
  ): Promise<{ success: boolean; error: Error | null }> {
    const { error } = await this.supabase
      .from('favorites')
      .delete()
      .eq('user_id', userId)
      .eq('favoritable_type', favoritableType)
      .eq('favoritable_id', favoritableId);

    if (error) {
      return { success: false, error: new Error(error.message) };
    }

    return { success: true, error: null };
  }

  /**
   * Check if an item is favorited by the user
   */
  async isFavorited(
    userId: string,
    favoritableType: 'chef' | 'dish',
    favoritableId: string
  ): Promise<boolean> {
    const { data, error } = await this.supabase
      .from('favorites')
      .select('id')
      .eq('user_id', userId)
      .eq('favoritable_type', favoritableType)
      .eq('favoritable_id', favoritableId)
      .single();

    if (error) {
      return false;
    }

    return !!data;
  }
}

export class SavedAddressesRepository {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Get all saved addresses for a user
   */
  async getUserAddresses(userId: string): Promise<SavedAddress[]> {
    const { data, error } = await this.supabase
      .from('saved_addresses')
      .select('*')
      .eq('user_id', userId)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching addresses:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Add a new saved address
   */
  async addAddress(
    userId: string,
    address: Omit<SavedAddress, 'id' | 'user_id' | 'created_at' | 'updated_at'>
  ): Promise<{ data: SavedAddress | null; error: Error | null }> {
    // If this is set as default, unset all other defaults first
    if (address.is_default) {
      await this.supabase
        .from('saved_addresses')
        .update({ is_default: false })
        .eq('user_id', userId);
    }

    const { data, error } = await this.supabase
      .from('saved_addresses')
      .insert({
        user_id: userId,
        ...address,
      })
      .select()
      .single();

    if (error) {
      return { data: null, error: new Error(error.message) };
    }

    return { data, error: null };
  }

  /**
   * Update a saved address
   */
  async updateAddress(
    addressId: string,
    updates: Partial<Omit<SavedAddress, 'id' | 'user_id' | 'created_at'>>
  ): Promise<{ data: SavedAddress | null; error: Error | null }> {
    // If setting as default, unset all other defaults first
    if (updates.is_default) {
      const { data: existingAddress } = await this.supabase
        .from('saved_addresses')
        .select('user_id')
        .eq('id', addressId)
        .single();

      if (existingAddress) {
        await this.supabase
          .from('saved_addresses')
          .update({ is_default: false })
          .eq('user_id', existingAddress.user_id);
      }
    }

    const { data, error } = await this.supabase
      .from('saved_addresses')
      .update(updates)
      .eq('id', addressId)
      .select()
      .single();

    if (error) {
      return { data: null, error: new Error(error.message) };
    }

    return { data, error: null };
  }

  /**
   * Delete a saved address
   */
  async deleteAddress(addressId: string): Promise<{ success: boolean; error: Error | null }> {
    const { error } = await this.supabase
      .from('saved_addresses')
      .delete()
      .eq('id', addressId);

    if (error) {
      return { success: false, error: new Error(error.message) };
    }

    return { success: true, error: null };
  }
}
