import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { GET, POST } from './route';
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

describe('POST /api/agents', () => {
  const mockUser = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    email: 'test@example.com',
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
    created_by: mockUser.id,
    created_at: '2024-03-21T00:00:00Z',
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

  it('should create a new agent', async () => {
    // Mock Twitter API
    (getTwitterUserByHandle as any).mockResolvedValue({
      name: 'Test Agent',
      bio: 'Test bio',
      profileImage: 'https://example.com/avatar.jpg',
      twitterUserId: '123456',
    });

    // Mock Supabase response
    mockSupabase.from.mockReturnValue({
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({ data: null, error: null }),
        }),
      }),
      insert: () => ({
        select: () => ({
          single: () => Promise.resolve({ data: mockAgent, error: null }),
        }),
      }),
    });

    const request = new NextRequest(`${API_URL}/agents`, {
      method: 'POST',
      body: JSON.stringify({ handle: 'testagent' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual(mockAgent);
  });

  it('should return 401 for unauthenticated user', async () => {
    // Mock unauthenticated user
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: null });

    const request = new NextRequest(`${API_URL}/agents`, {
      method: 'POST',
      body: JSON.stringify({ handle: 'testagent' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('should return 400 for invalid request body', async () => {
    const request = new NextRequest(`${API_URL}/agents`, {
      method: 'POST',
      body: JSON.stringify({ invalid: 'data' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid request body');
  });

  it('should return 409 for existing agent', async () => {
    // Mock existing agent
    mockSupabase.from.mockReturnValue({
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({ data: mockAgent, error: null }),
        }),
      }),
    });

    const request = new NextRequest(`${API_URL}/agents`, {
      method: 'POST',
      body: JSON.stringify({ handle: 'testagent' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(409);
    expect(data.error).toBe('Agent already exists');
  });

  it('should return 404 for non-existent Twitter user', async () => {
    // Mock non-existent agent
    mockSupabase.from.mockReturnValue({
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({ data: null, error: null }),
        }),
      }),
    });

    // Mock Twitter API error
    (getTwitterUserByHandle as any).mockRejectedValue(new Error('Twitter user not found'));

    const request = new NextRequest(`${API_URL}/agents`, {
      method: 'POST',
      body: JSON.stringify({ handle: 'nonexistent' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Twitter user not found');
  });

  it('should return 500 for database error', async () => {
    // Mock non-existent agent
    mockSupabase.from.mockReturnValue({
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({ data: null, error: null }),
        }),
      }),
      insert: () => ({
        select: () => ({
          single: () => Promise.resolve({ data: null, error: new Error('Database error') }),
        }),
      }),
    });

    // Mock Twitter API
    (getTwitterUserByHandle as any).mockResolvedValue({
      name: 'Test Agent',
      bio: 'Test bio',
      profileImage: 'https://example.com/avatar.jpg',
      twitterUserId: '123456',
    });

    const request = new NextRequest(`${API_URL}/agents`, {
      method: 'POST',
      body: JSON.stringify({ handle: 'testagent' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to create agent');
  });
}); 