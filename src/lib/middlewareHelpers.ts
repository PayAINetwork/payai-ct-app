import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { verifyToken } from '@/lib/auth';
import { createServerSupabaseClient } from '@/lib/supabase/server';

/**
 * Handles API-key (Bearer token) authentication.
 * If valid, injects x-user-id header and returns a NextResponse.
 * On failure, returns a 401 NextResponse.
 * If no Bearer header is present, returns null to indicate fallback.
 */
export async function handleBearerAuth(request: NextRequest): Promise<NextResponse | null> {
  // check if the request contains a bearer token
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    // No bearer token found, indicate to fallback
    return null;
  }

  // look up the token in the database
  const rawToken = authHeader.split(' ')[1];
  const supabase = await createServerSupabaseClient();
  const { data: tokenData, error } = await supabase
    .from('access_tokens')
    .select('user_id, token, expires_at, revoked_at')
    .eq('token', rawToken)
    .single();

  // if the token is not found or the token is invalid, return a 401
  if (error || !tokenData || !verifyToken(rawToken, tokenData.token)) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }

  // if the token is expired or revoked, return a 401
  const now = new Date();
  if (new Date(tokenData.expires_at) < now || tokenData.revoked_at) {
    return NextResponse.json({ error: 'Token expired or revoked' }, { status: 401 });
  }

  // inject user ID header and continue
  const headers = new Headers(request.headers);
  headers.set('x-user-id', tokenData.user_id);
  return NextResponse.next({ request: { headers } });
}

/**
 * Handles Supabase session-based authentication.
 * If a valid session exists, returns a NextResponse preserving cookies.
 * If not authenticated, redirects to /login.
 */
export async function handleSupabaseAuth(request: NextRequest): Promise<NextResponse> {
  let response = NextResponse.next({
    request,
  });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value}) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = '/login';
    return NextResponse.redirect(loginUrl);
  }

  return response;
}