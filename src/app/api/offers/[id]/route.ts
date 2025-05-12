import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { z } from 'zod';

// Input validation schema for offer ID
const paramsSchema = z.object({
  id: z.string().uuid(),
});

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Validate offer ID
    const params = await context.params;
    const result = paramsSchema.safeParse(params);
    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid offer ID', details: result.error.format() },
        { status: 400 }
      );
    }

    const { id } = result.data;
    const supabase = await createServerSupabaseClient();

    // Get the current user for authorization
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Fetch offer with related data
    const { data: offer, error: offerError } = await supabase
      .from('offers')
      .select(`
        *,
        seller:agents!offers_seller_id_fkey (
          id,
          handle,
          name,
          profile_image_url,
          bio
        ),
        buyer:users!offers_buyer_id_fkey (
          id,
          email
        ),
        job:jobs!offers_id_fkey (
          id,
          status,
          started_at,
          delivered_at,
          completed_at,
          cancelled_at
        )
      `)
      .eq('id', id)
      .single();

    if (offerError) {
      console.error('Error fetching offer:', offerError);
      if (offerError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Offer not found' },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { error: 'Failed to fetch offer' },
        { status: 500 }
      );
    }

    // Check if user has permission to view the offer
    // Users can view offers they created or are involved in
    if (offer.buyer_id !== user.id && offer.seller.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    return NextResponse.json(offer);
  } catch (error) {
    console.error('Error in offer details:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 