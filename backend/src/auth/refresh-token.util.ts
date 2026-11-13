import { createHash, randomBytes } from 'node:crypto';

export function createRefreshToken(): string {
  return randomBytes(48).toString('base64url');
}

/** Refresh tokens are stored hashed so a database leak cannot be replayed. */
export function hashRefreshToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}
