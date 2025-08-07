import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
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