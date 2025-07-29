import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { PUT } from './route';
import { createServiceRoleSupabaseClient } from '@/lib/supabase/server';
import { NextRequest } from 'next/server';

// Mock dependencies
jest.mock('@/lib/supabase/server', () => ({
  createServiceRoleSupabaseClient: jest.fn(),
}));

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
    // Set up environment variable for testing
    process.env.VERIFICATION_AGENT = 'valid_verification_token';
  });

  it('should successfully fund a job', async () => {
    // Mock Supabase responses
    const mockSelect = jest.fn().mockReturnThis();
    const mockEq = jest.fn().mockReturnThis();
    const mockSingle = jest.fn()
      .mockResolvedValueOnce({ data: mockJob, error: null }) // job lookup
      .mockResolvedValueOnce({ data: { ...mockJob, status: 'funded' }, error: null }); // job update

    mockSupabase.from.mockReturnValue({
      select: mockSelect,
      eq: mockEq,
      single: mockSingle,
      update: jest.fn().mockReturnThis(),
    });

    const request = new NextRequest('http://localhost:3000/api/jobs/123/fund', {
      method: 'PUT',
      headers: {
        'authorization': 'Bearer valid_verification_token',
      },
    });

    const response = await PUT(request, { params: Promise.resolve({ id: '123' }) });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.status).toBe('funded');
  });

  it('should return 401 for missing authorization header', async () => {
    const request = new NextRequest('http://localhost:3000/api/jobs/123/fund', {
      method: 'PUT',
    });

    const response = await PUT(request, { params: Promise.resolve({ id: '123' }) });
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Missing or invalid authorization header');
  });

  it('should return 401 for invalid authorization header format', async () => {
    const request = new NextRequest('http://localhost:3000/api/jobs/123/fund', {
      method: 'PUT',
      headers: {
        'authorization': 'InvalidFormat valid_verification_token',
      },
    });

    const response = await PUT(request, { params: Promise.resolve({ id: '123' }) });
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Missing or invalid authorization header');
  });

  it('should return 401 for incorrect API token', async () => {
    const request = new NextRequest('http://localhost:3000/api/jobs/123/fund', {
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

    const request = new NextRequest('http://localhost:3000/api/jobs/999/fund', {
      method: 'PUT',
      headers: {
        'authorization': 'Bearer valid_verification_token',
      },
    });

    const response = await PUT(request, { params: Promise.resolve({ id: '999' }) });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Job not found');
  });

  it('should return 400 when job is not in created state', async () => {
    const jobNotCreated = { ...mockJob, status: 'funded' };

    const mockSelect = jest.fn().mockReturnThis();
    const mockEq = jest.fn().mockReturnThis();
    const mockSingle = jest.fn().mockResolvedValue({ data: jobNotCreated, error: null });

    mockSupabase.from.mockReturnValue({
      select: mockSelect,
      eq: mockEq,
      single: mockSingle,
    });

    const request = new NextRequest('http://localhost:3000/api/jobs/123/fund', {
      method: 'PUT',
      headers: {
        'authorization': 'Bearer valid_verification_token',
      },
    });

    const response = await PUT(request, { params: Promise.resolve({ id: '123' }) });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Job is not in created state.');
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

    const request = new NextRequest('http://localhost:3000/api/jobs/123/fund', {
      method: 'PUT',
      headers: {
        'authorization': 'Bearer valid_verification_token',
      },
    });

    const response = await PUT(request, { params: Promise.resolve({ id: '123' }) });
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to update job status');
  });

  it('should return 400 for invalid job ID', async () => {
    const request = new NextRequest('http://localhost:3000/api/jobs/invalid/fund', {
      method: 'PUT',
      headers: {
        'authorization': 'Bearer valid_verification_token',
      },
    });

    const response = await PUT(request, { params: Promise.resolve({ id: 'invalid' }) });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid job ID');
  });

  it('should return 400 for empty job ID', async () => {
    const request = new NextRequest('http://localhost:3000/api/jobs//fund', {
      method: 'PUT',
      headers: {
        'authorization': 'Bearer valid_verification_token',
      },
    });

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

    const request = new NextRequest('http://localhost:3000/api/jobs/123/fund', {
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
