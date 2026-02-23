import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DeliveriesRepository } from '../deliveries-repository';
import { DeliveryStatus } from '../../../shared/src/enums';

// Mock Supabase client
const mockSupabase = {
  from: vi.fn(() => mockSupabase),
  select: vi.fn(() => mockSupabase),
  insert: vi.fn(() => mockSupabase),
  update: vi.fn(() => mockSupabase),
  eq: vi.fn(() => mockSupabase),
  single: vi.fn(() => Promise.resolve({ data: null, error: null })),
  order: vi.fn(() => mockSupabase),
  in: vi.fn(() => mockSupabase),
  gte: vi.fn(() => mockSupabase),
  lt: vi.fn(() => mockSupabase),
};

describe('DeliveriesRepository', () => {
  let repository: DeliveriesRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    repository = new DeliveriesRepository(mockSupabase as any);
  });

  describe('getDelivery', () => {
    it('should fetch a single delivery by ID', async () => {
      const mockDelivery = {
        id: 'delivery-1',
        order_id: 'order-1',
        driver_id: 'driver-1',
        status: DeliveryStatus.ASSIGNED,
      };

      mockSupabase.single.mockResolvedValueOnce({
        data: mockDelivery,
        error: null,
      });

      const result = await repository.getDelivery('delivery-1');

      expect(mockSupabase.from).toHaveBeenCalledWith('deliveries');
      expect(mockSupabase.select).toHaveBeenCalledWith('*');
      expect(mockSupabase.eq).toHaveBeenCalledWith('id', 'delivery-1');
      expect(result).toEqual(mockDelivery);
    });

    it('should throw error if delivery not found', async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: { message: 'Not found' },
      });

      await expect(repository.getDelivery('invalid-id')).rejects.toThrow();
    });
  });

  describe('getDriverDeliveries', () => {
    it('should fetch deliveries for a driver', async () => {
      const mockDeliveries = [
        { id: 'delivery-1', driver_id: 'driver-1', status: DeliveryStatus.ASSIGNED },
        { id: 'delivery-2', driver_id: 'driver-1', status: DeliveryStatus.PICKED_UP },
      ];

      mockSupabase.single.mockResolvedValueOnce({
        data: mockDeliveries,
        error: null,
      });

      const result = await repository.getDriverDeliveries('driver-1');

      expect(mockSupabase.from).toHaveBeenCalledWith('deliveries');
      expect(mockSupabase.eq).toHaveBeenCalledWith('driver_id', 'driver-1');
    });

    it('should filter by status if provided', async () => {
      await repository.getDriverDeliveries('driver-1', [DeliveryStatus.ASSIGNED, DeliveryStatus.PICKED_UP]);

      expect(mockSupabase.in).toHaveBeenCalledWith('status', [DeliveryStatus.ASSIGNED, DeliveryStatus.PICKED_UP]);
    });
  });

  describe('getActiveDelivery', () => {
    it('should fetch active delivery for a driver', async () => {
      const mockDelivery = {
        id: 'delivery-1',
        driver_id: 'driver-1',
        status: DeliveryStatus.PICKED_UP,
      };

      mockSupabase.single.mockResolvedValueOnce({
        data: mockDelivery,
        error: null,
      });

      const result = await repository.getActiveDelivery('driver-1');

      expect(mockSupabase.from).toHaveBeenCalledWith('deliveries');
      expect(mockSupabase.eq).toHaveBeenCalledWith('driver_id', 'driver-1');
      expect(mockSupabase.in).toHaveBeenCalledWith('status', [
        DeliveryStatus.ASSIGNED,
        DeliveryStatus.EN_ROUTE_TO_PICKUP,
        DeliveryStatus.ARRIVED_AT_PICKUP,
        DeliveryStatus.PICKED_UP,
        DeliveryStatus.EN_ROUTE_TO_DROPOFF,
        DeliveryStatus.ARRIVED_AT_DROPOFF,
      ]);
    });

    it('should return null if no active delivery', async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: null,
      });

      const result = await repository.getActiveDelivery('driver-1');

      expect(result).toBeNull();
    });
  });

  describe('updateDeliveryStatus', () => {
    it('should update delivery status', async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: { id: 'delivery-1', status: DeliveryStatus.PICKED_UP },
        error: null,
      });

      const result = await repository.updateDeliveryStatus('delivery-1', DeliveryStatus.PICKED_UP);

      expect(mockSupabase.from).toHaveBeenCalledWith('deliveries');
      expect(mockSupabase.update).toHaveBeenCalledWith({ status: DeliveryStatus.PICKED_UP });
      expect(mockSupabase.eq).toHaveBeenCalledWith('id', 'delivery-1');
      expect(result).toHaveProperty('status', DeliveryStatus.PICKED_UP);
    });
  });

  describe('updateDriverLocation', () => {
    it('should update driver location in delivery', async () => {
      const lat = 40.7128;
      const lng = -74.0060;

      mockSupabase.single.mockResolvedValueOnce({
        data: { id: 'delivery-1', driver_lat: lat, driver_lng: lng },
        error: null,
      });

      const result = await repository.updateDriverLocation('delivery-1', lat, lng);

      expect(mockSupabase.from).toHaveBeenCalledWith('deliveries');
      expect(mockSupabase.update).toHaveBeenCalledWith(
        expect.objectContaining({
          driver_lat: lat,
          driver_lng: lng,
        })
      );
      expect(result).toHaveProperty('driver_lat', lat);
      expect(result).toHaveProperty('driver_lng', lng);
    });
  });

  describe('getDriverEarnings', () => {
    it('should calculate driver earnings within date range', async () => {
      const mockDeliveries = [
        { delivery_fee_cents: 500, status: DeliveryStatus.DELIVERED },
        { delivery_fee_cents: 750, status: DeliveryStatus.DELIVERED },
        { delivery_fee_cents: 600, status: DeliveryStatus.DELIVERED },
      ];

      mockSupabase.single.mockResolvedValueOnce({
        data: mockDeliveries,
        error: null,
      });

      const startDate = '2026-02-01';
      const endDate = '2026-02-28';
      const result = await repository.getDriverEarnings('driver-1', startDate, endDate);

      expect(mockSupabase.from).toHaveBeenCalledWith('deliveries');
      expect(mockSupabase.eq).toHaveBeenCalledWith('driver_id', 'driver-1');
      expect(mockSupabase.eq).toHaveBeenCalledWith('status', DeliveryStatus.DELIVERED);
      expect(mockSupabase.gte).toHaveBeenCalledWith('created_at', startDate);
      expect(mockSupabase.lt).toHaveBeenCalledWith('created_at', endDate);
    });
  });

  describe('uploadProofPhoto', () => {
    it('should update delivery with proof URL', async () => {
      const proofUrl = 'https://storage.example.com/proof.jpg';

      mockSupabase.single.mockResolvedValueOnce({
        data: { id: 'delivery-1', proof_url: proofUrl },
        error: null,
      });

      const result = await repository.uploadProofPhoto('delivery-1', proofUrl);

      expect(mockSupabase.from).toHaveBeenCalledWith('deliveries');
      expect(mockSupabase.update).toHaveBeenCalledWith({ proof_url: proofUrl });
      expect(result).toHaveProperty('proof_url', proofUrl);
    });
  });
});
