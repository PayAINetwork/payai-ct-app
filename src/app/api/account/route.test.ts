import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { NextRequest } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getTwitterUserByHandle } from '@/lib/twitter';
import { PUT } from './route';

jest.mock('@/lib/supabase/server', () => ({
  createServerSupabaseClient: jest.fn(),
}));

jest.mock('@/lib/twitter', () => ({
  getTwitterUserByHandle: jest.fn(),
}));

describe('PUT /api/account', () => {
  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    user_metadata: {
      user_name: 'mockuser',
    },
  };

  const mockTwitterData = {
    name: 'Mock User',
    bio: 'Mock bio',
    profileImage: 'https://example.com/avatar.jpg',
    twitterUserId: mockUser.user_metadata.user_name,
  };

  let mockSupabase: any;
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost/api/account';

  beforeEach(() => {
    jest.clearAllMocks();
    mockSupabase = {
      auth: {
        // @ts-expect-error: Mocking Supabase getUser return type for test
        getUser: jest.fn().mockResolvedValue({ data: { user: mockUser }, error: null }),
        // @ts-expect-error: Mocking Supabase updateUser return type for test
        updateUser: jest.fn().mockResolvedValue({ error: null }),
      },
    };
    (createServerSupabaseClient as jest.Mock).mockResolvedValue(mockSupabase);
    (getTwitterUserByHandle as jest.Mock).mockResolvedValue(mockTwitterData);
  });

  it('should update user metadata with current Twitter data and return the updated profile', async () => {
    const req = new NextRequest(API_URL, { method: 'PUT' });
    const response = await PUT(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({
      displayName: mockTwitterData.name,
      avatarUrl: mockTwitterData.profileImage,
      bio: mockTwitterData.bio,
      twitterHandle: mockUser.user_metadata.user_name,
      email: mockUser.email,
    });
    expect(mockSupabase.auth.updateUser).toHaveBeenCalledWith({
      data: expect.objectContaining({
        name: mockTwitterData.name,
        avatar_url: mockTwitterData.profileImage,
        bio: mockTwitterData.bio,
        twitterUserId: mockTwitterData.twitterUserId,
        twitter_handle: mockUser.user_metadata.user_name,
      }),
    });
    expect(getTwitterUserByHandle).toHaveBeenCalledWith(mockUser.user_metadata.user_name);
  });

  it('should return 401 if user is not authenticated', async () => {
    // @ts-expect-error: Mocking unauthenticated user
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: 'Unauthorized' });
    const req = new NextRequest(API_URL, { method: 'PUT' });
    const response = await PUT(req);
    const data = await response.json();
    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('should return 400 if twitter handle is missing', async () => {
    // @ts-expect-error: Mocking missing twitter handle
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { ...mockUser, user_metadata: {} } }, error: null });
    const req = new NextRequest(API_URL, { method: 'PUT' });
    const response = await PUT(req);
    const data = await response.json();
    expect(response.status).toBe(400);
    expect(data.error).toMatch(/Twitter handle not found/);
  });

  it('should return 404 if Twitter user is not found', async () => {
    (getTwitterUserByHandle as jest.Mock).mockRejectedValue(new Error('not found'));
    const req = new NextRequest(API_URL, { method: 'PUT' });
    const response = await PUT(req);
    const data = await response.json();
    expect(response.status).toBe(404);
    expect(data.error).toMatch(/Twitter user not found/);
  });

  it('should return 500 if updateUser fails', async () => {
    // @ts-expect-error: Mocking updateUser error
    mockSupabase.auth.updateUser.mockResolvedValue({ error: { message: 'Update failed' } });
    const req = new NextRequest(API_URL, { method: 'PUT' });
    const response = await PUT(req);
    const data = await response.json();
    expect(response.status).toBe(500);
    expect(data.error).toMatch(/Update failed/);
  });
});

