import * as Sentry from "@sentry/nextjs";

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,

    // Performance Monitoring
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

    // Environment
    environment: process.env.NODE_ENV || "development",

    // Release tracking
    release: process.env.VERCEL_GIT_COMMIT_SHA || process.env.npm_package_version,

    // Server-specific configuration
    integrations: [
      // HTTP integration for request tracking
      Sentry.httpIntegration(),
    ],

    // Enhanced error filtering and enrichment
    beforeSend(event, hint) {
      const error = hint.originalException;

      // Filter out known non-critical errors
      if (error instanceof Error) {
        // Network errors that are expected
        if (
          error.message.includes('Network error') ||
          error.message.includes('fetch failed') ||
          error.message.includes('ECONNREFUSED')
        ) {
          return null;
        }

        // Rate limit errors (expected behavior)
        if (error.message.includes('Too many requests')) {
          return null;
        }
      }

      // Remove sensitive headers
      if (event.request?.headers) {
        const sanitized = { ...event.request.headers };
        delete sanitized.authorization;
        delete sanitized.cookie;
        delete sanitized['x-api-key'];
        event.request.headers = sanitized;
      }

      // Remove sensitive env vars
      if (event.contexts?.runtime?.env) {
        const env = { ...(event.contexts.runtime.env as Record<string, any>) };
        delete env.DATABASE_URL;
        delete env.REDIS_URL;
        delete env.NEXTAUTH_SECRET;
        delete env.EMAIL_SERVER_PASSWORD;
        delete env.ODOO_API_KEY;
        delete env.PAYMOB_API_KEY;
        delete env.PAYMOB_SECRET_KEY;
        event.contexts.runtime.env = env;
      }

      // Add user context (without PII)
      if (event.user) {
        // Keep user ID but remove email/name for privacy
        event.user = {
          id: event.user.id,
          ip_address: '{{auto}}', // Let Sentry auto-detect
        };
      }

      // Add custom context
      event.contexts = {
        ...event.contexts,
        app: {
          name: 'ELITE Coffee Shop',
          version: process.env.npm_package_version || 'unknown',
          environment: process.env.NODE_ENV,
        },
      };

      // Add breadcrumbs for better debugging
      if (event.breadcrumbs) {
        event.breadcrumbs = event.breadcrumbs.filter(
          (breadcrumb) => !breadcrumb.message?.includes('password')
        );
      }

      return event;
    },

    // Ignore certain errors
    ignoreErrors: [
      // Network errors
      'ECONNREFUSED',
      'ETIMEDOUT',
      'ENOTFOUND',
      'ECONNRESET',
      'Network request failed',
      'fetch failed',

      // Client-side errors that aren't actionable
      'ResizeObserver loop limit exceeded',
      'Non-Error promise rejection captured',

      // Browser extensions
      'chrome-extension://',
      'moz-extension://',

      // Rate limiting (expected)
      'Too many requests',
      'Rate limit exceeded',
    ],

    // Ignore certain URLs
    denyUrls: [
      // Browser extensions
      /extensions\//i,
      /^chrome:\/\//i,
      /^moz-extension:\/\//i,
    ],

    // Sample rate for session replay (if enabled)
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
  });

  // Log Sentry initialization
  console.log('[Sentry] Initialized for environment:', process.env.NODE_ENV);
} else {
  console.warn('[Sentry] DSN not configured, error tracking disabled');
}

