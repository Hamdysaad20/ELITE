import * as Sentry from "@sentry/nextjs";

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    
    // Performance Monitoring
    tracesSampleRate: 1.0, // Adjust in production based on volume
    
    // Environment
    environment: process.env.NODE_ENV || "development",
    
    // Server-specific configuration
    integrations: [],
    
    // Filter sensitive data
    beforeSend(event, hint) {
      // Remove sensitive headers
      if (event.request?.headers) {
        const sanitized = { ...event.request.headers };
        delete sanitized.authorization;
        delete sanitized.cookie;
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
        event.contexts.runtime.env = env;
      }
      
      return event;
    },
    
    // Ignore certain errors
    ignoreErrors: [
      "ECONNREFUSED",
      "ETIMEDOUT",
    ],
  });
}

