import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { GET } from './route';
import { createServerSupabaseClient } from '@/lib/supabase';
import { NextRequest } from 'next/server';

// Mock dependencies
jest.mock('@/lib/supabase', () => ({
  createServerSupabaseClient: jest.fn(),
}));

describe('GET /api/jobs/[id]', () => {
  const mockAgent = {
    id: '123e4567-e89b-12d3-a456-426614174001',
    handle: 'testagent',
    name: 'Test Agent',
    profile_image_url: 'https://example.com/avatar.jpg',
  };

  const mockUser = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    email: 'test@example.com',
  };

  const mockJob = {
    id: '123e4567-e89b-12d3-a456-426614174002',
    offer_id: '123e4567-e89b-12d3-a456-426614174003',
    seller_id: mockAgent.id,
    buyer_id: mockUser.id,
    status: 'created',
    started_at: null,
    delivered_at: null,
    completed_at: null,
    cancelled_at: null,
    created_at: '2024-03-21T00:00:00Z',
    updated_at: '2024-03-21T00:00:00Z',
    seller: mockAgent,
    buyer: {
      id: mockUser.id,
      email: mockUser.email,
    },
    offer: {
      id: '123e4567-e89b-12d3-a456-426614174003',
      amount: 100,
      currency: 'SOL',
      description: 'Test offer',
    },
  };

  const mockSupabase = {
    from: jest.fn(),
  } as any;

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

  beforeEach(() => {
    jest.clearAllMocks();
    (createServerSupabaseClient as any).mockReturnValue(mockSupabase);
  });

  it('should return job details', async () => {
    // Mock Supabase response
    mockSupabase.from.mockReturnValue({
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({ data: mockJob, error: null }),
        }),
      }),
    });

    const response = await GET(new NextRequest(`${API_URL}/jobs/${mockJob.id}`), {
      params: { id: mockJob.id },
    });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual(mockJob);
  });

  it('should return 404 for non-existent job', async () => {
    // Mock Supabase response for non-existent job
    mockSupabase.from.mockReturnValue({
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({
            data: null,
            error: { code: 'PGRST116', message: 'Not found' },
          }),
        }),
      }),
    });

    const response = await GET(new NextRequest(`${API_URL}/jobs/${mockJob.id}`), {
      params: { id: mockJob.id },
    });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Job not found');
  });

  it('should return 400 for invalid job ID', async () => {
    const response = await GET(new NextRequest(`${API_URL}/jobs/invalid-id`), {
      params: { id: 'invalid-id' },
    });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid job ID');
  });

  it('should return 500 for database error', async () => {
    // Mock database error
    mockSupabase.from.mockReturnValue({
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({
            data: null,
            error: new Error('Database error'),
          }),
        }),
      }),
    });

    const response = await GET(new NextRequest(`${API_URL}/jobs/${mockJob.id}`), {
      params: { id: mockJob.id },
    });
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to fetch job');
  });
}); 