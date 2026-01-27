/**
 * Auth module exports
 * Central export point for authentication-related functionality
 */

import { getAuthOptions } from "./options";

// Export authOptions as a constant for convenience
export const authOptions = getAuthOptions();

// Also export the function
export { getAuthOptions };
export { getAuthUser } from "./session";
export { logAuthEvent, AuthEvent } from "./logger";
export { enforceRateLimit, AUTH_RATE_LIMITS } from "./rateLimit";
export {
  generateMagicLinkHtml,
  generateMagicLinkText,
  generateMagicLinkSubject,
  orderingResumedEmail,
} from "./emailTemplates";
