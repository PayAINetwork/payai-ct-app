import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { z } from 'zod';
import { getTwitterUserByHandle } from '@/lib/twitter';

// Schema for offer creation
const createOfferSchema = z.object({
  amount: z.number().positive(),
  currency: z.string().min(1),
  description: z.string().min(1),
});

export async function POST(
  request: Request,
  { params }: { params: { handle: string } }
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
    const { handle } = params;

    // Check if agent exists
    const { data: existingAgent, error: agentError } = await supabase
      .from('agents')
      .select('id')
      .eq('handle', handle)
      .single();

    let agentId: string;
    
    // If agent doesn't exist, create it
    if (!existingAgent) {
      try {
        // Fetch Twitter profile data
        const twitterData = await getTwitterUserByHandle(handle);
        
        // Create the agent
        const { data: newAgent, error: insertError } = await supabase
          .from('agents')
          .insert({
            handle,
            name: twitterData.name,
            bio: twitterData.bio,
            profile_image_url: twitterData.profileImage,
            twitter_user_id: twitterData.twitterUserId,
            is_verified: false,
            created_by: user.id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
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

    // Begin transaction for offer and job creation
    const { error: beginError } = await supabase.rpc('begin_transaction');
    if (beginError) {
      console.error('Error beginning transaction:', beginError);
      return NextResponse.json(
        { error: 'Failed to begin transaction' },
        { status: 500 }
      );
    }

    try {
      // Create offer
      const { data: offer, error: offerError } = await supabase
        .from('offers')
        .insert({
          seller_id: agentId,
          buyer_id: user.id,
          amount,
          currency,
          description,
          status: 'created',
          created_by: user.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select('id')
        .single();
        
      if (offerError) {
        // Rollback transaction
        await supabase.rpc('rollback_transaction');
        throw offerError;
      }
      
      // Create job
      const { data: job, error: jobError } = await supabase
        .from('jobs')
        .insert({
          offer_id: offer.id,
          seller_id: agentId,
          buyer_id: user.id,
          status: 'created',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select('id')
        .single();
        
      if (jobError) {
        // Rollback transaction
        await supabase.rpc('rollback_transaction');
        throw jobError;
      }

      // Commit transaction
      const { error: commitError } = await supabase.rpc('commit_transaction');
      if (commitError) {
        // Rollback transaction
        await supabase.rpc('rollback_transaction');
        throw commitError;
      }
      
      return NextResponse.json({
        agent_id: agentId,
        offer_id: offer.id,
        job_id: job.id
      });
    } catch (error) {
      // Rollback transaction
      await supabase.rpc('rollback_transaction');
      console.error('Error in offer/job creation:', error);
      return NextResponse.json(
        { error: 'Failed to create offer and job' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in offer creation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 