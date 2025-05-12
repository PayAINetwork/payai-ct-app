import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { z } from 'zod';

// Schema for agent updates
const updateAgentSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  handle: z.string().min(1).max(50).optional(),
  bio: z.string().min(1).max(500).optional(),
  profileImage: z.string().url().optional(),
  twitterUrl: z.string().url().optional(),
  status: z.enum(['live', 'invite']).optional(),
});

// Get a specific agent
export async function GET(
  request: Request,
  context: { params: Promise<{ handle: string }> }
) {
  try {
    const supabase = await createServerSupabaseClient();
    
    const { handle } = await context.params;

    const { data: agent, error } = await supabase
      .from('agents')
      .select('*')
      .eq('handle', handle)
      .single();
      
    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Agent not found' },
          { status: 404 }
        );
      }
      
      console.error('Error fetching agent:', error);
      return NextResponse.json(
        { error: 'Failed to fetch agent' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(agent);
  } catch (error) {
    console.error('Error in agent fetch:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Update an agent
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ handle: string }> }
) {
  try {
    const supabase = await createServerSupabaseClient();

    const { handle } = await context.params;

    // Validate request body
    const body = await request.json();
    const result = updateAgentSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }

    // Get user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get agent
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select('*')
      .eq('handle', handle)
      .single();

    if (agentError) {
      if (agentError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Agent not found' },
          { status: 404 }
        );
      }
      console.error('Error fetching agent:', agentError);
      return NextResponse.json(
        { error: 'Failed to fetch agent' },
        { status: 500 }
      );
    }

    // Check authorization
    if (agent.created_by !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Check handle uniqueness if handle is being updated
    if (body.handle && body.handle !== agent.handle) {
      // Fetch the agent's Twitter handle
      const { data: twitterData, error: twitterError } = await supabase
        .from('agents')
        .select('twitter_handle')
        .eq('handle', handle)
        .single();

      if (twitterError) {
        console.error('Error fetching Twitter handle:', twitterError);
        return NextResponse.json(
          { error: 'Failed to fetch Twitter handle' },
          { status: 500 }
        );
      }

      if (!twitterData || twitterData.twitter_handle !== body.handle) {
        return NextResponse.json(
          { error: 'Handle can only be updated to the agent\'s current Twitter handle' },
          { status: 400 }
        );
      }

      const { data: existingAgent, error: checkError } = await supabase
        .from('agents')
        .select('handle')
        .neq('handle', handle)
        .eq('handle', body.handle)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        console.error('Error checking handle uniqueness:', checkError);
        return NextResponse.json(
          { error: 'Failed to check handle uniqueness' },
          { status: 500 }
        );
      }

      if (existingAgent) {
        return NextResponse.json(
          { error: 'Handle already taken' },
          { status: 409 }
        );
      }
    }

    // Update agent
    const { data: updatedAgent, error: updateError } = await supabase
      .from('agents')
      .update({
        ...body,
        updated_at: new Date().toISOString(),
      })
      .eq('handle', handle)
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
    console.error('Error in agent update:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Delete an agent
export async function DELETE(
  request: Request,
  context: { params: Promise<{ handle: string }> }
) {
  try {
    const supabase = await createServerSupabaseClient();
    
    const { handle } = await context.params;

    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Verify the agent exists and belongs to the user
    const { data: existingAgent, error: fetchError } = await supabase
      .from('agents')
      .select('created_by')
      .eq('handle', handle)
      .single();
      
    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Agent not found' },
          { status: 404 }
        );
      }
      
      console.error('Error fetching agent:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch agent' },
        { status: 500 }
      );
    }
    
    if (existingAgent.created_by !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }
    
    // Delete the agent
    const { error: deleteError } = await supabase
      .from('agents')
      .delete()
      .eq('handle', handle);
      
    if (deleteError) {
      console.error('Error deleting agent:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete agent' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in agent deletion:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 