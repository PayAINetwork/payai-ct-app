import { TwitterApi } from 'twitter-api-v2';

/**
 * Interface for Twitter user data returned by the API
 */
interface TwitterUserData {
  name: string;
  bio: string;
  profileImage: string;
  twitterUserId: string;
}

// Initialize Twitter client
const twitterClient = new TwitterApi(process.env.TWITTER_BEARER_TOKEN!);

/**
 * Fetches Twitter user data by handle
 * @param handle - Twitter handle (with or without @ symbol)
 * @returns Promise<TwitterUserData> - User data including name, bio, profile image, and Twitter ID
 * @throws Error if user not found or API error occurs
 */
export async function getTwitterUserByHandle(handle: string): Promise<TwitterUserData> {
  try {
    // Remove @ if present
    const cleanHandle = handle.replace('@', '');
    
    // Get user by username
    const user = await twitterClient.v2.userByUsername(cleanHandle, {
      'user.fields': ['name', 'description', 'profile_image_url', 'id'],
    });
    
    if (!user.data) {
      console.debug('Twitter user data not found. User:', user);
      throw new Error('Twitter user data not found');
    }
    
    return {
      name: user.data.name,
      bio: user.data.description || '',
      profileImage: user.data.profile_image_url || '',
      twitterUserId: user.data.id,
    };
  } catch (error) {
    console.error('Error fetching Twitter user:', error);
    throw error;
  }
} 

export async function getTwitterUserById(twitterUserId: string): Promise<TwitterUserData> {
  try {
    // Get user by ID
    const user = await twitterClient.v2.user(twitterUserId, {
      'user.fields': ['name', 'description', 'profile_image_url', 'id'],
    });
    
    if (!user.data) {
      console.debug('Twitter user data not found. User:', user);
      throw new Error('Twitter user data not found');
    }
    
    return {
      name: user.data.name,
      bio: user.data.description || '',
      profileImage: user.data.profile_image_url || '',
      twitterUserId: user.data.id,
    };
  } catch (error) {
    console.error('Error fetching Twitter user by ID:', error);
    throw error;
  }
} 