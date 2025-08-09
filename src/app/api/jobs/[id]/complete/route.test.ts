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

describe('PUT /api/jobs/[id]/complete', () => {
  const mockJob = {
    id: '123',
    offer_id: '123e4567-e89b-12d3-a456-426614174002',
    seller_id: '123e4567-e89b-12d3-a456-426614174003',
    buyer_id: '123e4567-e89b-12d3-a456-426614174004',
    status: 'delivered',
    started_at: null,
    delivered_at: null,
    completed_at: null,
    cancelled_at: null,
    created_at: '2024-03-21T00:00:00Z',
    updated_at: '2024-03-21T00:00:00Z',
  };

  const mockSupabase = {
    from: jest.fn(),
  } as any;

  beforeEach(() => {
    jest.clearAllMocks();
    (createServiceRoleSupabaseClient as any).mockReturnValue(mockSupabase);
    // Set up environment variable for testing (privileged user id)
    process.env.VERIFICATION_AGENT = 'privileged-user-id';
  });

  it('should successfully complete a job', async () => {
    // Mock Supabase responses
    const mockSelect = jest.fn().mockReturnThis();
    const mockEq = jest.fn().mockReturnThis();
    const mockSingle = jest.fn()
      .mockResolvedValueOnce({ data: mockJob, error: null }) // job lookup
      .mockResolvedValueOnce({ data: { ...mockJob, status: 'completed' }, error: null }); // job update

    mockSupabase.from.mockReturnValue({
      select: mockSelect,
      eq: mockEq,
      single: mockSingle,
      update: jest.fn().mockReturnThis(),
    });

    ;(getAuthenticatedUserOrError as unknown as jest.Mock).mockResolvedValue({ user: { id: 'privileged-user-id' } as any, error: null } as any);
    const request = new NextRequest('http://localhost:3000/api/jobs/123/complete', { method: 'PUT' });

    const response = await PUT(request, { params: Promise.resolve({ id: '123' }) });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.status).toBe('completed');
  });

  it('should return 401 when user is unauthenticated', async () => {
    ;(getAuthenticatedUserOrError as unknown as jest.Mock).mockResolvedValue({ user: null, error: new Error('no') } as any);
    const request = new NextRequest('http://localhost:3000/api/jobs/123/complete', { method: 'PUT' });
    const response = await PUT(request, { params: Promise.resolve({ id: '123' }) });
    const data = await response.json();
    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('should return 403 when user is not privileged', async () => {
    ;(getAuthenticatedUserOrError as unknown as jest.Mock).mockResolvedValue({ user: { id: 'someone-else' } as any, error: null } as any);
    const request = new NextRequest('http://localhost:3000/api/jobs/123/complete', { method: 'PUT' });
    const response = await PUT(request, { params: Promise.resolve({ id: '123' }) });
    const data = await response.json();
    expect(response.status).toBe(403);
    expect(data.error).toBe('Forbidden');
  });

  it('should return 401 for incorrect API token', async () => {
    const request = new NextRequest('http://localhost:3000/api/jobs/123/complete', {
      method: 'PUT',
      headers: {
        'authorization': 'Bearer incorrect_token',
      },
    });

    const response = await PUT(request, { params: Promise.resolve({ id: '123' }) });
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Incorrect api token.');
  });

  it('should return 404 when job not found', async () => {
    const mockSelect = jest.fn().mockReturnThis();
    const mockEq = jest.fn().mockReturnThis();
    const mockSingle = jest.fn().mockResolvedValue({ data: null, error: new Error('Job not found') });

    mockSupabase.from.mockReturnValue({
      select: mockSelect,
      eq: mockEq,
      single: mockSingle,
    });

    ;(getAuthenticatedUserOrError as unknown as jest.Mock).mockResolvedValue({ user: { id: 'privileged-user-id' } as any, error: null } as any);
    const request = new NextRequest('http://localhost:3000/api/jobs/999/complete', { method: 'PUT' });

    const response = await PUT(request, { params: Promise.resolve({ id: '999' }) });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Job not found');
  });

  it('should return 400 when job is not in delivered state', async () => {
    const jobNotDelivered = { ...mockJob, status: 'started' };

    const mockSelect = jest.fn().mockReturnThis();
    const mockEq = jest.fn().mockReturnThis();
    const mockSingle = jest.fn().mockResolvedValue({ data: jobNotDelivered, error: null });

    mockSupabase.from.mockReturnValue({
      select: mockSelect,
      eq: mockEq,
      single: mockSingle,
    });

    ;(getAuthenticatedUserOrError as unknown as jest.Mock).mockResolvedValue({ user: { id: 'privileged-user-id' } as any, error: null } as any);
    const request = new NextRequest('http://localhost:3000/api/jobs/123/complete', { method: 'PUT' });

    const response = await PUT(request, { params: Promise.resolve({ id: '123' }) });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Job is not in delivered state.');
  });

  it('should return 500 when job update fails', async () => {
    const mockSelect = jest.fn().mockReturnThis();
    const mockEq = jest.fn().mockReturnThis();
    const mockSingle = jest.fn()
      .mockResolvedValueOnce({ data: mockJob, error: null }) // job lookup
      .mockResolvedValueOnce({ data: null, error: new Error('Update failed') }); // job update

    mockSupabase.from.mockReturnValue({
      select: mockSelect,
      eq: mockEq,
      single: mockSingle,
      update: jest.fn().mockReturnThis(),
    });

    ;(getAuthenticatedUserOrError as unknown as jest.Mock).mockResolvedValue({ user: { id: 'privileged-user-id' } as any, error: null } as any);
    const request = new NextRequest('http://localhost:3000/api/jobs/123/complete', { method: 'PUT' });

    const response = await PUT(request, { params: Promise.resolve({ id: '123' }) });
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to update job status');
  });

  it('should return 400 for invalid job ID', async () => {
    ;(getAuthenticatedUserOrError as unknown as jest.Mock).mockResolvedValue({ user: { id: 'privileged-user-id' } as any, error: null } as any);
    const request = new NextRequest('http://localhost:3000/api/jobs/invalid/complete', { method: 'PUT' });

    const response = await PUT(request, { params: Promise.resolve({ id: 'invalid' }) });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid job ID');
  });

  it('should return 400 for empty job ID', async () => {
    ;(getAuthenticatedUserOrError as unknown as jest.Mock).mockResolvedValue({ user: { id: 'privileged-user-id' } as any, error: null } as any);
    const request = new NextRequest('http://localhost:3000/api/jobs//complete', { method: 'PUT' });

    const response = await PUT(request, { params: Promise.resolve({ id: '' }) });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid job ID');
  });

  it('should handle database errors gracefully', async () => {
    const mockSelect = jest.fn().mockReturnThis();
    const mockEq = jest.fn().mockReturnThis();
    const mockSingle = jest.fn().mockResolvedValue({ data: null, error: new Error('Database error') });

    mockSupabase.from.mockReturnValue({
      select: mockSelect,
      eq: mockEq,
      single: mockSingle,
    });

    const request = new NextRequest('http://localhost:3000/api/jobs/123/complete', {
      method: 'PUT',
      headers: {
        'authorization': 'Bearer valid_verification_token',
      },
    });

    const response = await PUT(request, { params: Promise.resolve({ id: '123' }) });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Job not found');
  });

  it('should handle unexpected errors gracefully', async () => {
    // Mock a scenario where Supabase throws an unexpected error
    mockSupabase.from.mockImplementation(() => { throw new Error('Unexpected database error'); });
    ;(getAuthenticatedUserOrError as unknown as jest.Mock).mockResolvedValue({ user: { id: 'privileged-user-id' } as any, error: null } as any);
    const request = new NextRequest('http://localhost:3000/api/jobs/123/complete', { method: 'PUT' });

    const response = await PUT(request, { params: Promise.resolve({ id: '123' }) });
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Internal server error');
  });

  it('should handle jobs in various states correctly', async () => {
    const jobStates = ['created', 'funded', 'started', 'completed', 'cancelled'];
    
    for (const status of jobStates) {
      if (status === 'delivered') continue; // Skip the valid state
      
      const jobWithStatus = { ...mockJob, status };
      
      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockSingle = jest.fn().mockResolvedValue({ data: jobWithStatus, error: null });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
        eq: mockEq,
        single: mockSingle,
      });

      ;(getAuthenticatedUserOrError as unknown as jest.Mock).mockResolvedValue({ user: { id: 'privileged-user-id' } as any, error: null } as any);
      const request = new NextRequest(`http://localhost:3000/api/jobs/123/complete`, { method: 'PUT' });

      const response = await PUT(request, { params: Promise.resolve({ id: '123' }) });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Job is not in delivered state.');
    }
  });
});
