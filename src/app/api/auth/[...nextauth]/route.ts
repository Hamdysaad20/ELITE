import NextAuth, { NextAuthOptions } from "next-auth";
import EmailProvider from "next-auth/providers/email";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "@/server/db/client";
import nodemailer from "nodemailer";
import {
  generateMagicLinkHtml,
  generateMagicLinkText,
  generateMagicLinkSubject,
} from "@/server/auth/emailTemplates";
import {
  logAuthEvent,
  AuthEvent,
  getRequestMetadata,
} from "@/server/auth/logger";
import {
  enforceRateLimit,
  AUTH_RATE_LIMITS,
  getClientIp,
} from "@/server/auth/rateLimit";

const EMAIL_SERVER_HOST = process.env.EMAIL_SERVER_HOST;
const EMAIL_SERVER_PORT = Number(process.env.EMAIL_SERVER_PORT || "587");
const EMAIL_SERVER_USER = process.env.EMAIL_SERVER_USER;
const EMAIL_SERVER_PASSWORD = process.env.EMAIL_SERVER_PASSWORD;
const EMAIL_FROM = process.env.EMAIL_FROM || "noreply@example.com";
const NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET;
const NEXTAUTH_URL = process.env.NEXTAUTH_URL || "http://localhost:3000";
const BRAND_NAME = process.env.BRAND_NAME || "Elite Coffee Shop";

if (!NEXTAUTH_SECRET) {
  throw new Error("NEXTAUTH_SECRET must be set in environment variables");
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
  transporter.verify((error) => {
    if (!error) {
      console.log("✅ SMTP connection verified successfully");
    }
    // Silently ignore SMTP errors in development
  });
}

export const authOptions: NextAuthOptions = {
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
            allowDangerousEmailAccountLinking: true, // Allow linking email accounts
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
      maxAge: 24 * 60 * 60, // 24 hours
      
      sendVerificationRequest: async ({ identifier, url, provider }) => {
        if (!transporter) {
          // In development, print magic link to console
          if (process.env.NODE_ENV === "development") {
            console.log("\n🔗 Magic Link (SMTP not configured):");
            console.log(`   Email: ${identifier}`);
            console.log(`   Link: ${url}\n`);
            
            logAuthEvent(
              AuthEvent.MAGIC_LINK_SENT,
              { email: identifier, reason: "Printed to console (dev mode)" },
              "info",
            );
            return; // Don't throw error in development
          }
          
          const error = "Email transport is not configured. Set EMAIL_SERVER_* env vars.";
          console.error("❌", error);
          
          logAuthEvent(
            AuthEvent.MAGIC_LINK_SENT,
            { email: identifier, reason: "Email transport not configured" },
            "error",
          );
          
          throw new Error(error);
        }

        try {
          // Check rate limit before sending
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

          // Generate professional email templates
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

          // Send email
          await transporter.sendMail({
            to: identifier,
            from: provider.from,
            subject,
            text,
            html,
          });

          // Log successful send
          logAuthEvent(
            AuthEvent.MAGIC_LINK_SENT,
            { email: identifier },
            "info",
          );

          console.log(`✅ Magic link sent to ${identifier}`);
        } catch (error: any) {
          console.error("❌ Failed to send magic link:", error);
          
          logAuthEvent(
            AuthEvent.MAGIC_LINK_SENT,
            {
              email: identifier,
              reason: error.message,
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
      // Log sign-in attempt
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
      // Attach user ID to session
      if (token.sub && session.user) {
        session.user.id = token.sub;
        session.user.role = token.role as string || "user";
        session.user.status = token.status as string || "active";
      }

      return session;
    },

    async jwt({ token, user, account, trigger }) {
      // Initial sign in
      if (user) {
        token.sub = user.id;
        token.email = user.email;
        token.name = user.name || undefined;
        
        // Fetch additional user data from DB
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: { role: true, status: true, emailVerified: true },
        });

        if (dbUser) {
          token.role = dbUser.role;
          token.status = dbUser.status;
          token.emailVerified = dbUser.emailVerified;
        }

        // Update last login
        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        });

        // Log successful sign in
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

      // Handle token refresh/update
      if (trigger === "update") {
        // Refresh user data from DB
        if (token.sub) {
          const dbUser = await prisma.user.findUnique({
            where: { id: token.sub },
            select: {
              email: true,
              name: true,
              role: true,
              status: true,
              emailVerified: true,
            },
          });

          if (dbUser) {
            token.email = dbUser.email;
            token.name = dbUser.name;
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

      // Check if user is suspended
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
        // Log new account creation
        logAuthEvent(
          AuthEvent.ACCOUNT_CREATED,
          {
            userId: user.id,
            email: user.email || undefined,
            provider: account?.provider,
          },
          "info",
        );

        // Create loyalty account for new user
        try {
          await prisma.loyaltyAccount.create({
            data: {
              userId: user.id,
              points: 0,
              totalSpent: 0,
              level: "bronze",
            },
          });
          console.log(`✅ Loyalty account created for user ${user.id}`);
        } catch (error) {
          console.error("❌ Failed to create loyalty account:", error);
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

  // Security settings
  debug: false, // Set to true only when debugging auth issues
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

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
