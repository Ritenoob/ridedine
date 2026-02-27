import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';

export default function ReviewScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const orderId = params.orderId as string;
  const chefId = params.chefId as string;

  const [loading, setLoading] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [chefName, setChefName] = useState('');

  useEffect(() => {
    loadChef();
  }, []);

  const loadChef = async () => {
    const { data } = await supabase
      .from('chefs')
      .select('profiles(name)')
      .eq('id', chefId)
      .single();

    if (data) {
      const profiles = data.profiles as { name?: string | null } | null;
      setChefName(profiles?.name || 'Chef');
    }
  };

  const submitReview = async () => {
    if (rating === 0) {
      Alert.alert('Error', 'Please select a rating');
      return;
    }

    setLoading(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        Alert.alert('Error', 'You must be logged in to leave a review');
        router.replace('/(auth)/signin');
        return;
      }

      const { error } = await supabase.from('reviews').insert({
        customer_id: session.user.id,
        chef_id: chefId,
        order_id: orderId,
        rating,
        comment: comment.trim() || null,
      });

      if (error) {
        if (error.code === '23505') {
          // Unique constraint violation
          Alert.alert('Error', 'You have already reviewed this order');
        } else {
          throw error;
        }
      } else {
        Alert.alert('Success', 'Review submitted successfully', [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]);
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      Alert.alert('Error', 'Failed to submit review');
    } finally {
      setLoading(false);
    }
  };

  const renderStar = (star: number) => {
    const filled = star <= (hoverRating || rating);
    return (
      <TouchableOpacity
        key={star}
        onPress={() => setRating(star)}
        onPressIn={() => setHoverRating(star)}
        onPressOut={() => setHoverRating(0)}
        style={styles.starButton}
      >
        <Ionicons
          name={filled ? 'star' : 'star-outline'}
          size={48}
          color={filled ? '#FFB800' : '#E0E0E0'}
        />
      </TouchableOpacity>
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>Leave a Review</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.chefName}>
          How was your experience with {chefName}?
        </Text>

        <View style={styles.ratingSection}>
          <Text style={styles.label}>Rating</Text>
          <View style={styles.starsContainer}>{[1, 2, 3, 4, 5].map(renderStar)}</View>
          {rating > 0 && (
            <Text style={styles.ratingText}>
              {rating === 1
                ? 'Poor'
                : rating === 2
                ? 'Fair'
                : rating === 3
                ? 'Good'
                : rating === 4
                ? 'Very Good'
                : 'Excellent'}
            </Text>
          )}
        </View>

        <View style={styles.commentSection}>
          <Text style={styles.label}>Comment (Optional)</Text>
          <TextInput
            style={styles.textArea}
            placeholder="Tell us more about your experience..."
            value={comment}
            onChangeText={setComment}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
          />
        </View>

        <TouchableOpacity
          style={[
            styles.submitButton,
            (rating === 0 || loading) && styles.submitButtonDisabled,
          ]}
          onPress={submitReview}
          disabled={rating === 0 || loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.submitButtonText}>Submit Review</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    marginRight: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
  },
  content: {
    padding: 20,
  },
  chefName: {
    fontSize: 18,
    fontWeight: '500',
    marginBottom: 32,
    textAlign: 'center',
    color: '#333',
  },
  ratingSection: {
    alignItems: 'center',
    marginBottom: 32,
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 12,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
    color: '#333',
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  starButton: {
    padding: 4,
  },
  ratingText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF6B35',
    marginTop: 12,
  },
  commentSection: {
    marginBottom: 32,
  },
  textArea: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    minHeight: 120,
  },
  submitButton: {
    backgroundColor: '#FF6B35',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
});
