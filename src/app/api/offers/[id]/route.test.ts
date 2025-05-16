import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { GET } from './route';
import { createServerSupabaseClient } from '@/lib/supabase/server';

// Mock dependencies
jest.mock('@/lib/supabase/server', () => ({
  createServerSupabaseClient: jest.fn(),
}));

describe('GET /api/offers/[id]', () => {
  const mockUser = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    email: 'test@example.com',
  };

  const mockAgent = {
    id: '123e4567-e89b-12d3-a456-426614174001',
    user_id: '123e4567-e89b-12d3-a456-426614174002',
    handle: 'testagent',
    name: 'Test Agent',
    bio: 'Test bio',
    profile_image_url: 'https://example.com/avatar.jpg',
  };

  const mockOffer = {
    id: '123e4567-e89b-12d3-a456-426614174003',
    seller_id: mockAgent.id,
    buyer_id: mockUser.id,
    amount: 100,
    currency: 'SOL',
    description: 'Test offer',
    status: 'created',
    created_at: '2024-03-21T00:00:00Z',
    updated_at: '2024-03-21T00:00:00Z',
    seller: mockAgent,
    buyer: {
      id: mockUser.id,
      email: mockUser.email,
    },
    job: {
      id: '123e4567-e89b-12d3-a456-426614174004',
      status: 'created',
      started_at: null,
      delivered_at: null,
      completed_at: null,
      cancelled_at: null,
    },
  };

  const mockSupabase = {
    auth: {
      getUser: jest.fn(),
    },
    from: jest.fn(),
  } as any;

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

  beforeEach(() => {
    jest.clearAllMocks();
    (createServerSupabaseClient as any).mockReturnValue(mockSupabase);
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null });
  });

  it('should return offer details for authorized user', async () => {
    // Mock Supabase response
    mockSupabase.from.mockReturnValue({
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({ data: mockOffer, error: null }),
        }),
      }),
    });

    const response = await GET(new Request(`${API_URL}/offers/${mockOffer.id}`), {
      params: { id: mockOffer.id },
    });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual(mockOffer);
  });

  it('should return 404 for non-existent offer', async () => {
    // Mock Supabase response for non-existent offer
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

    const response = await GET(new Request(`${API_URL}/offers/${mockOffer.id}`), {
      params: { id: mockOffer.id },
    });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Offer not found');
  });

  it('should return 401 for unauthenticated user', async () => {
    // Mock unauthenticated user
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: null });

    const response = await GET(new Request(`${API_URL}/offers/${mockOffer.id}`), {
      params: { id: mockOffer.id },
    });
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('should return 403 for unauthorized user', async () => {
    // Mock unauthorized user
    const unauthorizedUser = { 
      id: '123e4567-e89b-12d3-a456-426614174005',
      email: 'unauthorized@example.com' 
    };
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: unauthorizedUser }, error: null });

    // Mock Supabase response
    mockSupabase.from.mockReturnValue({
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({ data: mockOffer, error: null }),
        }),
      }),
    });

    const response = await GET(new Request(`${API_URL}/offers/${mockOffer.id}`), {
      params: { id: mockOffer.id },
    });
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toBe('Forbidden');
  });

  it('should return 400 for invalid offer ID', async () => {
    const response = await GET(new Request(`${API_URL}/offers/invalid-id`), {
      params: { id: 'invalid-id' },
    });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid offer ID');
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

    const response = await GET(new Request(`${API_URL}/offers/${mockOffer.id}`), {
      params: { id: mockOffer.id },
    });
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to fetch offer');
  });
}); 