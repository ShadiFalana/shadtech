import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { createAuthMiddleware } from "better-auth/api";
import { nextCookies } from "better-auth/next-js";
import { twoFactor } from "better-auth/plugins";
import { prisma } from "@/lib/db";

const isProduction = process.env.NODE_ENV === "production";

type AuthHookContext = {
  path?: string;
  request?: Request;
  headers?: Headers | Record<string, string> | Array<[string, string]>;
  context?: { session?: { user?: { id?: string } } | null } | null;
};

function authHookPath(ctx: AuthHookContext): string {
  if (ctx.path) return ctx.path;
  if (!ctx.request) return "unknown";
  try {
    const pathname = new URL(ctx.request.url).pathname;
    return pathname.replace(/^\/api\/auth/, "") || "/";
  } catch {
    return "unknown";
  }
}

function authHookHeader(
  headers: AuthHookContext["headers"],
  name: string,
): string | null {
  if (!headers) return null;
  if (headers instanceof Headers) return headers.get(name);
  if (Array.isArray(headers)) {
    return headers.find(([key]) => key.toLowerCase() === name)?.[1] ?? null;
  }
  return (
    Object.entries(headers).find(([key]) => key.toLowerCase() === name)?.[1] ??
    null
  );
}

async function writeAuthAudit(input: {
  action: string;
  actorId?: string | null;
  ipAddress?: string | null;
}) {
  try {
    await prisma.auditLog.create({
      data: {
        action: input.action,
        entity: "auth",
        actorId: input.actorId ?? null,
        ipAddress: input.ipAddress ?? null,
        details: null,
      },
    });
  } catch {
    // Audit logging must never block authentication.
  }
}

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    maxPasswordLength: 128,
    autoSignIn: true,
    revokeSessionsOnPasswordReset: true,
    resetPasswordTokenExpiresIn: 60 * 60,
    sendResetPassword: async ({ user, url, token }) => {
      const webhookUrl = process.env.PASSWORD_RESET_WEBHOOK_URL;
      if (!webhookUrl) {
        if (isProduction) {
          throw new Error("Password reset delivery is not configured.");
        }
        console.info(`[ShadTech dev] Password reset link for ${user.email}: ${url}`);
        return;
      }

      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(process.env.PASSWORD_RESET_WEBHOOK_TOKEN
            ? { Authorization: `Bearer ${process.env.PASSWORD_RESET_WEBHOOK_TOKEN}` }
            : {}),
        },
        body: JSON.stringify({
          to: user.email,
          name: user.name,
          resetUrl: url,
          token,
        }),
      });

      if (!response.ok) {
        throw new Error("Password reset delivery failed.");
      }
    },
    onPasswordReset: async ({ user }) => {
      await writeAuthAudit({ action: "/reset-password", actorId: user.id });
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
  },
  rateLimit: {
    enabled: true,
    window: 60,
    max: 100,
    customRules: {
      "/sign-in*": { window: 60, max: 5 },
      "/sign-up*": { window: 60, max: 5 },
      "/request-password-reset": { window: 3600, max: 3 },
      "/send-verification-email": { window: 3600, max: 3 },
    },
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false,
        defaultValue: "CUSTOMER",
        input: false,
      },
    },
  },
  advanced: {
    useSecureCookies: isProduction,
    cookiePrefix: "shadtech",
    defaultCookieAttributes: {
      httpOnly: true,
      sameSite: "lax",
      secure: isProduction,
      path: "/",
    },
  },
  plugins: [twoFactor({ issuer: "ShadTech" }), nextCookies()],
  hooks: {
    after: createAuthMiddleware(async (ctx) => {
      const hook = ctx as unknown as AuthHookContext;
      const path = authHookPath(hook);
      const audited = [
        "/sign-in",
        "/sign-up",
        "/sign-out",
        "/reset-password",
        "/request-password-reset",
        "/revoke-session",
        "/revoke-sessions",
        "/revoke-other-sessions",
        "/two-factor",
      ].some((prefix) => path.startsWith(prefix));
      if (!audited) return;

      await writeAuthAudit({
        action: path,
        actorId: hook.context?.session?.user?.id ?? null,
        ipAddress: authHookHeader(hook.headers, "x-forwarded-for"),
      });
    }),
  },
  onAPIError: {
    onError: async (_error, ctx) => {
      await writeAuthAudit({
        action: `error:${authHookPath(ctx as unknown as AuthHookContext)}`,
      });
    },
  },
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          try {
            await prisma.customerProfile.create({ data: { userId: user.id } });
          } catch {
            // ignore if already exists
          }
        },
      },
    },
  },
  secret: process.env.BETTER_AUTH_SECRET!,
  baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
});
