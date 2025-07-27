import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function PUT(request: Request) {
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
    
    // Parse request body to get the Twitter handle
    const body = await request.json();
    const { twitterHandle } = body;
    
    if (!twitterHandle) {
      return NextResponse.json(
        { error: 'Twitter handle is required' },
        { status: 400 }
      );
    }
    
    // --- Agent linking logic ---
    try {
      // 1. Check for agent with matching handle
      const { data: agent, error: agentError } = await supabase
        .from('agents')
        .select('*')
        .eq('handle', twitterHandle)
        .single();

      if (agentError) {
        if (agentError.code === 'PGRST116') {
          return NextResponse.json(
            { error: 'Agent profile not found' },
            { status: 404 }
          );
        }
        
        console.error('Error fetching agent:', agentError);
        return NextResponse.json(
          { error: 'Failed to fetch agent' },
          { status: 500 }
        );
      }

      if (agent && agent.user_id !== user.id) {
        // 2. Update agent's user_id if not already set
        const { error: agentUpdateError } = await supabase
          .from('agents')
          .update({ user_id: user.id })
          .eq('id', agent.id);
          
        if (agentUpdateError) {
          console.error('Error updating agent user_id:', agentUpdateError);
          return NextResponse.json(
            { error: 'Failed to link agent to user' },
            { status: 500 }
          );
        }
      }

      return NextResponse.json({ 
        success: true, 
        message: 'Agent linked successfully',
        agent 
      });
      
    } catch (err) {
      console.error('Error linking agent to user:', err);
      return NextResponse.json(
        { error: 'Failed to link agent to user' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in agent link:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
