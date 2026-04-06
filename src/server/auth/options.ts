import type { NextAuthOptions } from "next-auth";
import EmailProvider from "next-auth/providers/email";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import nodemailer from "nodemailer";
import { prisma } from "@/server/db/client";
import {
  generateMagicLinkHtml,
  generateMagicLinkText,
  generateMagicLinkSubject,
} from "@/server/auth/emailTemplates";
import { logAuthEvent, AuthEvent } from "@/server/auth/logger";
import { enforceRateLimit, AUTH_RATE_LIMITS } from "@/server/auth/rateLimit";
import { checkGenericRateLimit } from "@/server/utils/rateLimit";
import { createOdooClient } from "@/server/utils/odooClient";

const EMAIL_SERVER_HOST = process.env.EMAIL_SERVER_HOST;
const EMAIL_SERVER_PORT = Number(process.env.EMAIL_SERVER_PORT || "587");
const EMAIL_SERVER_USER = process.env.EMAIL_SERVER_USER;
const EMAIL_SERVER_PASSWORD = process.env.EMAIL_SERVER_PASSWORD;
const EMAIL_FROM = process.env.EMAIL_FROM || "noreply@example.com";
const BRAND_NAME = process.env.BRAND_NAME || "Elite Coffee Shop";

const globalForAuthLogs = globalThis as unknown as {
  __emailConfigLogged?: boolean;
};

function ensureDevNextAuthUrl() {
  // In local/dev, we want NextAuth to generate URLs (magic links, callbacks)
  // for the current dev server rather than a production NEXTAUTH_URL that may
  // exist in shared .env files.
  if (typeof window !== "undefined") return;
  if (process.env.NODE_ENV === "production") return;

  const existing = process.env.NEXTAUTH_URL;
  const isLocal =
    !!existing &&
    /(localhost|127\.0\.0\.1|0\.0\.0\.0|\b10\.|\b192\.168\.|\b172\.(1[6-9]|2\d|3[0-1])\.|\.local\b)/i.test(
      existing,
    );

  if (isLocal) return;

  const port = process.env.PORT || "3000";
  const localBaseUrl = `http://localhost:${port}`;
  process.env.NEXTAUTH_URL = localBaseUrl;
  process.env.NEXTAUTH_URL_INTERNAL = localBaseUrl;
}

// For build-time (allow undefined), runtime will validate
const NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET || "placeholder-for-build";

// Warn if using placeholder at runtime (but don't crash the build)
if (
  typeof window === "undefined" &&
  NEXTAUTH_SECRET === "placeholder-for-build" &&
  process.env.NODE_ENV !== "development"
) {
  console.error(
    "⚠️ WARNING: NEXTAUTH_SECRET is not set! Authentication will not work.",
  );
  console.error("Please set NEXTAUTH_SECRET in your environment variables.");
}

// Log email configuration status only in development to avoid noisy build/prod logs.
if (
  typeof window === "undefined" &&
  process.env.NODE_ENV === "development" &&
  process.env.AUTH_DEBUG_EMAIL_CONFIG === "true"
) {
  if (!globalForAuthLogs.__emailConfigLogged) {
    console.log("📧 Email Configuration Check:");
    console.log(
      "  EMAIL_SERVER_HOST:",
      EMAIL_SERVER_HOST ? "✅" : "❌ MISSING",
    );
    console.log("  EMAIL_SERVER_PORT:", EMAIL_SERVER_PORT);
    console.log(
      "  EMAIL_SERVER_USER:",
      EMAIL_SERVER_USER ? "✅" : "❌ MISSING",
    );
    console.log(
      "  EMAIL_SERVER_PASSWORD:",
      EMAIL_SERVER_PASSWORD ? "✅" : "❌ MISSING",
    );
    console.log("  EMAIL_FROM:", EMAIL_FROM);
    globalForAuthLogs.__emailConfigLogged = true;
  }
}

// Create email transporter only if all credentials are provided
const transporter =
  EMAIL_SERVER_HOST && EMAIL_SERVER_USER && EMAIL_SERVER_PASSWORD
    ? nodemailer.createTransport({
        host: EMAIL_SERVER_HOST,
        port: EMAIL_SERVER_PORT,
        secure: EMAIL_SERVER_PORT === 465,
        auth: {
          user: EMAIL_SERVER_USER,
          pass: EMAIL_SERVER_PASSWORD,
        },
      })
    : null;

// Verify transporter connection silently (don't spam console)
if (transporter && process.env.NODE_ENV === "development") {
  transporter.verify(() => {
    // Silently ignore SMTP errors in development
  });
}

export function getAuthOptions(): NextAuthOptions {
  ensureDevNextAuthUrl();
  return {
    secret: NEXTAUTH_SECRET,
    adapter: PrismaAdapter(prisma),

    // Use JWT strategy for better performance in serverless
    session: {
      strategy: "jwt",
      maxAge: 30 * 24 * 60 * 60, // 30 days
      updateAge: 24 * 60 * 60, // 24 hours
    },

    // JWT configuration with rotation
    jwt: {
      maxAge: 30 * 24 * 60 * 60, // 30 days
    },

    providers: [
      // Google OAuth Provider
      ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
        ? [
            GoogleProvider({
              clientId: process.env.GOOGLE_CLIENT_ID,
              clientSecret: process.env.GOOGLE_CLIENT_SECRET,
              allowDangerousEmailAccountLinking: true,
            }),
          ]
        : []),

      // Email Provider (Magic Link)
      EmailProvider({
        server: {
          host: EMAIL_SERVER_HOST,
          port: EMAIL_SERVER_PORT,
          auth: {
            user: EMAIL_SERVER_USER,
            pass: EMAIL_SERVER_PASSWORD,
          },
        },
        from: EMAIL_FROM,
        maxAge: 24 * 60 * 60,

        sendVerificationRequest: async ({ identifier, url, provider }) => {
          if (!transporter) {
            if (process.env.NODE_ENV === "development") {
              console.log("\n🔗 Magic Link (SMTP not configured):");
              console.log(`   Email: ${identifier}`);
              console.log(`   Link: ${url}\n`);

              logAuthEvent(
                AuthEvent.MAGIC_LINK_SENT,
                { email: identifier, reason: "Printed to console (dev mode)" },
                "info",
              );
              return;
            }

            const missingVars: string[] = [];
            if (!EMAIL_SERVER_HOST) missingVars.push("EMAIL_SERVER_HOST");
            if (!EMAIL_SERVER_USER) missingVars.push("EMAIL_SERVER_USER");
            if (!EMAIL_SERVER_PASSWORD)
              missingVars.push("EMAIL_SERVER_PASSWORD");

            const error = `Email transport is not configured. Missing: ${missingVars.join(", ")}`;
            console.error("❌", error);

            logAuthEvent(
              AuthEvent.MAGIC_LINK_SENT,
              { email: identifier, reason: error },
              "error",
            );

            throw new Error(error);
          }

          try {
            const rateLimitResult = await enforceRateLimit(
              identifier,
              AUTH_RATE_LIMITS.MAGIC_LINK,
            );

            if (!rateLimitResult.allowed) {
              logAuthEvent(
                AuthEvent.RATE_LIMIT_EXCEEDED,
                {
                  email: identifier,
                  reason: rateLimitResult.error,
                },
                "warning",
              );
              throw new Error(rateLimitResult.error);
            }

            const { host } = new URL(url);
            const brandName = BRAND_NAME;

            const html = generateMagicLinkHtml({
              url,
              host,
              email: identifier,
              brandName,
              expiresIn: "24 hours",
            });

            const text = generateMagicLinkText({
              url,
              host,
              email: identifier,
              brandName,
              expiresIn: "24 hours",
            });

            const subject = generateMagicLinkSubject(brandName);

            await transporter.sendMail({
              to: identifier,
              from: provider.from,
              subject,
              text,
              html,
            });

            logAuthEvent(
              AuthEvent.MAGIC_LINK_SENT,
              { email: identifier },
              "info",
            );
          } catch (error) {
            console.error("❌ Failed to send magic link:", error);

            logAuthEvent(
              AuthEvent.MAGIC_LINK_SENT,
              {
                email: identifier,
                reason: error instanceof Error ? error.message : String(error),
              },
              "error",
            );

            throw error;
          }
        },
      }),
    ],

    pages: {
      signIn: "/auth/signin",
      verifyRequest: "/auth/verify-request",
      error: "/auth/error",
    },

    callbacks: {
      async signIn({ user, account }) {
        const identifier = user.id || user.email || "unknown_auth";
        const limitCheck = await checkGenericRateLimit(identifier, "AUTH");
        if (!limitCheck.allowed) {
          logAuthEvent(
            AuthEvent.RATE_LIMIT_EXCEEDED,
            { userId: user.id, email: user.email || undefined },
            "warning",
          );
          throw new Error(
            "Too many authentication attempts. Please try again later.",
          );
        }

        logAuthEvent(
          AuthEvent.SIGNIN_STARTED,
          {
            userId: user.id,
            email: user.email || undefined,
            provider: account?.provider,
          },
          "info",
        );

        return true;
      },

      async session({ session, token }) {
        if (token.sub && session.user) {
          session.user.id = token.sub;
          session.user.email =
            (token.email as string | null | undefined) ?? null;
          session.user.name = (token.name as string | null | undefined) ?? null;
          session.user.image =
            (token.image as string | null | undefined) ?? null;
          session.user.role = (token.role as string) || "user";
          session.user.status = (token.status as string) || "active";
        }
        return session;
      },

      async jwt({ token, user, account, trigger }) {
        if (user) {
          token.sub = user.id;
          token.email = user.email;
          token.name = user.name || undefined;
          token.image = user.image || undefined;

          const dbUser = await prisma.user.findUnique({
            where: { id: user.id },
            select: { role: true, status: true, emailVerified: true },
          });

          if (dbUser) {
            token.role = dbUser.role;
            token.status = dbUser.status;
            token.emailVerified = dbUser.emailVerified;
          }

          await prisma.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() },
          });

          logAuthEvent(
            AuthEvent.SESSION_CREATED,
            {
              userId: user.id,
              email: user.email || undefined,
              provider: account?.provider,
            },
            "info",
          );
        }

        if (trigger === "update") {
          if (token.sub) {
            const dbUser = await prisma.user.findUnique({
              where: { id: token.sub },
              select: {
                email: true,
                name: true,
                image: true,
                role: true,
                status: true,
                emailVerified: true,
              },
            });

            if (dbUser) {
              token.email = dbUser.email;
              token.name = dbUser.name;
              token.image = dbUser.image;
              token.role = dbUser.role;
              token.status = dbUser.status;
              token.emailVerified = dbUser.emailVerified;

              logAuthEvent(
                AuthEvent.SESSION_UPDATED,
                { userId: token.sub },
                "info",
              );
            }
          }
        }

        if (token.status === "suspended") {
          logAuthEvent(
            AuthEvent.ACCOUNT_SUSPENDED,
            { userId: token.sub, email: token.email as string | undefined },
            "warning",
          );
          throw new Error("Account suspended");
        }

        return token;
      },
    },

    events: {
      async signIn({ user, account, isNewUser }) {
        if (isNewUser) {
          logAuthEvent(
            AuthEvent.ACCOUNT_CREATED,
            {
              userId: user.id,
              email: user.email || undefined,
              provider: account?.provider,
            },
            "info",
          );

          try {
            await prisma.loyaltyAccount.create({
              data: {
                userId: user.id,
                points: 0,
                totalSpent: 0,
                level: "bronze",
              },
            });
          } catch {
            // Non-blocking
          }

          try {
            const odooClient = createOdooClient();
            if (odooClient && user.email) {
              await odooClient.findOrCreatePartner({
                name: user.name || user.email.split("@")[0] || "Guest",
                email: user.email,
              });
            }
          } catch {
            // Non-blocking
          }
        } else {
          logAuthEvent(
            AuthEvent.SIGNIN_SUCCESS,
            {
              userId: user.id,
              email: user.email || undefined,
              provider: account?.provider,
            },
            "info",
          );
        }
      },

      async signOut({ token }) {
        logAuthEvent(
          AuthEvent.SESSION_REVOKED,
          { userId: token.sub, email: token.email as string | undefined },
          "info",
        );
      },
    },

    debug: false,
    useSecureCookies: process.env.NODE_ENV === "production",
    cookies: {
      sessionToken: {
        name: `${process.env.NODE_ENV === "production" ? "__Secure-" : ""}next-auth.session-token`,
        options: {
          httpOnly: true,
          sameSite: "lax",
          path: "/",
          secure: process.env.NODE_ENV === "production",
        },
      },
    },
  };
}
