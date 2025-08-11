import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { PUT } from './route';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { NextRequest } from 'next/server';

// Mock dependencies
jest.mock('@/lib/supabase/server', () => ({
  createServerSupabaseClient: jest.fn(),
}));

describe('PUT /api/agents/link', () => {
  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
  };

  const mockAgent = {
    id: 'agent-123',
    handle: 'testhandle',
    user_id: null,
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

  it('should link agent to user', async () => {
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'agents') {
        return {
          select: () => ({
            eq: () => ({
              single: () => Promise.resolve({ data: mockAgent, error: null }),
            }),
          }),
          update: () => ({
            eq: () => Promise.resolve({ error: null }),
          }),
        };
      }
      return {};
    });

    const body = JSON.stringify({ twitterHandle: 'testhandle' });
    const request = new NextRequest(`${API_URL}/agents/link`, {
      method: 'PUT',
      body,
    });

    // Patch request.json() for NextRequest
    (request as any).json = async () => ({ twitterHandle: 'testhandle' });

    const response = await PUT(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.agent).toEqual(mockAgent);
  });

  it('should return 401 for unauthenticated user', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: null });

    const body = JSON.stringify({ twitterHandle: 'testhandle' });
    const request = new NextRequest(`${API_URL}/agents/link`, {
      method: 'PUT',
      body,
    });
    (request as any).json = async () => ({ twitterHandle: 'testhandle' });

    const response = await PUT(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('should return 400 for missing twitterHandle', async () => {
    const request = new NextRequest(`${API_URL}/agents/link`, {
      method: 'PUT',
      body: JSON.stringify({}),
    });
    (request as any).json = async () => ({});

    const response = await PUT(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Twitter handle is required');
  });

  it('should return 404 if agent not found', async () => {
    mockSupabase.from.mockReturnValue({
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({ data: null, error: { code: 'PGRST116' } }),
        }),
      }),
    });

    const body = JSON.stringify({ twitterHandle: 'notfound' });
    const request = new NextRequest(`${API_URL}/agents/link`, {
      method: 'PUT',
      body,
    });
    (request as any).json = async () => ({ twitterHandle: 'notfound' });

    const response = await PUT(request);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Agent profile not found');
  });

  it('should return 500 if update fails', async () => {
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'agents') {
        return {
          select: () => ({
            eq: () => ({
              single: () => Promise.resolve({ data: mockAgent, error: null }),
            }),
          }),
          update: () => ({
            eq: () => Promise.resolve({ error: new Error('Update failed') }),
          }),
        };
      }
      return {};
    });

    const body = JSON.stringify({ twitterHandle: 'testhandle' });
    const request = new NextRequest(`${API_URL}/agents/link`, {
      method: 'PUT',
      body,
    });
    (request as any).json = async () => ({ twitterHandle: 'testhandle' });

    const response = await PUT(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to link agent to user');
  });
});
