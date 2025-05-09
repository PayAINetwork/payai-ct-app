import { NextResponse } from 'next/server';
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
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createServerSupabaseClient();
    
    const { data: agent, error } = await supabase
      .from('agents')
      .select('*')
      .eq('id', params.id)
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
  request: Request,
  { params }: { params: { id: string } }
) {
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
    
    // Verify the agent exists and belongs to the user
    const { data: existingAgent, error: fetchError } = await supabase
      .from('agents')
      .select('created_by')
      .eq('id', params.id)
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
    
    // Parse and validate request body
    const body = await request.json();
    const result = updateAgentSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: result.error.format() },
        { status: 400 }
      );
    }
    
    const updateData = result.data;
    
    // If handle is being updated, check if it's already taken
    if (updateData.handle) {
      const { data: handleCheck } = await supabase
        .from('agents')
        .select('id')
        .eq('handle', updateData.handle)
        .neq('id', params.id)
        .single();
        
      if (handleCheck) {
        return NextResponse.json(
          { error: 'Handle already taken' },
          { status: 409 }
        );
      }
    }
    
    // Update the agent
    const { data: agent, error: updateError } = await supabase
      .from('agents')
      .update({
        ...updateData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.id)
      .select()
      .single();
      
    if (updateError) {
      console.error('Error updating agent:', updateError);
      return NextResponse.json(
        { error: 'Failed to update agent' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(agent);
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
  { params }: { params: { id: string } }
) {
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
    
    // Verify the agent exists and belongs to the user
    const { data: existingAgent, error: fetchError } = await supabase
      .from('agents')
      .select('created_by')
      .eq('id', params.id)
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
      .eq('id', params.id);
      
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