import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyToken } from '@/lib/auth';

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

export async function middleware(request: NextRequest) {
  // Skip middleware for non-API routes
  if (!request.nextUrl.pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  // Skip middleware for auth-related routes
  if (request.nextUrl.pathname.startsWith('/api/auth/')) {
    return NextResponse.next();
  }

  // Skip middleware for token management routes
  if (request.nextUrl.pathname.startsWith('/api/tokens/')) {
    return NextResponse.next();
  }

  // Get the authorization header
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json(
      { error: 'Missing or invalid authorization header' },
      { status: 401 }
    );
  }

  const rawToken = authHeader.split(' ')[1];

  // Verify the token
  const { data: tokenData, error: tokenError } = await supabase
    .from('access_tokens')
    .select('user_id, token, expires_at, revoked_at')
    .eq('token', rawToken)
    .single();

  if (tokenError || !tokenData) {
    return NextResponse.json(
      { error: 'Invalid token' },
      { status: 401 }
    );
  }

  // Verify the token hash
  if (!verifyToken(rawToken, tokenData.token)) {
    return NextResponse.json(
      { error: 'Invalid token' },
      { status: 401 }
    );
  }

  // Check if token is expired or revoked
  const now = new Date();
  const expiresAt = new Date(tokenData.expires_at);
  if (now > expiresAt || tokenData.revoked_at) {
    return NextResponse.json(
      { error: 'Token expired or revoked' },
      { status: 401 }
    );
  }

  // Add user_id to request headers for downstream use
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-user-id', tokenData.user_id);

  // Return response with modified headers
  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: '/api/:path*',
}; 