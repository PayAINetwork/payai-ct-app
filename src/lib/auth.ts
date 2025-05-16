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