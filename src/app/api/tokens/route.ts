import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { z } from 'zod';
import { randomBytes } from 'crypto';
import { hashToken } from '@/lib/auth';

// Schema for token creation request
const createTokenSchema = z.object({
  name: z.string().min(1).max(50),
  expiresIn: z.number().min(1).max(365).default(30), // days
});

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
    const result = createTokenSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: result.error.format() },
        { status: 400 }
      );
    }

    const { name, expiresIn } = result.data;

    // Generate a secure random token
    const rawToken = randomBytes(32).toString('hex');
    const hashedToken = hashToken(rawToken);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresIn);

    // Store the hashed token in the database
    const { error: insertError } = await supabase
      .from('access_tokens')
      .insert({
        user_id: user.id,
        token: hashedToken,
        name,
        created_at: new Date().toISOString(),
        expires_at: expiresAt.toISOString(),
      });

    if (insertError) {
      console.error('Error creating token:', insertError);
      return NextResponse.json(
        { error: 'Failed to create token' },
        { status: 500 }
      );
    }

    // Return the raw token to the user (this is the only time they'll see it)
    return NextResponse.json({
      token: rawToken,
      name,
      expires_at: expiresAt.toISOString(),
    });
  } catch (error) {
    console.error('Error in token creation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Get all tokens for the current user
export async function GET() {
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

    // Fetch all tokens for the user
    const { data: tokens, error: fetchError } = await supabase
      .from('access_tokens')
      .select('*')
      .eq('user_id', user.id)
      .is('revoked_at', null)
      .order('created_at', { ascending: false });

    if (fetchError) {
      console.error('Error fetching tokens:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch tokens' },
        { status: 500 }
      );
    }

    return NextResponse.json(tokens);
  } catch (error) {
    console.error('Error in token listing:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 