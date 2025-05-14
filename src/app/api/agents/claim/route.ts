import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getTwitterUserByHandle } from '@/lib/twitter';

export async function POST() {
  try {
    const supabase = await createServerSupabaseClient();
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Get the user's Twitter handle from their auth metadata
    const { data: { user: authUser } } = await supabase.auth.getUser();
    const twitterHandle = authUser?.user_metadata?.twitter_handle;
    
    if (!twitterHandle) {
      return NextResponse.json(
        { error: 'Twitter handle not found in user metadata' },
        { status: 400 }
      );
    }
    
    // Find the agent profile
    const { data: agent, error: fetchError } = await supabase
      .from('agents')
      .select('*')
      .eq('handle', twitterHandle)
      .single();
      
    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Agent profile not found' },
          { status: 404 }
        );
      }
      
      console.error('Error fetching agent:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch agent' },
        { status: 500 }
      );
    }
    
    // Verify the agent hasn't been claimed
    if (agent.status === 'live') {
      return NextResponse.json(
        { error: 'Agent profile already claimed' },
        { status: 409 }
      );
    }
    
    // Fetch latest Twitter profile data
    const twitterData = await getTwitterUserByHandle(twitterHandle);
    
    // Update the agent profile
    const { data: updatedAgent, error: updateError } = await supabase
      .from('agents')
      .update({
        name: twitterData.name,
        bio: twitterData.bio,
        profileImage: twitterData.profileImage,
        status: 'live',
        twitterUserId: twitterData.twitterUserId,
        lastTwitterSync: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', agent.id)
      .select()
      .single();
      
    if (updateError) {
      console.error('Error updating agent:', updateError);
      return NextResponse.json(
        { error: 'Failed to update agent' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(updatedAgent);
  } catch (error) {
    console.error('Error in agent claim:', error);
    if (error instanceof Error && error.message === 'Twitter user not found') {
      return NextResponse.json(
        { error: 'Twitter user not found' },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 