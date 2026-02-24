import { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import type { Favorite, Chef, Dish } from '@home-chef/shared';

type FavoriteWithDetails = Favorite & {
  chef?: Chef;
  dish?: Dish;
};

export default function Favorites() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState<FavoriteWithDetails[]>([]);
  const [activeTab, setActiveTab] = useState<'chefs' | 'dishes'>('chefs');

  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        router.replace('/(auth)/signin');
        return;
      }

      const { data, error } = await supabase
        .from('favorites')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch related chefs and dishes
      const favoritesWithDetails: FavoriteWithDetails[] = [];
      for (const fav of data || []) {
        if (fav.favoritable_type === 'chef') {
          const { data: chef } = await supabase
            .from('chefs')
            .select('*')
            .eq('id', fav.favoritable_id)
            .single();
          favoritesWithDetails.push({ ...fav, chef });
        } else {
          const { data: dish } = await supabase
            .from('dishes')
            .select('*')
            .eq('id', fav.favoritable_id)
            .single();
          favoritesWithDetails.push({ ...fav, dish });
        }
      }

      setFavorites(favoritesWithDetails);
    } catch (error) {
      console.error('Error loading favorites:', error);
    } finally {
      setLoading(false);
    }
  };

  const removeFavorite = async (favoriteId: string) => {
    try {
      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('id', favoriteId);

      if (error) throw error;

      setFavorites((prev) => prev.filter((f) => f.id !== favoriteId));
    } catch (error) {
      console.error('Error removing favorite:', error);
    }
  };

  const chefFavorites = favorites.filter((f) => f.favoritable_type === 'chef');
  const dishFavorites = favorites.filter((f) => f.favoritable_type === 'dish');

  const renderChefCard = (favorite: FavoriteWithDetails) => {
    if (!favorite.chef) return null;

    return (
      <TouchableOpacity
        key={favorite.id}
        style={styles.card}
        onPress={() => router.push(`/(customer)/chefs/${favorite.chef?.id}`)}
      >
        {favorite.chef.photo_url ? (
          <Image
            source={{ uri: favorite.chef.photo_url }}
            style={styles.cardImage}
          />
        ) : (
          <View style={styles.cardImagePlaceholder}>
            <Ionicons name="person" size={40} color="#999" />
          </View>
        )}
        <View style={styles.cardContent}>
          <Text style={styles.cardTitle}>{favorite.chef.profile_id}</Text>
          {favorite.chef.cuisine_types && (
            <Text style={styles.cardSubtitle}>
              {favorite.chef.cuisine_types.join(', ')}
            </Text>
          )}
          {favorite.chef.bio && (
            <Text style={styles.cardDescription} numberOfLines={2}>
              {favorite.chef.bio}
            </Text>
          )}
        </View>
        <TouchableOpacity
          style={styles.heartButton}
          onPress={() => removeFavorite(favorite.id)}
        >
          <Ionicons name="heart" size={24} color="#FF3B30" />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  const renderDishCard = (favorite: FavoriteWithDetails) => {
    if (!favorite.dish) return null;

    return (
      <TouchableOpacity key={favorite.id} style={styles.card}>
        {favorite.dish.image_url ? (
          <Image
            source={{ uri: favorite.dish.image_url }}
            style={styles.cardImage}
          />
        ) : (
          <View style={styles.cardImagePlaceholder}>
            <Ionicons name="restaurant" size={40} color="#999" />
          </View>
        )}
        <View style={styles.cardContent}>
          <Text style={styles.cardTitle}>{favorite.dish.name}</Text>
          {favorite.dish.description && (
            <Text style={styles.cardDescription} numberOfLines={2}>
              {favorite.dish.description}
            </Text>
          )}
          <Text style={styles.cardPrice}>
            ${(favorite.dish.price_cents / 100).toFixed(2)}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.heartButton}
          onPress={() => removeFavorite(favorite.id)}
        >
          <Ionicons name="heart" size={24} color="#FF3B30" />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B35" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Favorites</Text>
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'chefs' && styles.activeTab]}
          onPress={() => setActiveTab('chefs')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'chefs' && styles.activeTabText,
            ]}
          >
            Chefs ({chefFavorites.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'dishes' && styles.activeTab]}
          onPress={() => setActiveTab('dishes')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'dishes' && styles.activeTabText,
            ]}
          >
            Dishes ({dishFavorites.length})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {activeTab === 'chefs' ? (
          chefFavorites.length > 0 ? (
            chefFavorites.map(renderChefCard)
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="heart-outline" size={64} color="#ccc" />
              <Text style={styles.emptyText}>No favorite chefs yet</Text>
              <Text style={styles.emptySubtext}>
                Browse chefs and tap the heart icon to save your favorites
              </Text>
            </View>
          )
        ) : dishFavorites.length > 0 ? (
          dishFavorites.map(renderDishCard)
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="heart-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No favorite dishes yet</Text>
            <Text style={styles.emptySubtext}>
              Browse dishes and tap the heart icon to save your favorites
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
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
  header: {
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tab: {
    flex: 1,
    paddingVertical: 15,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#FF6B35',
  },
  tabText: {
    fontSize: 16,
    color: '#666',
  },
  activeTabText: {
    color: '#FF6B35',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 15,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  cardImage: {
    width: 100,
    height: 100,
  },
  cardImagePlaceholder: {
    width: 100,
    height: 100,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardContent: {
    flex: 1,
    padding: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
  },
  cardPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF6B35',
    marginTop: 8,
  },
  heartButton: {
    padding: 12,
    justifyContent: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
});
