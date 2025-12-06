import * as Sentry from "@sentry/nextjs";

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    
    // Performance Monitoring
    tracesSampleRate: 1.0,
    
    // Environment
    environment: process.env.NODE_ENV || "development",
    
    // Edge runtime has limited capabilities
    beforeSend(event) {
      // Sanitize sensitive data
      if (event.request?.headers) {
        const sanitized = { ...event.request.headers };
        delete sanitized.authorization;
        delete sanitized.cookie;
        event.request.headers = sanitized;
      }
      
      return event;
    },
  });
}

