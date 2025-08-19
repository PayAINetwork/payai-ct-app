import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getTwitterUserById } from '@/lib/twitter';
import { getAuthenticatedUserOrError } from '@/lib/auth';

export async function PUT(request: Request) {
  try {
    // Get the authenticated user or return 401
    const { user, error } = await getAuthenticatedUserOrError(request);
    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the user's Twitter ID from their auth metadata
    // Try both sub and provider_id as Twitter OAuth might use either
    const twitterUserId = user.user_metadata.provider_id;

    if (!twitterUserId) {
      return NextResponse.json({ 
        error: 'Twitter ID not found. Please sign in with Twitter again.' 
      }, { status: 400 });
    }

    // Use the shared Twitter API utility to get user data by ID
    let userData;
    try {
      userData = await getTwitterUserById(twitterUserId);
    } catch (error: any) {
      if (error.message?.includes('not found')) {
        return NextResponse.json({ 
          error: 'Twitter user not found. Please check your Twitter account.' 
        }, { status: 404 });
      }
      if (error.message?.includes('Unauthorized')) {
        return NextResponse.json({ 
          error: 'Twitter API authentication failed. Please contact support.' 
        }, { status: 500 });
      }
      if (error.message?.includes('rate limit')) {
        return NextResponse.json({ 
          error: 'Twitter API rate limit exceeded. Please try again later.' 
        }, { status: 429 });
      }
      return NextResponse.json({ error: error.message || 'Failed to fetch Twitter profile' }, { status: 500 });
    }

    // Update user metadata with real Twitter data
    const supabase = await createServerSupabaseClient();
    const { error: updateError } = await supabase.auth.updateUser({
      data: {
        name: userData.name,
        avatar_url: userData.profileImage,
        bio: userData.bio,
        twitterUserId: userData.twitterUserId,
        twitter_handle: userData.name,
        last_synced: new Date().toISOString(),
      },
    });

    if (updateError) {
      return NextResponse.json({ error: updateError.message || 'Failed to update auth profile' }, { status: 500 });
    }

    // Update the public.users table
    const { error: publicUpdateError } = await supabase
      .from('users')
      .update({
        name: userData.name,
        avatar_url: userData.profileImage,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (publicUpdateError) {
      console.error('Error updating public users table:', publicUpdateError);
      // Don't fail the entire request if public table update fails
      // The auth update was successful, so we can still return success
    }

    return NextResponse.json({
      displayName: userData.name,
      avatarUrl: userData.profileImage,
      bio: userData.bio,
      twitterUserId: userData.twitterUserId,
      email: user.email,
    });
  } catch (error: any) {
    console.error('Error syncing profile with Twitter:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
