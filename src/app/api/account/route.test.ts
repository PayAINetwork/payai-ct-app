import { NextRequest } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getTwitterUserById } from '@/lib/twitter';
import { getAuthenticatedUserOrError } from '@/lib/auth';
import { PUT } from './route';

jest.mock('@/lib/supabase/server', () => ({
  createServerSupabaseClient: jest.fn(),
}));

jest.mock('@/lib/twitter', () => ({
  getTwitterUserById: jest.fn(),
}));

jest.mock('@/lib/auth', () => ({
  getAuthenticatedUserOrError: jest.fn(),
}));

describe('PUT /api/account', () => {
  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    user_metadata: {
      sub: '123456789', // Twitter ID from OAuth
    },
  };

  const mockTwitterData = {
    name: 'Mock User',
    bio: 'Mock bio',
    profileImage: 'https://example.com/avatar.jpg',
    twitterUserId: '123456789',
  };

  let mockSupabase: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSupabase = {
      auth: {
        updateUser: jest.fn().mockResolvedValue({ error: null }),
      },
      from: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
    };
    (createServerSupabaseClient as jest.Mock).mockResolvedValue(mockSupabase);
    (getTwitterUserById as jest.Mock).mockResolvedValue(mockTwitterData);
    (getAuthenticatedUserOrError as jest.Mock).mockResolvedValue({ user: mockUser, error: null });
  });

  it('should update user metadata with current Twitter data and return the updated profile', async () => {
    const req = new NextRequest('http://localhost/api/account', { method: 'PUT' });
    const response = await PUT(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({
      displayName: mockTwitterData.name,
      avatarUrl: mockTwitterData.profileImage,
      bio: mockTwitterData.bio,
      twitterUserId: mockTwitterData.twitterUserId,
      email: mockUser.email,
    });
    expect(getAuthenticatedUserOrError).toHaveBeenCalledWith(req);
    expect(mockSupabase.auth.updateUser).toHaveBeenCalledWith({
      data: expect.objectContaining({
        name: mockTwitterData.name,
        avatar_url: mockTwitterData.profileImage,
        bio: mockTwitterData.bio,
        twitterUserId: mockTwitterData.twitterUserId,
        twitter_handle: mockTwitterData.twitterUserId,
      }),
    });
    expect(mockSupabase.from).toHaveBeenCalledWith('users');
    expect(mockSupabase.update).toHaveBeenCalledWith({
      name: mockTwitterData.name,
      avatar_url: mockTwitterData.profileImage,
      updated_at: expect.any(String),
    });
    expect(mockSupabase.eq).toHaveBeenCalledWith('id', mockUser.id);
    expect(getTwitterUserById).toHaveBeenCalledWith(mockUser.user_metadata.sub);
  });

  it('should return 401 if user is not authenticated', async () => {
    (getAuthenticatedUserOrError as jest.Mock).mockResolvedValue({ user: null, error: 'Unauthorized' });
    const req = new NextRequest('http://localhost/api/account', { method: 'PUT' });
    const response = await PUT(req);
    const data = await response.json();
    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('should return 400 if twitter user id is missing', async () => {
    (getAuthenticatedUserOrError as jest.Mock).mockResolvedValue({ 
      user: { ...mockUser, user_metadata: {} }, 
      error: null 
    });
    const req = new NextRequest('http://localhost/api/account', { method: 'PUT' });
    const response = await PUT(req);
    const data = await response.json();
    expect(response.status).toBe(400);
    expect(data.error).toMatch(/Twitter ID not found/);
  });

  it('should use provider_id if sub is not available', async () => {
    const mockUserWithProviderId = {
      ...mockUser,
      user_metadata: {
        provider_id: '987654321',
      },
    };
    (getAuthenticatedUserOrError as jest.Mock).mockResolvedValue({ 
      user: mockUserWithProviderId, 
      error: null 
    });
    
    const req = new NextRequest('http://localhost/api/account', { method: 'PUT' });
    const response = await PUT(req);
    const data = await response.json();
    
    expect(response.status).toBe(200);
    expect(getTwitterUserById).toHaveBeenCalledWith('987654321');
  });

  it('should handle Twitter API errors gracefully', async () => {
    (getTwitterUserById as jest.Mock).mockRejectedValue(new Error('Twitter user not found'));
    const req = new NextRequest('http://localhost/api/account', { method: 'PUT' });
    const response = await PUT(req);
    const data = await response.json();
    expect(response.status).toBe(404);
    expect(data.error).toMatch(/Twitter user not found/);
  });

  it('should continue even if public users table update fails', async () => {
    mockSupabase.from.mockReturnValue({
      update: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          error: new Error('Database error')
        })
      })
    });
    
    const req = new NextRequest('http://localhost/api/account', { method: 'PUT' });
    const response = await PUT(req);
    const data = await response.json();
    
    // Should still succeed even if public table update fails
    expect(response.status).toBe(200);
    expect(data).toBeDefined();
  });
});

