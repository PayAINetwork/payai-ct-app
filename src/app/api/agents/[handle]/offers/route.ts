import { NextResponse } from 'next/server';
import { createServerSupabaseClient, createServiceRoleSupabaseClient } from '@/lib/supabase/server';
import { z } from 'zod';
import { getTwitterUserByHandle } from '@/lib/twitter';
import { getAuthenticatedUserOrError } from '@/lib/auth';

// Schema for offer creation
const createOfferSchema = z.object({
  amount: z.number().positive(),
  currency: z.string().min(1),
  description: z.string().min(1),
});

export async function POST(
  request: Request,
  context: { params: Promise<{ handle: string }> }
) {
  try {
    // get the authenticated user or return 401
    const { user, error } = await getAuthenticatedUserOrError(request);
    if (error || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Parse and validate request body
    const body = await request.json();
    const result = createOfferSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: result.error.format() },
        { status: 400 }
      );
    }
    
    const { amount, currency, description } = result.data;
    const { handle } = await context.params;

    // Check if agent exists
    const supabase = await createServerSupabaseClient();
    const { data: existingAgent } = await supabase
      .from('agents')
      .select('id')
      .eq('handle', handle)
      .single();

    let agentId: string;
    const supabaseServiceRole = createServiceRoleSupabaseClient();

    // If agent doesn't exist, create it with Twitter data and no user_id
    if (!existingAgent) {
      try {
        // Fetch Twitter profile data
        const twitterData = await getTwitterUserByHandle(handle);
        // Create the agent (user_id is null, is_verified is false)
        const { data: newAgent, error: insertError } = await supabaseServiceRole
          .from('agents')
          .insert({
            handle: handle,
            name: twitterData.name,
            avatar_url: twitterData.profileImage,
            twitter_user_id: twitterData.twitterUserId,
            bio: twitterData.bio,
            is_verified: false,
            created_by: user.id
          })
          .select('id')
          .single();
        if (insertError) {
          console.error('Error creating agent:', insertError);
          return NextResponse.json(
            { error: 'Failed to create agent' },
            { status: 500 }
          );
        }
        agentId = newAgent.id;
      } catch (error) {
        console.error('Error creating agent:', error);
        if (error instanceof Error && error.message === 'Twitter user not found') {
          return NextResponse.json(
            { error: 'Twitter user not found' },
            { status: 404 }
          );
        }
        return NextResponse.json(
          { error: 'Failed to create agent' },
          { status: 500 }
        );
      }
    } else {
      agentId = existingAgent.id;
    }

    const { data, error: createOfferError } = await supabase.rpc(
      'create_offer_and_job', {
        p_seller_id: agentId,
        p_buyer_id: user.id,
        p_amount: amount,
        p_currency: currency,
        p_description: description,
        p_post_url: "",
        p_created_by: user.id
      }
    );

    if (createOfferError) {
      console.error('Error creating offer and job:', createOfferError);
      return NextResponse.json(
        { error: 'Failed to create offer and job' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      agent_id: agentId,
      job_id: data[0].job_id,
      offer_id: data[0].offer_id,
    },
    { status: 200 }
    );
    
  } catch (error) {
    console.error('Error in offer creation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 