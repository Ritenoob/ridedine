import type { SupabaseClient } from '@supabase/supabase-js';
import type { Review } from '@home-chef/shared';

export interface CreateReviewInput {
  customer_id: string;
  chef_id: string;
  order_id: string;
  rating: number;
  comment?: string;
}

export interface UpdateReviewInput {
  rating?: number;
  comment?: string;
}

export interface GetReviewsOptions {
  minRating?: number;
  maxRating?: number;
  limit?: number;
}

export class ReviewsRepository {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Get all reviews for a chef
   */
  async getChefReviews(
    chefId: string,
    options?: GetReviewsOptions
  ): Promise<Review[]> {
    let query = this.supabase
      .from('reviews')
      .select('*')
      .eq('chef_id', chefId);

    if (options?.minRating) {
      query = query.gte('rating', options.minRating);
    }

    if (options?.maxRating) {
      query = query.lte('rating', options.maxRating);
    }

    query = query.order('created_at', { ascending: false });

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching chef reviews:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Get review for a specific order
   */
  async getOrderReview(orderId: string): Promise<Review | null> {
    const { data, error } = await this.supabase
      .from('reviews')
      .select('*')
      .eq('order_id', orderId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned
        return null;
      }
      console.error('Error fetching order review:', error);
      return null;
    }

    return data;
  }

  /**
   * Create a new review
   */
  async createReview(
    input: CreateReviewInput
  ): Promise<{ data: Review | null; error: Error | null }> {
    const { data, error } = await this.supabase
      .from('reviews')
      .insert({
        customer_id: input.customer_id,
        chef_id: input.chef_id,
        order_id: input.order_id,
        rating: input.rating,
        comment: input.comment,
      })
      .select()
      .single();

    if (error) {
      return { data: null, error: new Error(error.message) };
    }

    return { data, error: null };
  }

  /**
   * Update an existing review
   */
  async updateReview(
    reviewId: string,
    updates: UpdateReviewInput
  ): Promise<{ success: boolean; error: Error | null }> {
    const { error } = await this.supabase
      .from('reviews')
      .update(updates)
      .eq('id', reviewId);

    if (error) {
      return { success: false, error: new Error(error.message) };
    }

    return { success: true, error: null };
  }

  /**
   * Delete a review
   */
  async deleteReview(
    reviewId: string
  ): Promise<{ success: boolean; error: Error | null }> {
    const { error } = await this.supabase
      .from('reviews')
      .delete()
      .eq('id', reviewId);

    if (error) {
      return { success: false, error: new Error(error.message) };
    }

    return { success: true, error: null };
  }
}
