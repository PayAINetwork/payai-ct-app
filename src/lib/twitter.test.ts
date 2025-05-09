import { getTwitterUserByHandle } from './twitter';
import { TwitterApi } from 'twitter-api-v2';

// Mock the Twitter API client
jest.mock('twitter-api-v2', () => {
  const mockUserByUsername = jest.fn();
  return {
    TwitterApi: jest.fn().mockImplementation(() => ({
      v2: {
        userByUsername: mockUserByUsername,
      },
    })),
    mockUserByUsername, // Export for test access
  };
});

// Get the mock function
const { mockUserByUsername } = jest.requireMock('twitter-api-v2');

describe('Twitter API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getTwitterUserByHandle', () => {
    it('should fetch user data successfully', async () => {
      const mockUserData = {
        data: {
          name: 'Test User',
          description: 'Test bio',
          profile_image_url: 'https://example.com/avatar.jpg',
          id: '123456789',
        },
      };

      mockUserByUsername.mockResolvedValue(mockUserData);

      const result = await getTwitterUserByHandle('testuser');

      expect(result).toEqual({
        name: 'Test User',
        bio: 'Test bio',
        profileImage: 'https://example.com/avatar.jpg',
        twitterUserId: '123456789',
      });
      expect(mockUserByUsername).toHaveBeenCalledWith('testuser', {
        'user.fields': ['name', 'description', 'profile_image_url', 'id'],
      });
    });

    it('should handle @ symbol in handle', async () => {
      const mockUserData = {
        data: {
          name: 'Test User',
          description: 'Test bio',
          profile_image_url: 'https://example.com/avatar.jpg',
          id: '123456789',
        },
      };

      mockUserByUsername.mockResolvedValue(mockUserData);

      await getTwitterUserByHandle('@testuser');

      expect(mockUserByUsername).toHaveBeenCalledWith('testuser', {
        'user.fields': ['name', 'description', 'profile_image_url', 'id'],
      });
    });

    it('should handle missing user data', async () => {
      mockUserByUsername.mockResolvedValue({ data: null });

      await expect(getTwitterUserByHandle('nonexistent')).rejects.toThrow('Twitter user not found');
    });

    it('should handle API errors', async () => {
      mockUserByUsername.mockRejectedValue(new Error('API Error'));

      await expect(getTwitterUserByHandle('testuser')).rejects.toThrow('API Error');
    });
  });
}); 