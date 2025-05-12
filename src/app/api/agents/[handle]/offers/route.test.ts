import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { POST } from './route';
import { createServerSupabaseClient } from '@/lib/supabase';
import { getTwitterUserByHandle } from '@/lib/twitter';

// Mock dependencies
jest.mock('@/lib/supabase', () => ({
  createServerSupabaseClient: jest.fn(),
}));

jest.mock('@/lib/twitter', () => ({
  getTwitterUserByHandle: jest.fn(),
}));

describe('POST /api/agents/[handle]/offers', () => {
  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
  };

  const mockAgent = {
    id: 'agent-123',
    handle: 'testagent',
    name: 'Test Agent',
    bio: 'Test bio',
    profile_image_url: 'https://example.com/avatar.jpg',
    twitter_user_id: '123456',
  };

  const mockOffer = {
    id: 'offer-123',
    seller_id: mockAgent.id,
    buyer_id: mockUser.id,
    amount: 100,
    currency: 'SOL',
    description: 'Test offer',
    status: 'created',
  };

  const mockJob = {
    id: 'job-123',
    offer_id: mockOffer.id,
    seller_id: mockAgent.id,
    buyer_id: mockUser.id,
    status: 'created',
  };

  const mockSupabase = {
    auth: {
      getUser: jest.fn(),
    },
    from: jest.fn(),
    rpc: jest.fn(),
  } as any;

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

  beforeEach(() => {
    jest.clearAllMocks();
    (createServerSupabaseClient as any).mockReturnValue(mockSupabase);
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null });
  });

  it('should create an offer for an existing agent', async () => {
    // Mock existing agent
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'agents') {
        return {
          select: () => ({
            eq: () => ({
              single: () => Promise.resolve({ data: mockAgent, error: null }),
            }),
          }),
        };
      }
      if (table === 'offers') {
        return {
          insert: () => ({
            select: () => ({
              single: () => Promise.resolve({ data: mockOffer, error: null }),
            }),
          }),
        };
      }
      if (table === 'jobs') {
        return {
          insert: () => ({
            select: () => ({
              single: () => Promise.resolve({ data: mockJob, error: null }),
            }),
          }),
        };
      }
      return {};
    });

    // Mock transaction functions
    mockSupabase.rpc.mockImplementation((fn: string) => {
      if (fn === 'begin_transaction') {
        return Promise.resolve({ error: null });
      }
      if (fn === 'commit_transaction') {
        return Promise.resolve({ error: null });
      }
      return Promise.resolve({ error: null });
    });

    const request = new Request(`${API_URL}/agents/${mockAgent.handle}/offers`, {
      method: 'POST',
      body: JSON.stringify({
        amount: 100,
        currency: 'SOL',
        description: 'Test offer',
      }),
    });

    const response = await POST(request, { params: { handle: 'testagent' } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({
      agent_id: mockAgent.id,
      offer_id: mockOffer.id,
      job_id: mockJob.id,
    });
  });

  it('should create an offer for a new agent', async () => {
    // Mock non-existent agent
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'agents') {
        return {
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
        };
      }
      if (table === 'offers') {
        return {
          insert: () => ({
            select: () => ({
              single: () => Promise.resolve({ data: mockOffer, error: null }),
            }),
          }),
        };
      }
      if (table === 'jobs') {
        return {
          insert: () => ({
            select: () => ({
              single: () => Promise.resolve({ data: mockJob, error: null }),
            }),
          }),
        };
      }
      return {};
    });

    // Mock Twitter API
    (getTwitterUserByHandle as any).mockResolvedValue({
      name: 'Test Agent',
      bio: 'Test bio',
      profileImage: 'https://example.com/avatar.jpg',
      twitterUserId: '123456',
    });

    // Mock transaction functions
    mockSupabase.rpc.mockImplementation((fn: string) => {
      if (fn === 'begin_transaction') {
        return Promise.resolve({ error: null });
      }
      if (fn === 'commit_transaction') {
        return Promise.resolve({ error: null });
      }
      return Promise.resolve({ error: null });
    });

    const request = new Request(`${API_URL}/agents/newagent/offers`, {
      method: 'POST',
      body: JSON.stringify({
        amount: 100,
        currency: 'SOL',
        description: 'Test offer',
      }),
    });

    const response = await POST(request, { params: { handle: 'newagent' } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({
      agent_id: mockAgent.id,
      offer_id: mockOffer.id,
      job_id: mockJob.id,
    });
  });

  it('should rollback transaction if offer creation fails', async () => {
    // Mock existing agent
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'agents') {
        return {
          select: () => ({
            eq: () => ({
              single: () => Promise.resolve({ data: mockAgent, error: null }),
            }),
          }),
        };
      }
      if (table === 'offers') {
        return {
          insert: () => ({
            select: () => ({
              single: () => Promise.resolve({ data: null, error: new Error('Failed to create offer') }),
            }),
          }),
        };
      }
      return {
        insert: () => ({
          select: () => ({
            single: () => Promise.resolve({ data: mockJob, error: null }),
          }),
        }),
      };
    });

    // Mock transaction functions
    mockSupabase.rpc.mockImplementation((fn: string) => {
      if (fn === 'begin_transaction') {
        return Promise.resolve({ error: null });
      }
      if (fn === 'rollback_transaction') {
        return Promise.resolve({ error: null });
      }
      return Promise.resolve({ error: null });
    });

    const request = new Request(`${API_URL}/agents/testagent/offers`, {
      method: 'POST',
      body: JSON.stringify({
        amount: 100,
        currency: 'SOL',
        description: 'Test offer',
      }),
    });

    const response = await POST(request, { params: { handle: 'testagent' } });
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to create offer and job');
    expect(mockSupabase.rpc).toHaveBeenCalledWith('rollback_transaction');
  });

  it('should rollback transaction if job creation fails', async () => {
    // Mock existing agent
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'agents') {
        return {
          select: () => ({
            eq: () => ({
              single: () => Promise.resolve({ data: mockAgent, error: null }),
            }),
          }),
        };
      }
      if (table === 'offers') {
        return {
          insert: () => ({
            select: () => ({
              single: () => Promise.resolve({ data: mockOffer, error: null }),
            }),
          }),
        };
      }
      if (table === 'jobs') {
        return {
          insert: () => ({
            select: () => ({
              single: () => Promise.resolve({ data: null, error: new Error('Failed to create job') }),
            }),
          }),
        };
      }
      return {};
    });

    // Mock transaction functions
    mockSupabase.rpc.mockImplementation((fn: string) => {
      if (fn === 'begin_transaction') {
        return Promise.resolve({ error: null });
      }
      if (fn === 'rollback_transaction') {
        return Promise.resolve({ error: null });
      }
      return Promise.resolve({ error: null });
    });

    const request = new Request(`${API_URL}/agents/testagent/offers`, {
      method: 'POST',
      body: JSON.stringify({
        amount: 100,
        currency: 'SOL',
        description: 'Test offer',
      }),
    });

    const response = await POST(request, { params: { handle: 'testagent' } });
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to create offer and job');
    expect(mockSupabase.rpc).toHaveBeenCalledWith('rollback_transaction');
  });

  it('should handle Twitter API errors for new agent creation', async () => {
    // Mock non-existent agent
    mockSupabase.from.mockImplementation(() => ({
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({ data: null, error: null }),
        }),
      }),
    }));

    // Mock Twitter API error
    (getTwitterUserByHandle as any).mockRejectedValue(new Error('Twitter user not found'));

    const request = new Request(`${API_URL}/agents/nonexistent/offers`, {
      method: 'POST',
      body: JSON.stringify({
        amount: 100,
        currency: 'SOL',
        description: 'Test offer',
      }),
    });

    const response = await POST(request, { params: { handle: 'nonexistent' } });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Twitter user not found');
    // Verify no transaction was started
    expect(mockSupabase.rpc).not.toHaveBeenCalledWith('begin_transaction');
  });
}); 