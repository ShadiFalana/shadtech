import { createAuthClient } from "better-auth/react";
import { twoFactorClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  plugins: [
    twoFactorClient({
      onTwoFactorRedirect() {
        if (typeof window !== "undefined") {
          window.location.assign(new URL("/auth/two-factor", window.location.origin));
        }
      },
    }),
  ],
});

export const {
  signIn,
  signUp,
  signOut,
  changePassword,
  useSession,
  requestPasswordReset,
  resetPassword,
  revokeSession,
  revokeSessions,
  revokeOtherSessions,
  listSessions,
  verifyEmail,
  twoFactor,
} = authClient;
