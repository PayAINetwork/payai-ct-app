import { createHash } from 'crypto';

/**
 * Hashes a token using SHA-256
 * @param token The raw token to hash
 * @returns The hashed token
 */
export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

/**
 * Verifies if a raw token matches a hashed token
 * @param rawToken The raw token to verify
 * @param hashedToken The hashed token to compare against
 * @returns boolean indicating if the tokens match
 */
export function verifyToken(rawToken: string, hashedToken: string): boolean {
  const hashedRawToken = hashToken(rawToken);
  return hashedRawToken === hashedToken;
} 