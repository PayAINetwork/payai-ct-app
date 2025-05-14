import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { GET } from './route';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { NextRequest } from 'next/server';

// Mock dependencies
jest.mock('@/lib/supabase/server', () => ({
  createServerSupabaseClient: jest.fn(),
}));

describe('GET /api/jobs', () => {
  const mockJobs = [
    {
      id: '123e4567-e89b-12d3-a456-426614174001',
      offer_id: '123e4567-e89b-12d3-a456-426614174002',
      seller_id: '123e4567-e89b-12d3-a456-426614174003',
      buyer_id: '123e4567-e89b-12d3-a456-426614174004',
      status: 'created',
      started_at: null,
      delivered_at: null,
      completed_at: null,
      cancelled_at: null,
      created_at: '2024-03-21T00:00:00Z',
      updated_at: '2024-03-21T00:00:00Z',
      seller: {
        id: '123e4567-e89b-12d3-a456-426614174003',
        handle: 'testagent1',
        name: 'Test Agent 1',
        profile_image_url: 'https://example.com/avatar1.jpg',
      },
      buyer: {
        id: '123e4567-e89b-12d3-a456-426614174004',
        email: 'test1@example.com',
      },
      offer: {
        id: '123e4567-e89b-12d3-a456-426614174002',
        amount: 100,
        currency: 'SOL',
        description: 'Test offer 1',
      },
    },
    {
      id: '123e4567-e89b-12d3-a456-426614174005',
      offer_id: '123e4567-e89b-12d3-a456-426614174006',
      seller_id: '123e4567-e89b-12d3-a456-426614174007',
      buyer_id: '123e4567-e89b-12d3-a456-426614174008',
      status: 'funded',
      started_at: null,
      delivered_at: null,
      completed_at: null,
      cancelled_at: null,
      created_at: '2024-03-21T01:00:00Z',
      updated_at: '2024-03-21T01:00:00Z',
      seller: {
        id: '123e4567-e89b-12d3-a456-426614174007',
        handle: 'testagent2',
        name: 'Test Agent 2',
        profile_image_url: 'https://example.com/avatar2.jpg',
      },
      buyer: {
        id: '123e4567-e89b-12d3-a456-426614174008',
        email: 'test2@example.com',
      },
      offer: {
        id: '123e4567-e89b-12d3-a456-426614174006',
        amount: 200,
        currency: 'SOL',
        description: 'Test offer 2',
      },
    },
  ];

  const mockSupabase = {
    from: jest.fn(),
  } as any;

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

  beforeEach(() => {
    jest.clearAllMocks();
    (createServerSupabaseClient as any).mockReturnValue(mockSupabase);
  });

  it('should return paginated jobs with default parameters', async () => {
    // Mock Supabase response
    const mockSelect = jest.fn().mockReturnThis();
    const mockOrder = jest.fn().mockReturnThis();
    const mockRange = jest.fn().mockResolvedValue({
      data: mockJobs,
      error: null,
      count: 2,
    } as any);

    mockSupabase.from.mockReturnValue({
      select: mockSelect,
      order: mockOrder,
      range: mockRange,
    });

    const response = await GET(new NextRequest(`${API_URL}/jobs`));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({
      jobs: mockJobs,
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
    const mockSelect = jest.fn().mockReturnThis();
    const mockEq = jest.fn().mockReturnThis();
    const mockOrder = jest.fn().mockReturnThis();
    const mockRange = jest.fn().mockResolvedValue({
      data: [mockJobs[0]],
      error: null,
      count: 1,
    } as any);

    mockSupabase.from.mockReturnValue({
      select: mockSelect,
      eq: mockEq,
      order: mockOrder,
      range: mockRange,
    });

    const response = await GET(
      new NextRequest(`${API_URL}/jobs?status=created&seller_id=${mockJobs[0].seller_id}`)
    );
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.jobs).toHaveLength(1);
    expect(data.jobs[0].id).toBe(mockJobs[0].id);
  });

  it('should handle invalid query parameters', async () => {
    const response = await GET(
      new NextRequest(`${API_URL}/jobs?page=0&limit=1000&sort_by=invalid`)
    );
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid query parameters');
  });

  it('should handle database errors', async () => {
    // Mock database error
    const mockSelect = jest.fn().mockReturnThis();
    const mockOrder = jest.fn().mockReturnThis();
    const mockRange = jest.fn().mockResolvedValue({
      data: null,
      error: new Error('Database error'),
      count: 0,
    } as any);

    mockSupabase.from.mockReturnValue({
      select: mockSelect,
      order: mockOrder,
      range: mockRange,
    });

    const response = await GET(new NextRequest(`${API_URL}/jobs`));
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to fetch jobs');
  });
}); 