import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { PUT } from './route';
import { createServiceRoleSupabaseClient } from '@/lib/supabase/server';
import * as auth from '@/lib/auth';
import { NextRequest } from 'next/server';

// Mock dependencies
jest.mock('@/lib/supabase/server', () => ({
  createServiceRoleSupabaseClient: jest.fn(),
}));
jest.mock('@/lib/auth', () => ({
  getAuthenticatedUserOrError: jest.fn(),
}));

const mockedGetAuthenticatedUserOrError = auth.getAuthenticatedUserOrError as unknown as jest.Mock;

describe('PUT /api/jobs/[id]/fund', () => {
  const mockJob = {
    id: '123',
    offer_id: '123e4567-e89b-12d3-a456-426614174002',
    seller_id: '123e4567-e89b-12d3-a456-426614174003',
    buyer_id: '123e4567-e89b-12d3-a456-426614174004',
    status: 'created',
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

  it('should successfully fund a job', async () => {
    // Mock Supabase responses
    const mockSelect = jest.fn().mockReturnThis() as unknown as jest.Mock;
    const mockEq = jest.fn().mockReturnThis() as unknown as jest.Mock;
    const mockSingle = jest.fn() as unknown as jest.Mock;
    (mockSingle as any)
      .mockResolvedValueOnce({ data: mockJob, error: null } as any) // job lookup
      .mockResolvedValueOnce({ data: { ...mockJob, status: 'funded' }, error: null } as any); // job update

    mockSupabase.from.mockReturnValue({
      select: mockSelect,
      eq: mockEq,
      single: mockSingle,
      update: jest.fn().mockReturnThis(),
    });

    (mockedGetAuthenticatedUserOrError as any).mockResolvedValue({ user: { id: 'privileged-user-id' } as any, error: null } as any);

    const request = new NextRequest('http://localhost:3000/api/jobs/123/fund', { method: 'PUT' });

    const response = await PUT(request, { params: Promise.resolve({ id: '123' }) });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.status).toBe('funded');
  });

  it('should return 401 when user is unauthenticated', async () => {
    (mockedGetAuthenticatedUserOrError as any).mockResolvedValue({ user: null, error: new Error('no') } as any);
    const request = new NextRequest('http://localhost:3000/api/jobs/123/fund', { method: 'PUT' });
    const response = await PUT(request, { params: Promise.resolve({ id: '123' }) });
    const data = await response.json();
    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('should return 403 when user is not privileged', async () => {
    (mockedGetAuthenticatedUserOrError as any).mockResolvedValue({ user: { id: 'someone-else' } as any, error: null } as any);
    const request = new NextRequest('http://localhost:3000/api/jobs/123/fund', { method: 'PUT' });
    const response = await PUT(request, { params: Promise.resolve({ id: '123' }) });
    const data = await response.json();
    expect(response.status).toBe(403);
    expect(data.error).toBe('Forbidden');
  });

  // incorrect token test removed due to middleware+helper flow

  it('should return 404 when job not found', async () => {
    const mockSelect = jest.fn().mockReturnThis() as unknown as jest.Mock;
    const mockEq = jest.fn().mockReturnThis() as unknown as jest.Mock;
    const mockSingle = jest.fn().mockResolvedValue({ data: null, error: new Error('Job not found') } as any) as unknown as jest.Mock;

    mockSupabase.from.mockReturnValue({
      select: mockSelect,
      eq: mockEq,
      single: mockSingle,
    });

    (mockedGetAuthenticatedUserOrError as any).mockResolvedValue({ user: { id: 'privileged-user-id' } as any, error: null } as any);
    const request = new NextRequest('http://localhost:3000/api/jobs/999/fund', { method: 'PUT' });

    const response = await PUT(request, { params: Promise.resolve({ id: '999' }) });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Job not found');
  });

  it('should return 400 when job is not in created state', async () => {
    const jobNotCreated = { ...mockJob, status: 'funded' };

    const mockSelect = jest.fn().mockReturnThis() as unknown as jest.Mock;
    const mockEq = jest.fn().mockReturnThis() as unknown as jest.Mock;
    const mockSingle = jest.fn().mockResolvedValue({ data: jobNotCreated, error: null } as any) as unknown as jest.Mock;

    mockSupabase.from.mockReturnValue({
      select: mockSelect,
      eq: mockEq,
      single: mockSingle,
    });

    (mockedGetAuthenticatedUserOrError as any).mockResolvedValue({ user: { id: 'privileged-user-id' } as any, error: null } as any);
    const request = new NextRequest('http://localhost:3000/api/jobs/123/fund', { method: 'PUT' });

    const response = await PUT(request, { params: Promise.resolve({ id: '123' }) });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Job is not in created state.');
  });

  it('should return 500 when job update fails', async () => {
    const mockSelect = jest.fn().mockReturnThis() as unknown as jest.Mock;
    const mockEq = jest.fn().mockReturnThis() as unknown as jest.Mock;
    const mockSingle = jest.fn() as unknown as jest.Mock;
    (mockSingle as any)
      .mockResolvedValueOnce({ data: mockJob, error: null } as any) // job lookup
      .mockResolvedValueOnce({ data: null, error: new Error('Update failed') } as any); // job update

    mockSupabase.from.mockReturnValue({
      select: mockSelect,
      eq: mockEq,
      single: mockSingle,
      update: jest.fn().mockReturnThis(),
    });

    (mockedGetAuthenticatedUserOrError as any).mockResolvedValue({ user: { id: 'privileged-user-id' } as any, error: null } as any);
    const request = new NextRequest('http://localhost:3000/api/jobs/123/fund', { method: 'PUT' });

    const response = await PUT(request, { params: Promise.resolve({ id: '123' }) });
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to update job status');
  });

  it('should return 400 for invalid job ID', async () => {
    (mockedGetAuthenticatedUserOrError as any).mockResolvedValue({ user: { id: 'privileged-user-id' } as any, error: null } as any);
    const request = new NextRequest('http://localhost:3000/api/jobs/invalid/fund', { method: 'PUT' });

    const response = await PUT(request, { params: Promise.resolve({ id: 'invalid' }) });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid job ID');
  });

  it('should return 400 for empty job ID', async () => {
    (mockedGetAuthenticatedUserOrError as any).mockResolvedValue({ user: { id: 'privileged-user-id' } as any, error: null } as any);
    const request = new NextRequest('http://localhost:3000/api/jobs//fund', { method: 'PUT' });

    const response = await PUT(request, { params: Promise.resolve({ id: '' }) });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid job ID');
  });

  it('should handle database errors gracefully', async () => {
    const mockSelect = jest.fn().mockReturnThis() as unknown as jest.Mock;
    const mockEq = jest.fn().mockReturnThis() as unknown as jest.Mock;
    const mockSingle = jest.fn().mockResolvedValue({ data: null, error: new Error('Database error') } as any) as unknown as jest.Mock;

    mockSupabase.from.mockReturnValue({
      select: mockSelect,
      eq: mockEq,
      single: mockSingle,
    });

    (mockedGetAuthenticatedUserOrError as any).mockResolvedValue({ user: { id: 'privileged-user-id' } as any, error: null } as any);
    const request = new NextRequest('http://localhost:3000/api/jobs/123/fund', { method: 'PUT' });

    const response = await PUT(request, { params: Promise.resolve({ id: '123' }) });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Job not found');
  });

  it('should handle unexpected errors gracefully', async () => {
    // Mock a scenario where Supabase throws an unexpected error
    mockSupabase.from.mockImplementation(() => {
      throw new Error('Unexpected database error');
    });

    const request = new NextRequest('http://localhost:3000/api/jobs/123/fund', {
      method: 'PUT',
      headers: {
        'authorization': 'Bearer valid_verification_token',
      },
    });

    const response = await PUT(request, { params: Promise.resolve({ id: '123' }) });
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Internal server error');
  });
});
