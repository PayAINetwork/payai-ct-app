import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { POST } from './route';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { NextRequest } from 'next/server';

// Mock dependencies
jest.mock('@/lib/supabase/server', () => ({
  createServerSupabaseClient: jest.fn(),
}));

describe('POST /api/tokens/[id]/revoke', () => {
  const mockUser = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    email: 'test@example.com',
  };

  const mockToken = {
    id: '123e4567-e89b-12d3-a456-426614174001',
    user_id: mockUser.id,
    name: 'Test Token',
    created_at: '2024-03-21T00:00:00Z',
    expires_at: '2024-04-21T00:00:00Z',
    revoked_at: null,
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
    // Default mock for from: always provide select and update with full chains
    mockSupabase.from.mockReturnValue({
      select: () => ({
        eq: () => ({
          is: () => ({
            single: () => Promise.resolve({ data: mockToken, error: null }),
          }),
        }),
      }),
      update: () => ({
        eq: () => ({
          eq: () => Promise.resolve({ data: null, error: null }),
        }),
      }),
    });
  });

  it('should revoke a token', async () => {
    // Override for success
    mockSupabase.from.mockReturnValue({
      select: () => ({
        eq: () => ({
          is: () => ({
            single: () => Promise.resolve({ data: mockToken, error: null }),
          }),
        }),
      }),
      update: () => ({
        eq: () => ({
          eq: () => Promise.resolve({ data: null, error: null }),
        }),
      }),
    });

    const request = new NextRequest(`${API_URL}/tokens/${mockToken.id}/revoke`, {
      method: 'POST',
    });

    const response = await POST(request, { params: { id: mockToken.id } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({ success: true });
  });

  it('should return 401 for unauthenticated user', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: null });
    // Use default mock

    const request = new NextRequest(`${API_URL}/tokens/${mockToken.id}/revoke`, {
      method: 'POST',
    });

    const response = await POST(request, { params: { id: mockToken.id } });
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('should return 404 for non-existent token', async () => {
    mockSupabase.from.mockReturnValue({
      select: () => ({
        eq: () => ({
          is: () => ({
            single: () => Promise.resolve({ data: null, error: null }),
          }),
        }),
      }),
      update: () => ({
        eq: () => ({
          eq: () => Promise.resolve({ data: null, error: null }),
        }),
      }),
    });

    const request = new NextRequest(`${API_URL}/tokens/${mockToken.id}/revoke`, {
      method: 'POST',
    });

    const response = await POST(request, { params: { id: mockToken.id } });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Token not found or already revoked');
  });

  it('should return 403 for token owned by another user', async () => {
    const otherUserToken = {
      ...mockToken,
      user_id: '123e4567-e89b-12d3-a456-426614174999',
    };
    mockSupabase.from.mockReturnValue({
      select: () => ({
        eq: () => ({
          is: () => ({
            single: () => Promise.resolve({ data: otherUserToken, error: null }),
          }),
        }),
      }),
      update: () => ({
        eq: () => ({
          eq: () => Promise.resolve({ data: null, error: null }),
        }),
      }),
    });

    const request = new NextRequest(`${API_URL}/tokens/${mockToken.id}/revoke`, {
      method: 'POST',
    });

    const response = await POST(request, { params: { id: mockToken.id } });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Token not found or already revoked');
  });

  it('should return 500 for database error', async () => {
    mockSupabase.from.mockReturnValue({
      select: () => ({
        eq: () => ({
          is: () => ({
            single: () => Promise.resolve({ data: null, error: new Error('Database error') }),
          }),
        }),
      }),
      update: () => ({
        eq: () => ({
          eq: () => Promise.resolve({ data: null, error: new Error('Database error') }),
        }),
      }),
    });

    const request = new NextRequest(`${API_URL}/tokens/${mockToken.id}/revoke`, {
      method: 'POST',
    });

    const response = await POST(request, { params: { id: mockToken.id } });
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to revoke token');
  });
}); 