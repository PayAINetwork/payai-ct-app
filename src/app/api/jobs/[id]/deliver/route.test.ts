import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { PUT } from './route';
import { createServiceRoleSupabaseClient } from '@/lib/supabase/server';
import { getAuthenticatedUserOrError } from '@/lib/auth';
import { NextRequest } from 'next/server';

// Mock dependencies
jest.mock('@/lib/supabase/server', () => ({
  createServiceRoleSupabaseClient: jest.fn(),
}));

jest.mock('@/lib/auth', () => ({
  getAuthenticatedUserOrError: jest.fn(),
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
    delivered_url: null,
    completed_at: null,
    cancelled_at: null,
    created_at: '2024-03-21T00:00:00Z',
    updated_at: '2024-03-21T00:00:00Z',
  };

  const mockUser = {
    id: '123e4567-e89b-12d3-a456-426614174005',
    email: 'agent@example.com',
  };

  const mockAgent = {
    id: '123e4567-e89b-12d3-a456-426614174003',
    user_id: '123e4567-e89b-12d3-a456-426614174005',
  };

  const mockSupabase = {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn(),
    update: jest.fn().mockReturnThis(),
  } as any;

  beforeEach(() => {
    jest.clearAllMocks();
    (createServiceRoleSupabaseClient as any).mockReturnValue(mockSupabase);
    (getAuthenticatedUserOrError as any).mockResolvedValue({ user: mockUser, error: null });
  });

  it('should successfully deliver a job with delivered_url', async () => {
    const deliveredUrl = 'https://example.com/delivered-work';
    
    // Mock Supabase responses
    mockSupabase.single
      .mockResolvedValueOnce({ data: mockAgent, error: null }) // agent lookup
      .mockResolvedValueOnce({ data: mockJob, error: null }) // job lookup
      .mockResolvedValueOnce({ data: { ...mockJob, status: 'delivered', delivered_url: deliveredUrl }, error: null }); // job update

    const request = new NextRequest('http://localhost:3000/api/jobs/123/deliver', {
      method: 'PUT',
      body: JSON.stringify({ delivered_url: deliveredUrl }),
    });

    const response = await PUT(request, { params: Promise.resolve({ id: '123' }) });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.message).toBe('Job delivered successfully');
    expect(data.job.status).toBe('delivered');
    expect(data.job.delivered_url).toBe(deliveredUrl);
    
    expect(mockSupabase.from).toHaveBeenCalledWith('jobs');
    expect(mockSupabase.update).toHaveBeenCalledWith({
      status: 'delivered',
      delivered_at: expect.any(String),
      delivered_url: deliveredUrl,
      updated_at: expect.any(String),
    });
  });

  it('should return 400 if delivered_url is missing', async () => {
    const request = new NextRequest('http://localhost:3000/api/jobs/123/deliver', {
      method: 'PUT',
      body: JSON.stringify({}),
    });

    const response = await PUT(request, { params: Promise.resolve({ id: '123' }) });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('delivered_url is required');
  });

  it('should return 401 if user is not authenticated', async () => {
    (getAuthenticatedUserOrError as any).mockResolvedValue({ user: null, error: 'Unauthorized' });

    const request = new NextRequest('http://localhost:3000/api/jobs/123/deliver', {
      method: 'PUT',
      body: JSON.stringify({ delivered_url: 'https://example.com/work' }),
    });

    const response = await PUT(request, { params: Promise.resolve({ id: '123' }) });
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('should return 403 if agent is not found for user', async () => {
    mockSupabase.single.mockResolvedValue({ data: null, error: new Error('Agent not found') });

    const request = new NextRequest('http://localhost:3000/api/jobs/123/deliver', {
      method: 'PUT',
      body: JSON.stringify({ delivered_url: 'https://example.com/work' }),
    });

    const response = await PUT(request, { params: Promise.resolve({ id: '123' }) });
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toBe('Agent not found for this user');
  });

  it('should return 404 if job is not found', async () => {
    mockSupabase.single
      .mockResolvedValueOnce({ data: mockAgent, error: null }) // agent lookup
      .mockResolvedValueOnce({ data: null, error: new Error('Job not found') }); // job lookup

    const request = new NextRequest('http://localhost:3000/api/jobs/999/deliver', {
      method: 'PUT',
      body: JSON.stringify({ delivered_url: 'https://example.com/work' }),
    });

    const response = await PUT(request, { params: Promise.resolve({ id: '999' }) });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Job not found');
  });

  it('should return 400 if job is not in started state', async () => {
    const jobNotStarted = { ...mockJob, status: 'funded' };

    mockSupabase.single
      .mockResolvedValueOnce({ data: mockAgent, error: null }) // agent lookup
      .mockResolvedValueOnce({ data: jobNotStarted, error: null }); // job lookup

    const request = new NextRequest('http://localhost:3000/api/jobs/123/deliver', {
      method: 'PUT',
      body: JSON.stringify({ delivered_url: 'https://example.com/work' }),
    });

    const response = await PUT(request, { params: Promise.resolve({ id: '123' }) });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Job is not in started state');
  });

  it('should return 403 if agent is not assigned to the job', async () => {
    const jobWithDifferentSeller = { ...mockJob, seller_id: 'different-seller-id' };

    mockSupabase.single
      .mockResolvedValueOnce({ data: mockAgent, error: null }) // agent lookup
      .mockResolvedValueOnce({ data: jobWithDifferentSeller, error: null }); // job lookup

    const request = new NextRequest('http://localhost:3000/api/jobs/123/deliver', {
      method: 'PUT',
      body: JSON.stringify({ delivered_url: 'https://example.com/work' }),
    });

    const response = await PUT(request, { params: Promise.resolve({ id: '123' }) });
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toBe('Agent is not assigned to this job');
  });

  it('should return 500 when job update fails', async () => {
    mockSupabase.single
      .mockResolvedValueOnce({ data: mockAgent, error: null }) // agent lookup
      .mockResolvedValueOnce({ data: mockJob, error: null }) // job lookup
      .mockResolvedValueOnce({ data: null, error: new Error('Update failed') }); // job update

    const request = new NextRequest('http://localhost:3000/api/jobs/123/deliver', {
      method: 'PUT',
      body: JSON.stringify({ delivered_url: 'https://example.com/work' }),
    });

    const response = await PUT(request, { params: Promise.resolve({ id: '123' }) });
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to update job status');
  });

  it('should return 400 for invalid job ID', async () => {
    const request = new NextRequest('http://localhost:3000/api/jobs/invalid/deliver', {
      method: 'PUT',
      body: JSON.stringify({ delivered_url: 'https://example.com/work' }),
    });

    const response = await PUT(request, { params: Promise.resolve({ id: 'invalid' }) });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid job ID');
  });

  it('should return 400 for empty job ID', async () => {
    const request = new NextRequest('http://localhost:3000/api/jobs//deliver', {
      method: 'PUT',
      body: JSON.stringify({ delivered_url: 'https://example.com/work' }),
    });

    const response = await PUT(request, { params: Promise.resolve({ id: '' }) });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid job ID');
  });

  it('should handle unexpected errors gracefully', async () => {
    (getAuthenticatedUserOrError as any).mockRejectedValue(new Error('Unexpected error'));

    const request = new NextRequest('http://localhost:3000/api/jobs/123/deliver', {
      method: 'PUT',
      body: JSON.stringify({ delivered_url: 'https://example.com/work' }),
    });

    const response = await PUT(request, { params: Promise.resolve({ id: '123' }) });
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Internal server error');
  });
});
