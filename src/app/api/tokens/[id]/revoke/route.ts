import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';

export async function POST(
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

    // Verify the token belongs to the user
    const { data: token, error: fetchError } = await supabase
      .from('access_tokens')
      .select('*')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .is('revoked_at', null)
      .single();

    if (fetchError || !token) {
      return NextResponse.json(
        { error: 'Token not found or already revoked' },
        { status: 404 }
      );
    }

    // Revoke the token
    const { error: updateError } = await supabase
      .from('access_tokens')
      .update({ revoked_at: new Date().toISOString() })
      .eq('id', params.id)
      .eq('user_id', user.id);

    if (updateError) {
      console.error('Error revoking token:', updateError);
      return NextResponse.json(
        { error: 'Failed to revoke token' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in token revocation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 