import { createServerSupabaseClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Input validation schema
const querySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  status: z.enum(['created', 'funded', 'started', 'delivered', 'completed']).optional(),
  seller_id: z.string().optional(),
  buyer_id: z.string().optional(),
  sort_by: z.enum(['created_at', 'amount']).default('created_at'),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
});

export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const query = Object.fromEntries(searchParams.entries());
    const showAll = searchParams.get('show_all') === 'true';
    
    // Validate query parameters
    const validatedQuery = querySchema.parse(query);
    
    // Create Supabase client
    const supabase = await createServerSupabaseClient();

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Build the query
    let queryBuilder = supabase
      .from('offers')
      .select(`
        *,
        seller:agents!offers_seller_id_fkey (
          id
        ),
        buyer:users!offers_buyer_id_fkey (
          id
        ),
        job:jobs!jobs_offer_id_fkey (
          id,
          status
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

    // If not showAll, filter to offers where user is seller or buyer
    if (!showAll) {
      queryBuilder = queryBuilder.or(`seller_id.eq.${user.id},buyer_id.eq.${user.id}`);
    }

    // Apply sorting
    queryBuilder = queryBuilder.order(validatedQuery.sort_by, {
      ascending: validatedQuery.sort_order === 'asc'
    });

    // Apply pagination
    const from = (validatedQuery.page - 1) * validatedQuery.limit;
    const to = from + validatedQuery.limit - 1;
    queryBuilder = queryBuilder.range(from, to);

    // Execute query
    const { data: offers, error, count } = await queryBuilder;

    if (error) {
      console.error('Error fetching offers:', error);
      return NextResponse.json(
        { error: 'Failed to fetch offers' },
        { status: 500 }
      );
    }

    // Return paginated response
    return NextResponse.json({
      offers,
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
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 