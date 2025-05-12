import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { GET, PATCH, DELETE } from './route';
import { createServerSupabaseClient } from '@/lib/supabase';
import { NextRequest } from 'next/server';

// Mock dependencies
jest.mock('@/lib/supabase', () => ({
  createServerSupabaseClient: jest.fn(),
}));

describe('GET /api/agents/[handle]', () => {
  const mockAgent = {
    id: '123e4567-e89b-12d3-a456-426614174001',
    handle: 'testagent',
    name: 'Test Agent',
    bio: 'Test bio',
    profile_image_url: 'https://example.com/avatar.jpg',
    status: 'live',
    created_by: '123e4567-e89b-12d3-a456-426614174000',
    created_at: '2024-03-21T00:00:00Z',
    updated_at: '2024-03-21T00:00:00Z',
  };

  const mockSupabase = {
    from: jest.fn(),
  } as any;

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

  beforeEach(() => {
    jest.clearAllMocks();
    (createServerSupabaseClient as any).mockReturnValue(mockSupabase);
  });

  it('should return agent details', async () => {
    mockSupabase.from.mockReturnValue({
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({ data: mockAgent, error: null }),
        }),
      }),
    });

    const response = await GET(new Request('http://localhost:3000/api/agents/testagent'), {
      params: { handle: mockAgent.handle },
    });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual(mockAgent);
  });

  it('should return 404 for nonexistent agent', async () => {
    mockSupabase.from.mockReturnValue({
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({ data: null, error: { code: 'PGRST116' } }),
        }),
      }),
    });

    const response = await GET(new Request('http://localhost:3000/api/agents/nonexistent'), {
      params: { handle: 'nonexistent' },
    });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Agent not found');
  });

  it('should return 500 for database error', async () => {
    mockSupabase.from.mockReturnValue({
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({ data: null, error: { code: 'OTHER_ERROR' } }),
        }),
      }),
    });

    const response = await GET(new Request('http://localhost:3000/api/agents/testagent'), {
      params: { handle: mockAgent.handle },
    });
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to fetch agent');
  });
});

describe('PATCH /api/agents/[handle]', () => {
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
    status: 'live',
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

  it('should update agent details', async () => {
    const updatedAgent = {
      ...mockAgent,
      name: 'Updated Agent',
      bio: 'Updated bio',
    };

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
                single: () => Promise.resolve({ data: updatedAgent, error: null }),
              }),
            }),
          }),
        };
      }
      return {};
    });

    const request = new NextRequest(`${API_URL}/agents/${mockAgent.handle}`, {
      method: 'PATCH',
      body: JSON.stringify({
        name: 'Updated Agent',
        bio: 'Updated bio',
      }),
    });

    const response = await PATCH(request, { params: { handle: mockAgent.handle } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual(updatedAgent);
  });

  it('should return 401 for unauthenticated user', async () => {
    // Mock unauthenticated user
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: null });

    const request = new NextRequest(`${API_URL}/agents/${mockAgent.handle}`, {
      method: 'PATCH',
      body: JSON.stringify({
        name: 'Updated Agent',
      }),
    });

    const response = await PATCH(request, { params: { handle: mockAgent.handle } });
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('should return 403 for unauthorized user', async () => {
    // Mock agent owned by different user
    mockSupabase.from.mockReturnValue({
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({
            data: { ...mockAgent, created_by: 'different-user' },
            error: null,
          }),
        }),
      }),
    });

    const request = new NextRequest(`${API_URL}/agents/${mockAgent.handle}`, {
      method: 'PATCH',
      body: JSON.stringify({
        name: 'Updated Agent',
      }),
    });

    const response = await PATCH(request, { params: { handle: mockAgent.handle } });
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toBe('Unauthorized');
  });

  it('should return 400 for invalid request body', async () => {
    // Mock Supabase response for authorization check
    mockSupabase.from.mockReturnValue({
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({ data: mockAgent, error: null }),
        }),
      }),
    });

    const request = new NextRequest(`${API_URL}/agents/${mockAgent.handle}`, {
      method: 'PATCH',
      body: JSON.stringify({
        name: '', // Invalid: empty name
      }),
    });

    const response = await PATCH(request, { params: { handle: mockAgent.handle } });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid request body');
  });

  it('should return 400 if handle update does not match agent\'s Twitter handle', async () => {
    // Mock Supabase responses
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'agents') {
        return {
          select: () => ({
            eq: () => ({
              single: () => Promise.resolve({ data: { ...mockAgent, twitter_handle: 'twitterhandle' }, error: null }),
            }),
          }),
        };
      }
      return {};
    });

    const request = new NextRequest(`${API_URL}/agents/${mockAgent.handle}`, {
      method: 'PATCH',
      body: JSON.stringify({
        handle: 'differenthandle',
      }),
    });

    const response = await PATCH(request, { params: { handle: mockAgent.handle } });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Handle can only be updated to the agent\'s current Twitter handle');
  });

  it('should return 500 for database error', async () => {
    // Mock database error
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

    const request = new NextRequest(`${API_URL}/agents/${mockAgent.handle}`, {
      method: 'PATCH',
      body: JSON.stringify({
        name: 'Updated Agent',
      }),
    });

    const response = await PATCH(request, { params: { handle: mockAgent.handle } });
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to update agent');
  });
});

describe('DELETE /api/agents/[handle]', () => {
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
    status: 'live',
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

  it('should delete agent', async () => {
    // Mock Supabase responses
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'agents') {
        return {
          select: () => ({
            eq: () => ({
              single: () => Promise.resolve({ data: mockAgent, error: null }),
            }),
          }),
          delete: () => ({
            eq: () => Promise.resolve({ error: null }),
          }),
        };
      }
      return {};
    });

    const request = new NextRequest(`${API_URL}/agents/${mockAgent.handle}`, {
      method: 'DELETE',
    });

    const response = await DELETE(request, { params: { handle: mockAgent.handle } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({ success: true });
  });

  it('should return 401 for unauthenticated user', async () => {
    // Mock unauthenticated user
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: null });

    const request = new NextRequest(`${API_URL}/agents/${mockAgent.handle}`, {
      method: 'DELETE',
    });

    const response = await DELETE(request, { params: { handle: mockAgent.handle } });
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('should return 403 for unauthorized user', async () => {
    // Mock agent owned by different user
    mockSupabase.from.mockReturnValue({
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({
            data: { ...mockAgent, created_by: 'different-user' },
            error: null,
          }),
        }),
      }),
    });

    const request = new NextRequest(`${API_URL}/agents/${mockAgent.handle}`, {
      method: 'DELETE',
    });

    const response = await DELETE(request, { params: { handle: mockAgent.handle } });
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toBe('Unauthorized');
  });

  it('should return 404 for nonexistent agent', async () => {
    mockSupabase.from.mockReturnValue({
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({ data: null, error: { code: 'PGRST116' } }),
        }),
      }),
    });

    const request = new NextRequest(`${API_URL}/agents/nonexistent`, {
      method: 'DELETE',
    });

    const response = await DELETE(request, { params: { handle: 'nonexistent' } });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Agent not found');
  });

  it('should return 500 for database error', async () => {
    // Mock Supabase responses
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'agents') {
        return {
          select: () => ({
            eq: () => ({
              single: () => Promise.resolve({ data: mockAgent, error: null }),
            }),
          }),
          delete: () => ({
            eq: () => Promise.resolve({ error: { code: 'OTHER_ERROR' } }),
          }),
        };
      }
      return {};
    });

    const request = new NextRequest(`${API_URL}/agents/${mockAgent.handle}`, {
      method: 'DELETE',
    });

    const response = await DELETE(request, { params: { handle: mockAgent.handle } });
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to delete agent');
  });
}); 