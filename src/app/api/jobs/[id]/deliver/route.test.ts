import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { PUT } from './route';
import { createServiceRoleSupabaseClient } from '@/lib/supabase/server';
import { hashToken } from '@/lib/auth';
import { NextRequest } from 'next/server';

// Mock dependencies
jest.mock('@/lib/supabase/server', () => ({
  createServiceRoleSupabaseClient: jest.fn(),
}));

jest.mock('@/lib/auth', () => ({
  hashToken: jest.fn(),
}));

describe('PUT /api/jobs/[id]/deliver', () => {
  const mockJob = {
    id: '123',
    offer_id: '123e4567-e89b-12d3-a456-426614174002',
    seller_id: '123e4567-e89b-12d3-a456-426614174003',
    buyer_id: '123e4567-e89b-12d3-a456-426614174004',
    status: 'started',
    started_at: null,
    delivered_at: null,
    completed_at: null,
    cancelled_at: null,
    created_at: '2024-03-21T00:00:00Z',
    updated_at: '2024-03-21T00:00:00Z',
  };

  const mockTokenData = {
    user_id: '123e4567-e89b-12d3-a456-426614174005',
    token_hash: 'hashed_token_123',
    expires_at: '2024-12-31T23:59:59Z',
    revoked_at: null,
  };

  const mockAgent = {
    id: '123e4567-e89b-12d3-a456-426614174003',
    user_id: '123e4567-e89b-12d3-a456-426614174005',
  };

  const mockSupabase = {
    from: jest.fn(),
  } as any;

  beforeEach(() => {
    jest.clearAllMocks();
    (createServiceRoleSupabaseClient as any).mockReturnValue(mockSupabase);
    (hashToken as any).mockResolvedValue('hashed_token_123');
  });

  it('should successfully deliver a job', async () => {
    // Mock Supabase responses
    const mockSelect = jest.fn().mockReturnThis();
    const mockEq = jest.fn().mockReturnThis();
    const mockSingle = jest.fn()
      .mockResolvedValueOnce({ data: mockTokenData, error: null } as any) // token lookup
      .mockResolvedValueOnce({ data: mockAgent, error: null } as any) // agent lookup
      .mockResolvedValueOnce({ data: mockJob, error: null } as any) // job lookup
      .mockResolvedValueOnce({ data: { ...mockJob, status: 'delivered' }, error: null } as any); // job update

    mockSupabase.from.mockReturnValue({
      select: mockSelect,
      eq: mockEq,
      single: mockSingle,
      update: jest.fn().mockReturnThis(),
    });

    const request = new NextRequest('http://localhost:3000/api/jobs/123/deliver', {
      method: 'PUT',
      headers: {
        'authorization': 'Bearer valid_token_123',
      },
    });

    const response = await PUT(request, { params: Promise.resolve({ id: '123' }) });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.status).toBe('delivered');
    expect(hashToken).toHaveBeenCalledWith('valid_token_123');
  });

  it('should return 401 for missing authorization header', async () => {
    const request = new NextRequest('http://localhost:3000/api/jobs/123/deliver', {
      method: 'PUT',
    });

    const response = await PUT(request, { params: Promise.resolve({ id: '123' }) });
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Missing or invalid authorization header');
  });

  it('should return 401 for invalid authorization header format', async () => {
    const request = new NextRequest('http://localhost:3000/api/jobs/123/deliver', {
      method: 'PUT',
      headers: {
        'authorization': 'InvalidFormat valid_token_123',
      },
    });

    const response = await PUT(request, { params: Promise.resolve({ id: '123' }) });
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Missing or invalid authorization header');
  });

  it('should return 401 for invalid or expired token', async () => {
    const mockSelect = jest.fn().mockReturnThis();
    const mockEq = jest.fn().mockReturnThis();
    const mockSingle = jest.fn().mockResolvedValue({ data: null, error: new Error('Token not found') } as any);

    mockSupabase.from.mockReturnValue({
      select: mockSelect,
      eq: mockEq,
      single: mockSingle,
    });

    const request = new NextRequest('http://localhost:3000/api/jobs/123/deliver', {
      method: 'PUT',
      headers: {
        'authorization': 'Bearer invalid_token',
      },
    });

    const response = await PUT(request, { params: Promise.resolve({ id: '123' }) });
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Invalid or expired token');
  });

  it('should return 401 for expired token', async () => {
    const expiredTokenData = {
      ...mockTokenData,
      expires_at: '2020-01-01T00:00:00Z', // Past date
    };

    const mockSelect = jest.fn().mockReturnThis();
    const mockEq = jest.fn().mockReturnThis();
    const mockSingle = jest.fn().mockResolvedValue({ data: expiredTokenData, error: null } as any);

    mockSupabase.from.mockReturnValue({
      select: mockSelect,
      eq: mockEq,
      single: mockSingle,
    });

    const request = new NextRequest('http://localhost:3000/api/jobs/123/deliver', {
      method: 'PUT',
      headers: {
        'authorization': 'Bearer expired_token',
      },
    });

    const response = await PUT(request, { params: Promise.resolve({ id: '123' }) });
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Token expired or revoked');
  });

  it('should return 401 for revoked token', async () => {
    const revokedTokenData = {
      ...mockTokenData,
      revoked_at: '2024-01-01T00:00:00Z',
    };

    const mockSelect = jest.fn().mockReturnThis();
    const mockEq = jest.fn().mockReturnThis();
    const mockSingle = jest.fn().mockResolvedValue({ data: revokedTokenData, error: null } as any);

    mockSupabase.from.mockReturnValue({
      select: mockSelect,
      eq: mockEq,
      single: mockSingle,
    });

    const request = new NextRequest('http://localhost:3000/api/jobs/123/deliver', {
      method: 'PUT',
      headers: {
        'authorization': 'Bearer revoked_token',
      },
    });

    const response = await PUT(request, { params: Promise.resolve({ id: '123' }) });
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Token expired or revoked');
  });

  it('should return 403 when agent not found for token', async () => {
    const mockSelect = jest.fn().mockReturnThis();
    const mockEq = jest.fn().mockReturnThis();
    const mockSingle = jest.fn()
      .mockResolvedValueOnce({ data: mockTokenData, error: null } as any) // token lookup
      .mockResolvedValueOnce({ data: null, error: new Error('Agent not found') } as any); // agent lookup

    mockSupabase.from.mockReturnValue({
      select: mockSelect,
      eq: mockEq,
      single: mockSingle,
    });

    const request = new NextRequest('http://localhost:3000/api/jobs/123/deliver', {
      method: 'PUT',
      headers: {
        'authorization': 'Bearer valid_token_123',
      },
    });

    const response = await PUT(request, { params: Promise.resolve({ id: '123' }) });
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toBe('Agent not found for this token');
  });

  it('should return 404 when job not found', async () => {
    const mockSelect = jest.fn().mockReturnThis();
    const mockEq = jest.fn().mockReturnThis();
    const mockSingle = jest.fn()
      .mockResolvedValueOnce({ data: mockTokenData, error: null } as any) // token lookup
      .mockResolvedValueOnce({ data: mockAgent, error: null } as any) // agent lookup
      .mockResolvedValueOnce({ data: null, error: new Error('Job not found') } as any); // job lookup

    mockSupabase.from.mockReturnValue({
      select: mockSelect,
      eq: mockEq,
      single: mockSingle,
    });

    const request = new NextRequest('http://localhost:3000/api/jobs/999/deliver', {
      method: 'PUT',
      headers: {
        'authorization': 'Bearer valid_token_123',
      },
    });

    const response = await PUT(request, { params: Promise.resolve({ id: '999' }) });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Job not found');
  });

  it('should return 400 when job is not in started state', async () => {
    const jobNotStarted = { ...mockJob, status: 'funded' };

    const mockSelect = jest.fn().mockReturnThis();
    const mockEq = jest.fn().mockReturnThis();
    const mockSingle = jest.fn()
      .mockResolvedValueOnce({ data: mockTokenData, error: null } as any) // token lookup
      .mockResolvedValueOnce({ data: mockAgent, error: null } as any) // agent lookup
      .mockResolvedValueOnce({ data: jobNotStarted, error: null } as any); // job lookup

    mockSupabase.from.mockReturnValue({
      select: mockSelect,
      eq: mockEq,
      single: mockSingle,
    });

    const request = new NextRequest('http://localhost:3000/api/jobs/123/deliver', {
      method: 'PUT',
      headers: {
        'authorization': 'Bearer valid_token_123',
      },
    });

    const response = await PUT(request, { params: Promise.resolve({ id: '123' }) });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Job is not in started state');
  });

  it('should return 403 when agent is not assigned to the job', async () => {
    const jobWithDifferentSeller = { ...mockJob, seller_id: 'different-seller-id' };

    const mockSelect = jest.fn().mockReturnThis();
    const mockEq = jest.fn().mockReturnThis();
    const mockSingle = jest.fn()
      .mockResolvedValueOnce({ data: mockTokenData, error: null } as any) // token lookup
      .mockResolvedValueOnce({ data: mockAgent, error: null } as any) // agent lookup
      .mockResolvedValueOnce({ data: jobWithDifferentSeller, error: null } as any); // job lookup

    mockSupabase.from.mockReturnValue({
      select: mockSelect,
      eq: mockEq,
      single: mockSingle,
    });

    const request = new NextRequest('http://localhost:3000/api/jobs/123/deliver', {
      method: 'PUT',
      headers: {
        'authorization': 'Bearer valid_token_123',
      },
    });

    const response = await PUT(request, { params: Promise.resolve({ id: '123' }) });
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toBe('Agent is not assigned to this job');
  });

  it('should return 500 when job update fails', async () => {
    const mockSelect = jest.fn().mockReturnThis();
    const mockEq = jest.fn().mockReturnThis();
    const mockSingle = jest.fn()
      .mockResolvedValueOnce({ data: mockTokenData, error: null } as any) // token lookup
      .mockResolvedValueOnce({ data: mockAgent, error: null } as any) // agent lookup
      .mockResolvedValueOnce({ data: mockJob, error: null } as any) // job lookup
      .mockResolvedValueOnce({ data: null, error: new Error('Update failed') } as any); // job update

    mockSupabase.from.mockReturnValue({
      select: mockSelect,
      eq: mockEq,
      single: mockSingle,
      update: jest.fn().mockReturnThis(),
    });

    const request = new NextRequest('http://localhost:3000/api/jobs/123/deliver', {
      method: 'PUT',
      headers: {
        'authorization': 'Bearer valid_token_123',
      },
    });

    const response = await PUT(request, { params: Promise.resolve({ id: '123' }) });
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to update job status');
  });

  it('should return 400 for invalid job ID', async () => {
    const request = new NextRequest('http://localhost:3000/api/jobs/invalid/deliver', {
      method: 'PUT',
      headers: {
        'authorization': 'Bearer valid_token_123',
      },
    });

    const response = await PUT(request, { params: Promise.resolve({ id: 'invalid' }) });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid job ID');
  });

  it('should return 400 for empty job ID', async () => {
    const request = new NextRequest('http://localhost:3000/api/jobs//deliver', {
      method: 'PUT',
      headers: {
        'authorization': 'Bearer valid_token_123',
      },
    });

    const response = await PUT(request, { params: Promise.resolve({ id: '' }) });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid job ID');
  });

  it('should handle unexpected errors gracefully', async () => {
    (hashToken as any).mockRejectedValue(new Error('Unexpected error'));

    const request = new NextRequest('http://localhost:3000/api/jobs/123/deliver', {
      method: 'PUT',
      headers: {
        'authorization': 'Bearer valid_token_123',
      },
    });

    const response = await PUT(request, { params: Promise.resolve({ id: '123' }) });
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Internal server error');
  });
});
