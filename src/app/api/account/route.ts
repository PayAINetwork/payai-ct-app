import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getTwitterUserByHandle } from '@/lib/twitter';

export async function PUT() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the user's Twitter handle from their auth metadata
    const twitterHandle = user.user_metadata.user_name;

    if (!twitterHandle) {
      return NextResponse.json({ 
        error: 'Twitter handle not found. Please sign in with Twitter again.' 
      }, { status: 400 });
    }

    // Use the shared Twitter API utility
    let userData;
    try {
      userData = await getTwitterUserByHandle(twitterHandle);
    } catch (error: any) {
      if (error.message?.includes('not found')) {
        return NextResponse.json({ 
          error: 'Twitter user not found. Please check your Twitter handle.' 
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
    const { error: updateError } = await supabase.auth.updateUser({
      data: {
        name: userData.name,
        avatar_url: userData.profileImage,
        bio: userData.bio,
        twitterUserId: userData.twitterUserId,
        twitter_handle: twitterHandle,
        last_synced: new Date().toISOString(),
      },
    });

    if (updateError) {
      return NextResponse.json({ error: updateError.message || 'Failed to update profile' }, { status: 500 });
    }

    // --- Agent linking logic ---
    try {
      // 1. Check for agent with matching handle
      const { data: agent, error: agentError } = await supabase
        .from('agents')
        .select('*')
        .eq('handle', twitterHandle)
        .single();

      if (!agentError && agent && agent.user_id !== user.id) {
        // 2. Update agent's user_id if not already set
        const { error: agentUpdateError } = await supabase
          .from('agents')
          .update({ user_id: user.id })
          .eq('id', agent.id);
        if (agentUpdateError) {
          console.error('Error updating agent user_id:', agentUpdateError);
        }
      }
    } catch (err) {
      console.error('Error linking agent to user:', err);
    }

    return NextResponse.json({
      displayName: userData.name,
      avatarUrl: userData.profileImage,
      bio: userData.bio,
      twitterHandle: twitterHandle,
      email: user.email,
    });
  } catch (error: any) {
    console.error('Error syncing profile with Twitter:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
