import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { POST } from './route';
import { createServerSupabaseClient } from '@/lib/supabase';
import { getTwitterUserByHandle } from '@/lib/twitter';
import { NextRequest } from 'next/server';

// Mock dependencies
jest.mock('@/lib/supabase', () => ({
  createServerSupabaseClient: jest.fn(),
}));

jest.mock('@/lib/twitter', () => ({
  getTwitterUserByHandle: jest.fn(),
}));

describe('POST /api/agents/claim', () => {
  const mockUser = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    email: 'test@example.com',
    user_metadata: {
      twitter_handle: 'testagent',
    },
  };

  const mockAgent = {
    id: '123e4567-e89b-12d3-a456-426614174001',
    handle: 'testagent',
    name: 'Test Agent',
    bio: 'Test bio',
    profile_image_url: 'https://example.com/avatar.jpg',
    status: 'invite',
    twitter_user_id: '123456',
    last_twitter_sync: '2024-03-21T00:00:00Z',
    created_at: '2024-03-21T00:00:00Z',
    updated_at: '2024-03-21T00:00:00Z',
  };

  const mockUpdatedAgent = {
    ...mockAgent,
    status: 'live',
    name: 'Updated Agent',
    bio: 'Updated bio',
    profile_image_url: 'https://example.com/updated-avatar.jpg',
    twitter_user_id: '123456',
    last_twitter_sync: '2024-03-21T00:00:00Z',
    updated_at: '2024-03-21T00:00:00Z',
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

  it('should claim agent profile', async () => {
    // Mock Twitter API
    (getTwitterUserByHandle as any).mockResolvedValue({
      name: 'Updated Agent',
      bio: 'Updated bio',
      profileImage: 'https://example.com/updated-avatar.jpg',
      twitterUserId: '123456',
    });

    // Mock Supabase responses
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'agents') {
        return {
          select: () => ({
            eq: () => ({
              single: () => Promise.resolve({ data: mockAgent, error: null }),
            }),
          }),
          update: () => ({
            eq: () => ({
              select: () => ({
                single: () => Promise.resolve({ data: mockUpdatedAgent, error: null }),
              }),
            }),
          }),
        };
      }
      return {};
    });

    const request = new NextRequest(`${API_URL}/agents/claim`, {
      method: 'POST',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual(mockUpdatedAgent);
  });

  it('should return 401 for unauthenticated user', async () => {
    // Mock unauthenticated user
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: null });

    const request = new NextRequest(`${API_URL}/agents/claim`, {
      method: 'POST',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('should return 400 for missing Twitter handle', async () => {
    // Mock user without Twitter handle
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { ...mockUser, user_metadata: {} } },
      error: null,
    });

    const request = new NextRequest(`${API_URL}/agents/claim`, {
      method: 'POST',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Twitter handle not found in user metadata');
  });

  it('should return 404 for non-existent agent', async () => {
    // Mock non-existent agent
    mockSupabase.from.mockReturnValue({
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({ data: null, error: { code: 'PGRST116' } }),
        }),
      }),
    });

    const request = new NextRequest(`${API_URL}/agents/claim`, {
      method: 'POST',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Agent profile not found');
  });

  it('should return 409 for already claimed agent', async () => {
    // Mock already claimed agent
    mockSupabase.from.mockReturnValue({
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({
            data: { ...mockAgent, status: 'live' },
            error: null,
          }),
        }),
      }),
    });

    const request = new NextRequest(`${API_URL}/agents/claim`, {
      method: 'POST',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(409);
    expect(data.error).toBe('Agent profile already claimed');
  });

  it('should return 404 for non-existent Twitter user', async () => {
    // Mock existing agent
    mockSupabase.from.mockReturnValue({
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({ data: mockAgent, error: null }),
        }),
      }),
    });

    // Mock Twitter API error
    (getTwitterUserByHandle as any).mockRejectedValue(new Error('Twitter user not found'));

    const request = new NextRequest(`${API_URL}/agents/claim`, {
      method: 'POST',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Twitter user not found');
  });

  it('should return 500 for database error', async () => {
    // Mock existing agent
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'agents') {
        return {
          select: () => ({
            eq: () => ({
              single: () => Promise.resolve({ data: mockAgent, error: null }),
            }),
          }),
          update: () => ({
            eq: () => ({
              select: () => ({
                single: () => Promise.resolve({ data: null, error: new Error('Database error') }),
              }),
            }),
          }),
        };
      }
      return {};
    });

    // Mock Twitter API
    (getTwitterUserByHandle as any).mockResolvedValue({
      name: 'Updated Agent',
      bio: 'Updated bio',
      profileImage: 'https://example.com/updated-avatar.jpg',
      twitterUserId: '123456',
    });

    const request = new NextRequest(`${API_URL}/agents/claim`, {
      method: 'POST',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to update agent');
  });
}); 