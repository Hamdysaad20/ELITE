import * as Sentry from "@sentry/nextjs";

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    
    // Performance Monitoring
    tracesSampleRate: 1.0, // Capture 100% of transactions (adjust in production)
    
    // Session Replay
    replaysSessionSampleRate: 0.1, // Capture 10% of sessions
    replaysOnErrorSampleRate: 1.0, // Capture 100% of sessions with errors
    
    // Environment
    environment: process.env.NODE_ENV || "development",
    
    // Filter out sensitive data
    beforeSend(event, hint) {
      // Remove sensitive data from breadcrumbs
      if (event.breadcrumbs) {
        event.breadcrumbs = event.breadcrumbs.map(breadcrumb => {
          if (breadcrumb.data) {
            // Remove password, token, etc.
            const sanitized = { ...breadcrumb.data };
            delete sanitized.password;
            delete sanitized.token;
            delete sanitized.apiKey;
            return { ...breadcrumb, data: sanitized };
          }
          return breadcrumb;
        });
      }
      
      return event;
    },
    
    // Ignore certain errors
    ignoreErrors: [
      // Browser extensions
      "top.GLOBALS",
      // Network errors that are expected
      "NetworkError",
      "Failed to fetch",
    ],
  });
}

