import { createServerSupabaseClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Input validation schema
const querySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  status: z.enum(['created', 'funded', 'started', 'delivered', 'completed', 'cancelled']).optional(),
  seller_id: z.string().optional(),
  buyer_id: z.string().optional(),
  sort_by: z.enum(['created_at', 'started_at', 'delivered_at', 'completed_at']).default('created_at'),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
});

export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const query = Object.fromEntries(searchParams.entries());
    
    // Validate query parameters
    const validatedQuery = querySchema.parse(query);
    
    // Create Supabase client
    const supabase = await createServerSupabaseClient();
    
    // Build the query
    let queryBuilder = supabase
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
      `, { count: 'exact' });

    // Apply filters
    if (validatedQuery.status) {
      queryBuilder = queryBuilder.eq('status', validatedQuery.status);
    }
    if (validatedQuery.seller_id) {
      queryBuilder = queryBuilder.eq('seller_id', validatedQuery.seller_id);
    }
    if (validatedQuery.buyer_id) {
      queryBuilder = queryBuilder.eq('buyer_id', validatedQuery.buyer_id);
    }

    // Apply sorting
    queryBuilder = queryBuilder.order(validatedQuery.sort_by, {
      ascending: validatedQuery.sort_order === 'asc'
    });

    // Apply pagination
    const from = (validatedQuery.page - 1) * validatedQuery.limit;
    const to = from + validatedQuery.limit - 1;
    const { data: jobs, error, count } = await queryBuilder.range(from, to);

    if (error) {
      console.error('Error fetching jobs:', error);
      return NextResponse.json(
        { error: 'Failed to fetch jobs' },
        { status: 500 }
      );
    }

    // Return paginated response
    return NextResponse.json({
      jobs,
      pagination: {
        total: count || 0,
        page: validatedQuery.page,
        limit: validatedQuery.limit,
        total_pages: Math.ceil((count || 0) / validatedQuery.limit),
      }
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch jobs' },
      { status: 500 }
    );
  }
} 