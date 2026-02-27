import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Supabase client
const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockInsert = vi.fn();
const mockUpdate = vi.fn();
const mockDelete = vi.fn();
const mockSingle = vi.fn();
const mockOrder = vi.fn();
const mockGt = vi.fn();
const mockLte = vi.fn();
const mockGte = vi.fn();

type SupabaseQuery = {
  select: (...args: unknown[]) => SupabaseQuery;
  insert: (...args: unknown[]) => SupabaseQuery;
  update: (...args: unknown[]) => SupabaseQuery;
  delete: (...args: unknown[]) => SupabaseQuery;
  eq: (...args: unknown[]) => SupabaseQuery;
  single: (...args: unknown[]) => Promise<{ data: unknown; error: unknown }>;
  order: (...args: unknown[]) => Promise<{ data: unknown; error: unknown }>;
  gt: (...args: unknown[]) => SupabaseQuery;
  gte: (...args: unknown[]) => SupabaseQuery;
  lte: (...args: unknown[]) => SupabaseQuery;
  then: (resolve: (value: { data: unknown; error: unknown }) => void) => void;
};

const mockSupabase = {
  from: vi.fn(() => ({
    select: mockSelect,
    insert: mockInsert,
    update: mockUpdate,
    delete: mockDelete,
  })),
};

beforeEach(() => {
  vi.clearAllMocks();

  // Setup chain: select -> eq -> order -> resolved value
  mockOrder.mockResolvedValue({ data: null, error: null });
  mockGt.mockReturnValue({
    order: mockOrder,
  } as unknown as SupabaseQuery);
  mockLte.mockReturnValue({
    order: mockOrder,
  } as unknown as SupabaseQuery);
  mockGte.mockReturnValue({
    lte: mockLte,
    order: mockOrder,
  } as unknown as SupabaseQuery);
  mockEq.mockReturnValue({
    eq: mockEq,
    single: mockSingle,
    order: mockOrder,
    gt: mockGt,
    gte: mockGte,
  } as unknown as SupabaseQuery);
  mockSelect.mockReturnValue({
    eq: mockEq,
    order: mockOrder,
    single: mockSingle,
    gt: mockGt,
    gte: mockGte,
  } as unknown as SupabaseQuery);

  // Setup chain: insert -> select -> single -> resolved value
  mockSingle.mockResolvedValue({ data: null, error: null });
  mockInsert.mockReturnValue({
    select: mockSelect,
    then: (resolve: (value: { data: unknown; error: unknown }) => void) => resolve({ data: null, error: null }),
  } as unknown as SupabaseQuery);

  // Setup chain: update -> eq -> resolved value
  mockUpdate.mockReturnValue({ eq: mockEq } as unknown as SupabaseQuery);

  // Setup chain: delete -> eq -> resolved value
  mockDelete.mockReturnValue({ eq: mockEq } as unknown as SupabaseQuery);
});

describe('ReviewsRepository', () => {
  it('should have a method to get chef reviews', async () => {
    const ReviewsRepository = (await import('../reviews-repository')).ReviewsRepository;
    const repo = new ReviewsRepository(mockSupabase as unknown as ConstructorParameters<typeof ReviewsRepository>[0]);

    expect(repo.getChefReviews).toBeDefined();
    expect(typeof repo.getChefReviews).toBe('function');
  });

  it('should have a method to get order review', async () => {
    const ReviewsRepository = (await import('../reviews-repository')).ReviewsRepository;
    const repo = new ReviewsRepository(mockSupabase as unknown as ConstructorParameters<typeof ReviewsRepository>[0]);

    expect(repo.getOrderReview).toBeDefined();
    expect(typeof repo.getOrderReview).toBe('function');
  });

  it('should have a method to create review', async () => {
    const ReviewsRepository = (await import('../reviews-repository')).ReviewsRepository;
    const repo = new ReviewsRepository(mockSupabase as unknown as ConstructorParameters<typeof ReviewsRepository>[0]);

    expect(repo.createReview).toBeDefined();
    expect(typeof repo.createReview).toBe('function');
  });

  it('should have a method to update review', async () => {
    const ReviewsRepository = (await import('../reviews-repository')).ReviewsRepository;
    const repo = new ReviewsRepository(mockSupabase as unknown as ConstructorParameters<typeof ReviewsRepository>[0]);

    expect(repo.updateReview).toBeDefined();
    expect(typeof repo.updateReview).toBe('function');
  });

  it('should have a method to delete review', async () => {
    const ReviewsRepository = (await import('../reviews-repository')).ReviewsRepository;
    const repo = new ReviewsRepository(mockSupabase as unknown as ConstructorParameters<typeof ReviewsRepository>[0]);

    expect(repo.deleteReview).toBeDefined();
    expect(typeof repo.deleteReview).toBe('function');
  });

  it('should get chef reviews from database', async () => {
    const mockReviews = [
      {
        id: '1',
        customer_id: 'user-1',
        chef_id: 'chef-123',
        order_id: 'order-1',
        rating: 5,
        comment: 'Excellent!',
        created_at: '2024-01-01T00:00:00Z',
      },
      {
        id: '2',
        customer_id: 'user-2',
        chef_id: 'chef-123',
        order_id: 'order-2',
        rating: 4,
        comment: 'Very good',
        created_at: '2024-01-02T00:00:00Z',
      },
    ];

    mockOrder.mockResolvedValue({ data: mockReviews, error: null });

    const ReviewsRepository = (await import('../reviews-repository')).ReviewsRepository;
    const repo = new ReviewsRepository(mockSupabase as unknown as ConstructorParameters<typeof ReviewsRepository>[0]);

    const result = await repo.getChefReviews('chef-123');

    expect(mockSupabase.from).toHaveBeenCalledWith('reviews');
    expect(result).toEqual(mockReviews);
  });

  it('should get chef reviews with minimum rating filter', async () => {
    const mockReviews = [
      {
        id: '1',
        customer_id: 'user-1',
        chef_id: 'chef-123',
        order_id: 'order-1',
        rating: 5,
        comment: 'Excellent!',
        created_at: '2024-01-01T00:00:00Z',
      },
    ];

    mockOrder.mockResolvedValue({ data: mockReviews, error: null });

    const ReviewsRepository = (await import('../reviews-repository')).ReviewsRepository;
    const repo = new ReviewsRepository(mockSupabase as unknown as ConstructorParameters<typeof ReviewsRepository>[0]);

    const result = await repo.getChefReviews('chef-123', { minRating: 4 });

    expect(mockGte).toHaveBeenCalledWith('rating', 4);
    expect(result).toEqual(mockReviews);
  });

  it('should get order review', async () => {
    const mockReview = {
      id: '1',
      customer_id: 'user-1',
      chef_id: 'chef-123',
      order_id: 'order-1',
      rating: 5,
      comment: 'Excellent!',
      created_at: '2024-01-01T00:00:00Z',
    };

    mockSingle.mockResolvedValue({ data: mockReview, error: null });

    const ReviewsRepository = (await import('../reviews-repository')).ReviewsRepository;
    const repo = new ReviewsRepository(mockSupabase as unknown as ConstructorParameters<typeof ReviewsRepository>[0]);

    const result = await repo.getOrderReview('order-1');

    expect(mockSupabase.from).toHaveBeenCalledWith('reviews');
    expect(result).toEqual(mockReview);
  });

  it('should return null when order has no review', async () => {
    mockSingle.mockResolvedValue({ data: null, error: null });

    const ReviewsRepository = (await import('../reviews-repository')).ReviewsRepository;
    const repo = new ReviewsRepository(mockSupabase as unknown as ConstructorParameters<typeof ReviewsRepository>[0]);

    const result = await repo.getOrderReview('order-1');

    expect(result).toBeNull();
  });

  it('should create review', async () => {
    const mockReview = {
      id: '1',
      customer_id: 'user-1',
      chef_id: 'chef-123',
      order_id: 'order-1',
      rating: 5,
      comment: 'Excellent!',
      created_at: '2024-01-01T00:00:00Z',
    };

    mockSingle.mockResolvedValue({ data: mockReview, error: null });

    const ReviewsRepository = (await import('../reviews-repository')).ReviewsRepository;
    const repo = new ReviewsRepository(mockSupabase as unknown as ConstructorParameters<typeof ReviewsRepository>[0]);

    const result = await repo.createReview({
      customer_id: 'user-1',
      chef_id: 'chef-123',
      order_id: 'order-1',
      rating: 5,
      comment: 'Excellent!',
    });

    expect(mockSupabase.from).toHaveBeenCalledWith('reviews');
    expect(mockInsert).toHaveBeenCalledWith({
      customer_id: 'user-1',
      chef_id: 'chef-123',
      order_id: 'order-1',
      rating: 5,
      comment: 'Excellent!',
    });
    expect(result.data).toEqual(mockReview);
    expect(result.error).toBeNull();
  });

  it('should update review', async () => {
    const ReviewsRepository = (await import('../reviews-repository')).ReviewsRepository;
    const repo = new ReviewsRepository(mockSupabase as unknown as ConstructorParameters<typeof ReviewsRepository>[0]);

    mockEq.mockResolvedValue({ data: null, error: null });

    await repo.updateReview('review-1', {
      rating: 4,
      comment: 'Updated comment',
    });

    expect(mockSupabase.from).toHaveBeenCalledWith('reviews');
    expect(mockUpdate).toHaveBeenCalledWith({
      rating: 4,
      comment: 'Updated comment',
    });
    expect(mockEq).toHaveBeenCalledWith('id', 'review-1');
  });

  it('should delete review', async () => {
    const ReviewsRepository = (await import('../reviews-repository')).ReviewsRepository;
    const repo = new ReviewsRepository(mockSupabase as unknown as ConstructorParameters<typeof ReviewsRepository>[0]);

    mockEq.mockResolvedValue({ data: null, error: null });

    await repo.deleteReview('review-1');

    expect(mockSupabase.from).toHaveBeenCalledWith('reviews');
    expect(mockDelete).toHaveBeenCalled();
    expect(mockEq).toHaveBeenCalledWith('id', 'review-1');
  });
});
