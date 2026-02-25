import { SupabaseClient } from '@supabase/supabase-js';
import type { Delivery } from '../../shared/src/types';
import { DeliveryStatus } from '../../shared/src/enums';

export class DeliveriesRepository {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Get a single delivery by ID
   */
  async getDelivery(deliveryId: string): Promise<Delivery> {
    const { data, error } = await this.supabase
      .from('deliveries')
      .select('*')
      .eq('id', deliveryId)
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Get deliveries for a specific driver
   */
  async getDriverDeliveries(
    driverId: string,
    statuses?: DeliveryStatus[]
  ): Promise<Delivery[]> {
    let query = this.supabase
      .from('deliveries')
      .select('*')
      .eq('driver_id', driverId)
      .order('created_at', { ascending: false });

    if (statuses && statuses.length > 0) {
      query = query.in('status', statuses);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  }

  /**
   * Get active delivery for a driver (any in-progress delivery)
   */
  async getActiveDelivery(driverId: string): Promise<Delivery | null> {
    const { data, error } = await this.supabase
      .from('deliveries')
      .select('*')
      .eq('driver_id', driverId)
      .in('status', [
        DeliveryStatus.ASSIGNED,
        DeliveryStatus.EN_ROUTE_TO_PICKUP,
        DeliveryStatus.ARRIVED_AT_PICKUP,
        DeliveryStatus.PICKED_UP,
        DeliveryStatus.EN_ROUTE_TO_DROPOFF,
        DeliveryStatus.ARRIVED_AT_DROPOFF,
      ])
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned - not an error, just no active delivery
        return null;
      }
      throw error;
    }

    return data;
  }

  /**
   * Get available deliveries (unassigned, ready for pickup)
   */
  async getAvailableDeliveries(limit: number = 20): Promise<Delivery[]> {
    const { data, error } = await this.supabase
      .from('deliveries')
      .select(`
        *,
        orders!inner(
          status
        )
      `)
      .is('driver_id', null)
      .eq('orders.status', 'ready')
      .order('created_at', { ascending: true })
      .limit(limit);

    if (error) throw error;
    return data || [];
  }

  /**
   * Assign delivery to a driver
   */
  async assignDelivery(
    deliveryId: string,
    driverId: string
  ): Promise<Delivery> {
    const { data, error } = await this.supabase
      .from('deliveries')
      .update({
        driver_id: driverId,
        status: DeliveryStatus.ASSIGNED,
      })
      .eq('id', deliveryId)
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Update delivery status
   */
  async updateDeliveryStatus(
    deliveryId: string,
    status: DeliveryStatus
  ): Promise<Delivery> {
    const { data, error } = await this.supabase
      .from('deliveries')
      .update({ status })
      .eq('id', deliveryId)
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Update driver location during active delivery
   */
  async updateDriverLocation(
    deliveryId: string,
    lat: number,
    lng: number
  ): Promise<Delivery> {
    const { data, error } = await this.supabase
      .from('deliveries')
      .update({
        driver_lat: lat,
        driver_lng: lng,
        driver_last_update: new Date().toISOString(),
      })
      .eq('id', deliveryId)
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Upload delivery proof photo
   */
  async uploadProofPhoto(
    deliveryId: string,
    proofUrl: string
  ): Promise<Delivery> {
    const { data, error } = await this.supabase
      .from('deliveries')
      .update({ proof_url: proofUrl })
      .eq('id', deliveryId)
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Get driver earnings within date range
   */
  async getDriverEarnings(
    driverId: string,
    startDate: string,
    endDate: string
  ): Promise<{
    total_cents: number;
    delivery_count: number;
    deliveries: Delivery[];
  }> {
    const { data, error } = await this.supabase
      .from('deliveries')
      .select('*')
      .eq('driver_id', driverId)
      .eq('status', DeliveryStatus.DELIVERED)
      .gte('created_at', startDate)
      .lt('created_at', endDate)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const deliveries = data || [];
    const total_cents = deliveries.reduce(
      (sum, d) => sum + (d.delivery_fee_cents || 0),
      0
    );

    return {
      total_cents,
      delivery_count: deliveries.length,
      deliveries,
    };
  }

  /**
   * Create a new delivery for an order
   */
  async createDelivery(
    orderId: string,
    pickupAddress: string,
    pickupLat: number,
    pickupLng: number,
    dropoffAddress: string,
    dropoffLat: number,
    dropoffLng: number,
    deliveryFeeCents: number = 500
  ): Promise<Delivery> {
    const { data, error } = await this.supabase
      .from('deliveries')
      .insert({
        order_id: orderId,
        status: DeliveryStatus.ASSIGNED,
        pickup_address: pickupAddress,
        pickup_lat: pickupLat,
        pickup_lng: pickupLng,
        dropoff_address: dropoffAddress,
        dropoff_lat: dropoffLat,
        dropoff_lng: dropoffLng,
        delivery_fee_cents: deliveryFeeCents,
      })
      .single();

    if (error) throw error;
    return data;
  }
}
