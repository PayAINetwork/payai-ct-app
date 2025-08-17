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
    twitterUserId: '123456789',
  };

  let mockSupabase: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSupabase = {
      auth: {
        getUser: jest.fn().mockResolvedValue({ data: { user: mockUser }, error: null }),
        updateUser: jest.fn().mockResolvedValue({ error: null }),
      },
      from: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
    };
    (createServerSupabaseClient as jest.Mock).mockResolvedValue(mockSupabase);
    (getTwitterUserByHandle as jest.Mock).mockResolvedValue(mockTwitterData);
  });

  it('should update user metadata with current Twitter data and return the updated profile', async () => {
    const response = await PUT();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({
      displayName: mockTwitterData.name,
      avatarUrl: mockTwitterData.profileImage,
      bio: mockTwitterData.bio,
      twitterUserId: mockTwitterData.twitterUserId,
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
    expect(mockSupabase.from).toHaveBeenCalledWith('users');
    expect(mockSupabase.update).toHaveBeenCalledWith({
      name: mockTwitterData.name,
      avatar_url: mockTwitterData.profileImage,
      updated_at: expect.any(String),
    });
    expect(mockSupabase.eq).toHaveBeenCalledWith('id', mockUser.id);
    expect(getTwitterUserByHandle).toHaveBeenCalledWith(mockUser.user_metadata.user_name);
  });

  it('should return 401 if user is not authenticated', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: 'Unauthorized' });
    const response = await PUT();
    const data = await response.json();
    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('should return 400 if twitter handle is missing', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { ...mockUser, user_metadata: {} } }, error: null });
    const response = await PUT();
    const data = await response.json();
    expect(response.status).toBe(400);
    expect(data.error).toMatch(/Twitter handle not found/);
  });

  it('should handle Twitter API errors gracefully', async () => {
    (getTwitterUserByHandle as jest.Mock).mockRejectedValue(new Error('Twitter user not found'));
    const response = await PUT();
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
    
    const response = await PUT();
    const data = await response.json();
    
    // Should still succeed even if public table update fails
    expect(response.status).toBe(200);
    expect(data).toBeDefined();
  });
});

