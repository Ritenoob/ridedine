import { View, Text, FlatList, StyleSheet } from 'react-native';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function Browse() {
  const [chefs, setChefs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadChefs();
  }, []);

  const loadChefs = async () => {
    const { data } = await supabase
      .from('chefs')
      .select('*, profiles(*)')
      .eq('status', 'approved');
    
    setChefs(data || []);
    setLoading(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Browse Chefs</Text>
      {loading ? (
        <Text>Loading...</Text>
      ) : (
        <FlatList
          data={chefs}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.chefCard}>
              <Text style={styles.chefName}>{item.profiles?.name}</Text>
              <Text>{item.bio}</Text>
              <Text>{item.cuisine_types?.join(', ')}</Text>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  chefCard: {
    padding: 15,
    marginBottom: 10,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  chefName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 5,
  },
});
