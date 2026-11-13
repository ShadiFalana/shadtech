import type { CookieOptions } from 'express';
import { REFRESH_COOKIE_PATH, REFRESH_TOKEN_TTL_MS } from './auth.constants';

export function refreshCookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: REFRESH_COOKIE_PATH,
    maxAge: REFRESH_TOKEN_TTL_MS,
  };
}

export function clearRefreshCookieOptions(): CookieOptions {
  const options = refreshCookieOptions();
  delete options.maxAge;
  return options;
}
