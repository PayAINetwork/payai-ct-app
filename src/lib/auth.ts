import { AuthError, User } from "@supabase/supabase-js";
import { createServerSupabaseClient, createServiceRoleSupabaseClient } from "./supabase/server";

/**
 * Hashes a token using SHA-256
 * @param token The raw token to hash
 * @returns The hashed token
 */
export async function hashToken(token: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Verifies if a raw token matches a hashed token
 * @param rawToken The raw token to verify
 * @param hashedToken The hashed token to compare against
 * @returns boolean indicating if the tokens match
 */
export async function verifyToken(rawToken: string, hashedToken: string): Promise<boolean> {
  const hashedRawToken = await hashToken(rawToken);
  return hashedRawToken === hashedToken;
}


// create a function that takes a request and checks if
// the user is authenticated
// if the user is not authenticated, it returns either a
// supabase AuthError or a BearerAuthError
// if the user is authenticated, it returns the user
export async function getAuthenticatedUserOrError(
  request: Request,
): Promise<{ user: User | null, error: AuthError | null }> {

  let user: User | null = null;
  let error: AuthError | null = null;
  
  // bearer auth flow: middleware should have already checked
  // the bearer token and set the x-user-id header
  const userId = request.headers.get('x-user-id');
  
  if (userId) {
    // fetch the user from the database using the service role key
    const supabase = createServiceRoleSupabaseClient();
    const { data: userResponse, error: userError } = await supabase.auth.admin.getUserById(userId);
    
    // if the user is not found, return an error
    if (userError || !userResponse) {
      console.error('Error fetching user:', userError);
      error = userError as AuthError;
      return { user, error };
    }

    // if the user is found, return the user
    user = userResponse.user;
    error = null;

    return { user, error };
  }

  // cookie auth flow: middleware should have already checked and set the cookies
  const supabase = await createServerSupabaseClient();
  const { data: userResponse, error: userError } = await supabase.auth.getUser();
  
  // if the user is not found, return an error
  if (userError || !userResponse) {
    console.error('Error fetching user:', userError);
    error = userError as AuthError;
    return { user, error };
  }

  // if the user is found, return the user
  user = userResponse.user;
  error = null;

  return { user, error };
}