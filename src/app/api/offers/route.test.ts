import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { GET } from './route';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { NextRequest } from 'next/server';

// Mock dependencies
jest.mock('@/lib/supabase/server', () => ({
  createServerSupabaseClient: jest.fn(),
}));

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

describe('GET /api/offers', () => {
  const mockOffers = [
    {
      id: 'offer-1',
      seller_id: 'agent-1',
      buyer_id: 'user-1',
      amount: 100,
      currency: 'SOL',
      description: 'Test offer 1',
      status: 'created',
      created_at: '2024-03-21T00:00:00Z',
      seller: {
        id: 'agent-1',
        handle: 'testagent1',
        name: 'Test Agent 1',
        profile_image_url: 'https://example.com/avatar1.jpg',
      },
      buyer: {
        id: 'user-1',
        email: 'test1@example.com',
      },
      job: {
        id: 'job-1',
        status: 'created',
      },
    },
    {
      id: 'offer-2',
      seller_id: 'agent-2',
      buyer_id: 'user-2',
      amount: 200,
      currency: 'SOL',
      description: 'Test offer 2',
      status: 'funded',
      created_at: '2024-03-21T01:00:00Z',
      seller: {
        id: 'agent-2',
        handle: 'testagent2',
        name: 'Test Agent 2',
        profile_image_url: 'https://example.com/avatar2.jpg',
      },
      buyer: {
        id: 'user-2',
        email: 'test2@example.com',
      },
      job: {
        id: 'job-2',
        status: 'funded',
      },
    },
  ];

  const mockSupabase = {
    from: jest.fn(),
  } as any;

  beforeEach(() => {
    jest.clearAllMocks();
    (createServerSupabaseClient as any).mockResolvedValue(mockSupabase);
  });

  it('should return paginated offers with default parameters', async () => {
    // Mock Supabase response
    const mockQueryBuilder = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      range: jest.fn().mockReturnThis(),
      data: jest.fn().mockReturnThis(),
      error: jest.fn().mockReturnThis(),
      count: jest.fn().mockReturnThis(),
      single: jest.fn().mockReturnThis(),
      then: jest.fn().mockImplementation((callback: unknown) => {
        return Promise.resolve(callback({ data: mockOffers, error: null, count: mockOffers.length }));
      }),
    };
    mockSupabase.from.mockReturnValue(mockQueryBuilder);

    const request = new NextRequest(`${API_URL}/api/offers`);
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({
      offers: mockOffers,
      pagination: {
        total: 2,
        page: 1,
        limit: 10,
        total_pages: 1,
      },
    });
  });

  it('should apply filters correctly', async () => {
    // Mock Supabase response
    const mockQueryBuilder = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      range: jest.fn().mockReturnThis(),
      data: jest.fn().mockReturnThis(),
      error: jest.fn().mockReturnThis(),
      count: jest.fn().mockReturnThis(),
      single: jest.fn().mockReturnThis(),
      then: jest.fn().mockImplementation((callback: unknown) => {
        return Promise.resolve(callback({ data: [mockOffers[0]], error: null, count: 1 }));
      }),
    };
    mockSupabase.from.mockReturnValue(mockQueryBuilder);

    const request = new NextRequest(`${API_URL}/api/offers?status=created&seller_id=agent-1`);
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.offers).toHaveLength(1);
    expect(data.offers[0].status).toBe('created');
    expect(data.offers[0].seller_id).toBe('agent-1');
  });

  it('should handle invalid query parameters', async () => {
    const request = new NextRequest(`${API_URL}/api/offers?page=0&limit=1000`);
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid query parameters');
  });

  it('should handle database errors', async () => {
    // Mock Supabase error
    const mockQueryBuilder = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      range: jest.fn().mockReturnThis(),
      data: jest.fn().mockReturnThis(),
      error: jest.fn().mockReturnThis(),
      count: jest.fn().mockReturnThis(),
      single: jest.fn().mockReturnThis(),
      then: jest.fn().mockImplementation((callback: unknown) => {
        return Promise.resolve(callback({ data: null, error: new Error('Database error'), count: null }));
      }),
    };
    mockSupabase.from.mockReturnValue(mockQueryBuilder);

    const request = new NextRequest(`${API_URL}/api/offers`);
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to fetch offers');
  });

  it('should sort offers by amount in descending order', async () => {
    // Mock Supabase response
    const mockQueryBuilder = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      range: jest.fn().mockReturnThis(),
      data: jest.fn().mockReturnThis(),
      error: jest.fn().mockReturnThis(),
      count: jest.fn().mockReturnThis(),
      single: jest.fn().mockReturnThis(),
      then: jest.fn().mockImplementation((callback: unknown) => {
        return Promise.resolve(callback({ data: [...mockOffers].sort((a, b) => b.amount - a.amount), error: null, count: 2 }));
      }),
    };
    mockSupabase.from.mockReturnValue(mockQueryBuilder);

    const request = new NextRequest(`${API_URL}/api/offers?sort_by=amount&sort_order=desc`);
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.offers[0].amount).toBeGreaterThan(data.offers[1].amount);
  });

  it('should return an empty array when no offers are found', async () => {
    // Mock Supabase response for no offers
    const mockQueryBuilder = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      range: jest.fn().mockReturnThis(),
      data: jest.fn().mockReturnThis(),
      error: jest.fn().mockReturnThis(),
      count: jest.fn().mockReturnThis(),
      single: jest.fn().mockReturnThis(),
      then: jest.fn().mockImplementation((callback: unknown) => {
        return Promise.resolve((callback as (arg: any) => any)({ data: [], error: null, count: 0 }));
      }),
    };
    mockSupabase.from.mockReturnValue(mockQueryBuilder);

    const request = new NextRequest(`${API_URL}/api/offers?status=nonexistent`);
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.offers).toEqual([]);
    expect(data.pagination.total).toBe(0);
    expect(data.pagination.total_pages).toBe(0);
  });
}); 