import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { z } from 'zod';
import { getTwitterUserByHandle } from '@/lib/twitter';

// Schema for agent creation
const createAgentSchema = z.object({
  handle: z.string().min(1).max(50), // Only require handle, we'll fetch the rest from Twitter
});

// List all agents
export async function GET(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    
    // Build the query
    let query = supabase
      .from('agents')
      .select('*')
      .order('created_at', { ascending: false });
    
    // Apply filters if provided
    if (status) {
      query = query.eq('status', status);
    }
    
    if (search) {
      query = query.or(`name.ilike.%${search}%,handle.ilike.%${search}%`);
    }
    
    const { data: agents, error } = await query;
    
    if (error) {
      console.error('Error fetching agents:', error);
      return NextResponse.json(
        { error: 'Failed to fetch agents' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(agents);
  } catch (error) {
    console.error('Error in agent listing:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Create a new agent
export async function POST(request: Request) {
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
    
    // Parse and validate request body
    const body = await request.json();
    const result = createAgentSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: result.error.format() },
        { status: 400 }
      );
    }
    
    const { handle } = result.data;
    
    // Check if agent already exists
    const { data: existingAgent } = await supabase
      .from('agents')
      .select('id')
      .eq('handle', handle)
      .single();
      
    if (existingAgent) {
      return NextResponse.json(
        { error: 'Agent already exists' },
        { status: 409 }
      );
    }
    
    // Fetch Twitter profile data
    const twitterData = await getTwitterUserByHandle(handle);
    
    // Create the agent
    const { data: agent, error: insertError } = await supabase
      .from('agents')
      .insert({
        name: twitterData.name,
        handle,
        bio: twitterData.bio,
        profileImage: twitterData.profileImage,
        status: 'invite',
        twitterUserId: twitterData.twitterUserId,
        lastTwitterSync: new Date().toISOString(),
        created_by: user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();
      
    if (insertError) {
      console.error('Error creating agent:', insertError);
      return NextResponse.json(
        { error: 'Failed to create agent' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(agent);
  } catch (error) {
    console.error('Error in agent creation:', error);
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