/**
 * Auth event logging for security monitoring and auditing
 */

export enum AuthEvent {
  // Sign-in events
  SIGNIN_STARTED = "auth.signin.started",
  SIGNIN_SUCCESS = "auth.signin.success",
  SIGNIN_FAILED = "auth.signin.failed",
  
  // Magic link events
  MAGIC_LINK_SENT = "auth.magiclink.sent",
  MAGIC_LINK_CLICKED = "auth.magiclink.clicked",
  MAGIC_LINK_EXPIRED = "auth.magiclink.expired",
  MAGIC_LINK_INVALID = "auth.magiclink.invalid",
  
  // Session events
  SESSION_CREATED = "auth.session.created",
  SESSION_UPDATED = "auth.session.updated",
  SESSION_EXPIRED = "auth.session.expired",
  SESSION_REVOKED = "auth.session.revoked",
  
  // Account events
  ACCOUNT_CREATED = "auth.account.created",
  ACCOUNT_UPDATED = "auth.account.updated",
  ACCOUNT_DELETED = "auth.account.deleted",
  ACCOUNT_SUSPENDED = "auth.account.suspended",
  
  // Rate limit events
  RATE_LIMIT_EXCEEDED = "auth.ratelimit.exceeded",
  
  // Security events
  SUSPICIOUS_ACTIVITY = "auth.security.suspicious",
  TOKEN_REUSE_DETECTED = "auth.security.token_reuse",
}

export interface AuthLogContext {
  userId?: string;
  email?: string;
  ip?: string;
  userAgent?: string;
  provider?: string;
  sessionId?: string;
  reason?: string;
  metadata?: Record<string, unknown>;
}

export interface AuthLog {
  timestamp: string;
  event: AuthEvent;
  context: AuthLogContext;
  severity: "info" | "warning" | "error" | "critical";
}

/**
 * Log an auth event with context
 */
export function logAuthEvent(
  event: AuthEvent,
  context: AuthLogContext = {},
  severity: AuthLog["severity"] = "info",
): void {
  const log: AuthLog = {
    timestamp: new Date().toISOString(),
    event,
    context: {
      ...context,
      // Redact sensitive data
      email: context.email ? maskEmail(context.email) : undefined,
    },
    severity,
  };

  // In production, send to logging service (DataDog, Sentry, CloudWatch, etc.)
  if (process.env.NODE_ENV === "production") {
    console.log(JSON.stringify(log));
    
    // Send to Sentry if configured
    if (typeof window === "undefined" && process.env.NEXT_PUBLIC_SENTRY_DSN) {
      // Dynamic import to avoid require()
      import("@sentry/nextjs").then((SentryModule) => {
        const Sentry = SentryModule.default || SentryModule;
        
        if (severity === "error" || severity === "critical") {
          Sentry.captureException(new Error(event), {
            level: severity === "critical" ? "fatal" : "error",
            contexts: {
              auth: context,
            },
            tags: {
              event_type: event,
              user_id: context.userId,
            },
          });
        } else {
          Sentry.captureMessage(event, {
            level: severity === "warning" ? "warning" : "info",
            contexts: {
              auth: context,
            },
            tags: {
              event_type: event,
            },
          });
        }
      }).catch(() => {
        // Fail silently if Sentry is not available
      });
    }
  } else {
    // In development, pretty print
    const emoji = getSeverityEmoji(severity);
    console.log(
      `${emoji} [${severity.toUpperCase()}] ${event}`,
      JSON.stringify(context, null, 2),
    );
  }

  // For critical events, trigger alerts
  if (severity === "critical") {
    // Send to alerting service (Slack, PagerDuty, etc.)
    if (process.env.SLACK_WEBHOOK_URL) {
      try {
        fetch(process.env.SLACK_WEBHOOK_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: `🚨 CRITICAL AUTH EVENT: ${event}`,
            blocks: [
              {
                type: "section",
                text: {
                  type: "mrkdwn",
                  text: `*🚨 CRITICAL AUTH EVENT*\n\n*Event:* ${event}\n*User:* ${context.email || context.userId || "Unknown"}\n*IP:* ${context.ip || "Unknown"}\n*Reason:* ${context.reason || "N/A"}`,
                },
              },
            ],
          }),
        }).catch(err => console.error("Slack alert failed:", err));
      } catch (err) {
        console.error("Failed to send alert:", err);
      }
    }
    
    console.error("🚨 CRITICAL AUTH EVENT:", log);
  }
}

/**
 * Mask email for logging (shows first char and domain only)
 */
function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!domain) return "***";
  return `${local[0]}***@${domain}`;
}

/**
 * Get emoji for severity level
 */
function getSeverityEmoji(severity: AuthLog["severity"]): string {
  const emojiMap = {
    info: "ℹ️",
    warning: "⚠️",
    error: "❌",
    critical: "🚨",
  };
  return emojiMap[severity];
}

/**
 * Helper to extract request metadata for logging
 */
export function getRequestMetadata(request: Request): Pick<AuthLogContext, "ip" | "userAgent"> {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0].trim() : request.headers.get("x-real-ip") || "unknown";
  const userAgent = request.headers.get("user-agent") || "unknown";

  return { ip, userAgent };
}

/**
 * Helper to log rate limit exceeded
 */
export function logRateLimitExceeded(
  identifier: string,
  context: Omit<AuthLogContext, "reason">,
): void {
  logAuthEvent(
    AuthEvent.RATE_LIMIT_EXCEEDED,
    {
      ...context,
      reason: `Rate limit exceeded for ${identifier}`,
    },
    "warning",
  );
}

/**
 * Helper to detect suspicious activity patterns
 */
export async function detectSuspiciousActivity(context: AuthLogContext): Promise<boolean> {
  // Basic suspicious activity detection
  // Can be enhanced with ML/AI models or external fraud detection services
  
  let suspicious = false;
  
  // Check for rapid session creation (more than 5 sessions in 5 minutes)
  if (context.sessionId && context.ip) {
    try {
      const redisKey = `sus:sessions:${context.ip}`;
      const { redisIncr, redisExpire, redisGet } = await import("@/server/cache/redis");
      
      const count = await redisIncr(redisKey);
      if (count === 1) {
        await redisExpire(redisKey, 300); // 5 minutes
      }
      
      if (count > 5) {
        suspicious = true;
        logAuthEvent(
          AuthEvent.SUSPICIOUS_ACTIVITY,
          {
            ...context,
            reason: `Rapid session creation: ${count} sessions in 5 minutes`,
          },
          "warning",
        );
      }
    } catch (err) {
      console.error("Failed to check session creation rate:", err);
    }
  }
  
  // Check for user agent switching (same user, different user agent in short time)
  // This could indicate account compromise
  // TODO: Implement more sophisticated detection with ML
  
  return suspicious;
}

