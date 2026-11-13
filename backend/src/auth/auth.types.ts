import type { User } from '@prisma/client';

export interface AccessTokenPayload {
  sub: string;
  email: string;
  sid: string;
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  sessionId: string;
}

export interface PublicUser {
  id: string;
  email: string;
  fullName: string;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
}

export function toPublicUser(user: User): PublicUser {
  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    isActive: user.isActive,
    lastLoginAt: user.lastLoginAt ? user.lastLoginAt.toISOString() : null,
    createdAt: user.createdAt.toISOString(),
  };
}
