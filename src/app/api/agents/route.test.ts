import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { GET } from './route';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getTwitterUserByHandle } from '@/lib/twitter';
import { NextRequest } from 'next/server';

// Mock dependencies
jest.mock('@/lib/supabase/server', () => ({
  createServerSupabaseClient: jest.fn(),
}));

jest.mock('@/lib/twitter', () => ({
  getTwitterUserByHandle: jest.fn(),
}));

describe('GET /api/agents', () => {
  const mockAgents = [
    {
      id: '123e4567-e89b-12d3-a456-426614174001',
      handle: 'testagent1',
      name: 'Test Agent 1',
      bio: 'Test bio 1',
      profile_image_url: 'https://example.com/avatar1.jpg',
      status: 'live',
      created_at: '2024-03-21T00:00:00Z',
      updated_at: '2024-03-21T00:00:00Z',
    },
    {
      id: '123e4567-e89b-12d3-a456-426614174002',
      handle: 'testagent2',
      name: 'Test Agent 2',
      bio: 'Test bio 2',
      profile_image_url: 'https://example.com/avatar2.jpg',
      status: 'invite',
      created_at: '2024-03-21T00:00:00Z',
      updated_at: '2024-03-21T00:00:00Z',
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

  it('should return all agents when no filters are provided', async () => {
    // Mock Supabase response
    mockSupabase.from.mockReturnValue({
      select: () => ({
        order: () => Promise.resolve({ data: mockAgents, error: null }),
      }),
    });

    const response = await GET(new NextRequest(`${API_URL}/agents`));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual(mockAgents);
  });

  it('should filter agents by status', async () => {
    // Mock Supabase response
    mockSupabase.from.mockReturnValue({
      select: () => ({
        order: () => ({
          eq: () => Promise.resolve({ data: [mockAgents[0]], error: null }),
        }),
      }),
    });

    const response = await GET(new NextRequest(`${API_URL}/agents?status=live`));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual([mockAgents[0]]);
  });

  it('should filter agents by search term', async () => {
    // Mock Supabase response
    mockSupabase.from.mockReturnValue({
      select: () => ({
        order: () => ({
          or: () => Promise.resolve({ data: [mockAgents[0]], error: null }),
        }),
      }),
    });

    const response = await GET(new NextRequest(`${API_URL}/agents?search=testagent1`));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual([mockAgents[0]]);
  });

  it('should return 500 for database error', async () => {
    // Mock database error
    mockSupabase.from.mockReturnValue({
      select: () => ({
        order: () => Promise.resolve({ data: null, error: new Error('Database error') }),
      }),
    });

    const response = await GET(new NextRequest(`${API_URL}/agents`));
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to fetch agents');
  });
});
