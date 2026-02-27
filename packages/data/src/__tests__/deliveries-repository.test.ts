import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DeliveriesRepository } from '../deliveries-repository';
import { DeliveryStatus } from '../../../shared/src/enums';

let queryResult: { data: unknown; error: unknown } = { data: null, error: null };
const setQueryResult = (data: unknown, error: unknown = null) => {
  queryResult = { data, error };
};

type QueryResult = { data: unknown; error: unknown };
type PromiseLikeQuery = {
  then: (resolve: (value: QueryResult) => void, reject: (reason?: unknown) => void) => Promise<void>;
  [Symbol.toStringTag]: string;
};

type SupabaseQuery = PromiseLikeQuery & {
  from: (...args: unknown[]) => SupabaseQuery;
  select: (...args: unknown[]) => SupabaseQuery;
  insert: (...args: unknown[]) => SupabaseQuery;
  update: (...args: unknown[]) => SupabaseQuery;
  eq: (...args: unknown[]) => SupabaseQuery;
  in: (...args: unknown[]) => SupabaseQuery;
  order: (...args: unknown[]) => SupabaseQuery;
  limit: (...args: unknown[]) => SupabaseQuery;
  gte: (...args: unknown[]) => SupabaseQuery;
  lt: (...args: unknown[]) => SupabaseQuery;
  maybeSingle: ReturnType<typeof vi.fn>;
  single: ReturnType<typeof vi.fn>;
};

const mockSupabase: SupabaseQuery = {
  // Make it behave like a Promise (Supabase builder is PromiseLike)
  then: (resolve, reject) => Promise.resolve(queryResult as QueryResult).then(resolve, reject),
  [Symbol.toStringTag]: 'Promise',

  from: vi.fn(() => mockSupabase) as SupabaseQuery['from'],
  select: vi.fn(() => mockSupabase) as SupabaseQuery['select'],
  insert: vi.fn(() => mockSupabase) as SupabaseQuery['insert'],
  update: vi.fn(() => mockSupabase) as SupabaseQuery['update'],
  eq: vi.fn(() => mockSupabase) as SupabaseQuery['eq'],
  in: vi.fn(() => mockSupabase) as SupabaseQuery['in'],
  order: vi.fn(() => mockSupabase) as SupabaseQuery['order'],
  limit: vi.fn(() => mockSupabase) as SupabaseQuery['limit'],
  gte: vi.fn(() => mockSupabase) as SupabaseQuery['gte'],
  lt: vi.fn(() => mockSupabase) as SupabaseQuery['lt'],

  // Supabase variants (harmless if unused)
  maybeSingle: vi.fn(() => Promise.resolve(queryResult)) as SupabaseQuery['maybeSingle'],

  // Default: return current queryResult unless test overrides with mockResolvedValueOnce
  single: vi.fn(() => Promise.resolve(queryResult)) as SupabaseQuery['single'],
};

describe('DeliveriesRepository', () => {
  let repository: DeliveriesRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    setQueryResult(null, null);
    repository = new DeliveriesRepository(mockSupabase as unknown as ConstructorParameters<typeof DeliveriesRepository>[0]);
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

      setQueryResult(mockDeliveries, null);

      const result = await repository.getDriverDeliveries('driver-1');

      expect(mockSupabase.from).toHaveBeenCalledWith('deliveries');
      expect(mockSupabase.eq).toHaveBeenCalledWith('driver_id', 'driver-1');
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(2);
    });

    it('should filter by status if provided', async () => {
      setQueryResult([], null);

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
      expect(mockSupabase.limit).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockDelivery);
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

      setQueryResult(mockDeliveries, null);

      const startDate = '2026-02-01';
      const endDate = '2026-02-28';
      const result = await repository.getDriverEarnings('driver-1', startDate, endDate);

      expect(mockSupabase.from).toHaveBeenCalledWith('deliveries');
      expect(mockSupabase.eq).toHaveBeenCalledWith('driver_id', 'driver-1');
      expect(mockSupabase.eq).toHaveBeenCalledWith('status', DeliveryStatus.DELIVERED);
      expect(mockSupabase.gte).toHaveBeenCalledWith('created_at', startDate);
      expect(mockSupabase.lt).toHaveBeenCalledWith('created_at', endDate);

      expect(result.total_cents).toBe(1850);
      expect(result.delivery_count).toBe(3);
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
