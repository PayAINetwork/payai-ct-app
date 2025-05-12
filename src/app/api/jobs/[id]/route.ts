import { createServerSupabaseClient } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Input validation schema
const paramsSchema = z.object({
  id: z.string().uuid(),
});

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Validate job ID
    const params = await context.params;
    const validatedParams = paramsSchema.parse(params);
    
    // Create Supabase client
    const supabase = await createServerSupabaseClient();
    
    // Fetch job with related data
    const { data: job, error } = await supabase
      .from('jobs')
      .select(`
        *,
        seller:agents!jobs_seller_id_fkey (
          id,
          handle,
          name,
          profile_image_url
        ),
        buyer:users!jobs_buyer_id_fkey (
          id,
          email
        ),
        offer:offers!jobs_offer_id_fkey (
          id,
          amount,
          currency,
          description
        )
      `)
      .eq('id', validatedParams.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Job not found' },
          { status: 404 }
        );
      }
      
      console.error('Error fetching job:', error);
      return NextResponse.json(
        { error: 'Failed to fetch job' },
        { status: 500 }
      );
    }

    return NextResponse.json(job);

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid job ID' },
        { status: 400 }
      );
    }

    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch job' },
      { status: 500 }
    );
  }
} 