import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { GET, POST } from './route';
import { createServerSupabaseClient } from '@/lib/supabase';
import { NextRequest } from 'next/server';

// Mock dependencies
jest.mock('@/lib/supabase', () => ({
  createServerSupabaseClient: jest.fn(),
}));

// Mock crypto module
jest.mock('crypto', () => ({
  randomBytes: jest.fn().mockReturnValue({
    toString: jest.fn().mockReturnValue('testtoken123'),
  }),
  createHash: jest.fn().mockReturnValue({
    update: jest.fn().mockReturnThis(),
    digest: jest.fn().mockReturnValue('hashedtoken123'),
  }),
}));

describe('GET /api/tokens', () => {
  const mockUser = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    email: 'test@example.com',
  };

  const mockTokens = [
    {
      id: '123e4567-e89b-12d3-a456-426614174001',
      user_id: mockUser.id,
      name: 'Test Token 1',
      created_at: '2024-03-21T00:00:00Z',
      expires_at: '2024-04-21T00:00:00Z',
      revoked_at: null,
    },
    {
      id: '123e4567-e89b-12d3-a456-426614174002',
      user_id: mockUser.id,
      name: 'Test Token 2',
      created_at: '2024-03-21T00:00:00Z',
      expires_at: '2024-04-21T00:00:00Z',
      revoked_at: null,
    },
  ];

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

  it('should return all tokens for the current user', async () => {
    // Mock Supabase response
    mockSupabase.from.mockReturnValue({
      select: () => ({
        eq: () => ({
          is: () => ({
            order: () => Promise.resolve({ data: mockTokens, error: null }),
          }),
        }),
      }),
    });

    const request = new NextRequest(`${API_URL}/tokens`, {
      method: 'GET',
    });

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual(mockTokens);
  });

  it('should return 401 for unauthenticated user', async () => {
    // Mock unauthenticated user
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: null });

    const request = new NextRequest(`${API_URL}/tokens`, {
      method: 'GET',
    });

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('should return 500 for database error', async () => {
    // Mock database error
    mockSupabase.from.mockReturnValue({
      select: () => ({
        eq: () => ({
          is: () => ({
            order: () => Promise.resolve({ data: null, error: new Error('Database error') }),
          }),
        }),
      }),
    });

    const request = new NextRequest(`${API_URL}/tokens`, {
      method: 'GET',
    });

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to fetch tokens');
  });
});

describe('POST /api/tokens', () => {
  const mockUser = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    email: 'test@example.com',
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

  it('should create a new token', async () => {
    // Mock Supabase response
    mockSupabase.from.mockReturnValue({
      insert: () => Promise.resolve({ error: null }),
    });

    const request = new NextRequest(`${API_URL}/tokens`, {
      method: 'POST',
      body: JSON.stringify({
        name: 'Test Token',
        expiresIn: 30,
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('token', 'testtoken123');
    expect(data).toHaveProperty('name', 'Test Token');
    expect(data).toHaveProperty('expires_at');
  });

  it('should return 401 for unauthenticated user', async () => {
    // Mock unauthenticated user
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: null });

    const request = new NextRequest(`${API_URL}/tokens`, {
      method: 'POST',
      body: JSON.stringify({
        name: 'Test Token',
        expiresIn: 30,
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('should return 400 for invalid request body', async () => {
    const request = new NextRequest(`${API_URL}/tokens`, {
      method: 'POST',
      body: JSON.stringify({
        name: '', // Invalid: empty name
        expiresIn: 30,
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid request body');
  });

  it('should return 500 for database error', async () => {
    // Mock database error
    mockSupabase.from.mockReturnValue({
      insert: () => Promise.resolve({ error: new Error('Database error') }),
    });

    const request = new NextRequest(`${API_URL}/tokens`, {
      method: 'POST',
      body: JSON.stringify({
        name: 'Test Token',
        expiresIn: 30,
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to create token');
  });
}); 