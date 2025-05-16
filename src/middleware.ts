import { NextRequest } from 'next/server';
import { handleBearerAuth, handleSupabaseAuth } from '@/lib/middlewareHelpers';

export async function middleware(request: NextRequest) {  
  // 1. Try API-key flow
  const bearerResponse = await handleBearerAuth(request);
  if (bearerResponse) return bearerResponse;

  // 2. Fallback to Supabase session
  return await handleSupabaseAuth(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|login|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}