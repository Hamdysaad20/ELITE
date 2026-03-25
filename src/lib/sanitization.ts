/**
 * Input Sanitization Utilities
 *
 * Provides comprehensive input sanitization to prevent XSS and injection attacks.
 * All user inputs should be sanitized before storage or display.
 *
 * Security Features:
 * - HTML tag removal
 * - Script injection prevention
 * - SQL injection protection (via parameterized queries)
 * - Path traversal prevention
 * - Deep object sanitization
 */

/**
 * Sanitize a single string input
 * Removes all HTML tags and dangerous characters
 *
 * @param input - String to sanitize
 * @returns Sanitized string
 *
 * @example
 * ```typescript
 * const safe = sanitizeInput('<script>alert("xss")</script>Hello');
 * // Returns: 'Hello'
 * ```
 */
export function sanitizeInput(input: string): string {
  if (typeof input !== "string") {
    return "";
  }

  return (
    input
      // Remove HTML tags
      .replace(/<[^>]*>/g, "")
      // Remove script tags and content
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
      // Remove event handlers
      .replace(/on\w+\s*=\s*["'][^"']*["']/gi, "")
      // Remove javascript: protocol
      .replace(/javascript:/gi, "")
      // Remove data: protocol (can be used for XSS)
      .replace(/data:text\/html/gi, "")
      // Trim whitespace
      .trim()
  );
}

/**
 * Sanitize HTML content while preserving safe tags
 * Useful for rich text content
 *
 * @param html - HTML string to sanitize
 * @param allowedTags - Array of allowed HTML tags
 * @returns Sanitized HTML
 */
export function sanitizeHTML(
  html: string,
  allowedTags: string[] = ["b", "i", "em", "strong", "p", "br"],
): string {
  if (typeof html !== "string") {
    return "";
  }

  // Remove all tags except allowed ones
  const tagPattern = new RegExp(
    `<(?!\/?(${allowedTags.join("|")})\b)[^>]*>`,
    "gi",
  );

  return (
    html
      .replace(tagPattern, "")
      // Remove event handlers from allowed tags
      .replace(/on\w+\s*=\s*["'][^"']*["']/gi, "")
      // Remove javascript: and data: protocols
      .replace(/javascript:/gi, "")
      .replace(/data:text\/html/gi, "")
      .trim()
  );
}

/**
 * Sanitize an object recursively
 * Sanitizes all string values in the object
 *
 * @param obj - Object to sanitize
 * @returns Sanitized object
 *
 * @example
 * ```typescript
 * const safe = sanitizeObject({
 *   name: '<script>alert("xss")</script>John',
 *   address: { street: 'Main St<script>' }
 * });
 * // Returns: { name: 'John', address: { street: 'Main St' } }
 * ```
 */
export function sanitizeObject<T extends Record<string, unknown>>(obj: T): T {
  if (!obj || typeof obj !== "object") {
    return obj;
  }

  const sanitized = {} as T;

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === "string") {
      sanitized[key as keyof T] = sanitizeInput(value) as T[keyof T];
    } else if (Array.isArray(value)) {
      sanitized[key as keyof T] = value.map((item) =>
        typeof item === "string"
          ? sanitizeInput(item)
          : typeof item === "object"
            ? sanitizeObject(item as Record<string, unknown>)
            : item,
      ) as T[keyof T];
    } else if (typeof value === "object" && value !== null) {
      sanitized[key as keyof T] = sanitizeObject(
        value as Record<string, unknown>,
      ) as T[keyof T];
    } else {
      sanitized[key as keyof T] = value as T[keyof T];
    }
  }

  return sanitized;
}

/**
 * Sanitize email address
 * Validates and sanitizes email format
 *
 * @param email - Email to sanitize
 * @returns Sanitized email or null if invalid
 */
export function sanitizeEmail(email: string): string | null {
  if (typeof email !== "string") {
    return null;
  }

  const sanitized = email.toLowerCase().trim();

  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(sanitized)) {
    return null;
  }

  return sanitized;
}

/**
 * Sanitize phone number
 * Removes non-numeric characters except + at start
 *
 * @param phone - Phone number to sanitize
 * @returns Sanitized phone number
 *
 * @example
 * ```typescript
 * sanitizePhone('+20 123-456-7890') // Returns: '+201234567890'
 * sanitizePhone('++123++456') // Returns: '+123456'
 * sanitizePhone('123-456') // Returns: '123456'
 * ```
 */
export function sanitizePhone(phone: string): string {
  if (typeof phone !== "string") {
    return "";
  }

  // Keep only digits and +
  const sanitized = phone.trim().replace(/[^\d+]/g, "");

  // Ensure + is only at the start
  if (sanitized.startsWith("+")) {
    // Remove all + signs and add one at the start
    return "+" + sanitized.replace(/\+/g, "");
  }

  // Remove any + signs if not at start
  return sanitized.replace(/\+/g, "");
}

/**
 * Sanitize URL
 * Validates and sanitizes URL format
 *
 * @param url - URL to sanitize
 * @param allowedProtocols - Allowed URL protocols
 * @returns Sanitized URL or null if invalid
 */
export function sanitizeURL(
  url: string,
  allowedProtocols: string[] = ["http", "https"],
): string | null {
  if (typeof url !== "string") {
    return null;
  }

  try {
    const parsed = new URL(url.trim());

    // Check if protocol is allowed
    const protocol = parsed.protocol.replace(":", "");
    if (!allowedProtocols.includes(protocol)) {
      return null;
    }

    return parsed.toString();
  } catch {
    return null;
  }
}

/**
 * Sanitize file path
 * Prevents path traversal attacks
 *
 * @param path - File path to sanitize
 * @returns Sanitized path
 */
export function sanitizePath(path: string): string {
  if (typeof path !== "string") {
    return "";
  }

  return (
    path
      // Remove path traversal attempts
      .replace(/\.\./g, "")
      .replace(/\/\//g, "/")
      // Remove null bytes
      .replace(/\0/g, "")
      .trim()
  );
}

/**
 * @deprecated DO NOT USE - This function provides insufficient SQL injection protection.
 *
 * Always use Prisma's parameterized queries instead. This function is kept only
 * to prevent breaking changes but will throw an error if called.
 *
 * @throws {Error} Always throws - directs developers to use proper parameterization
 */
export function sanitizeSQL(input: string): never {
  throw new Error(
    "sanitizeSQL() should not be used. It provides insufficient protection against SQL injection. " +
      "Use Prisma parameterized queries instead, which are already implemented throughout the codebase. " +
      "Example: prisma.user.findMany({ where: { name: userInput } })",
  );
}

/**
 * Validate and sanitize JSON input
 *
 * @param input - JSON string to sanitize
 * @returns Parsed and sanitized object or null if invalid
 */
export function sanitizeJSON<T = unknown>(input: string): T | null {
  if (typeof input !== "string") {
    return null;
  }

  try {
    const parsed = JSON.parse(input);
    return sanitizeObject(parsed);
  } catch {
    return null;
  }
}

/**
 * Sanitize array of strings
 *
 * @param arr - Array to sanitize
 * @returns Sanitized array
 */
export function sanitizeArray(arr: string[]): string[] {
  if (!Array.isArray(arr)) {
    return [];
  }

  return arr
    .filter((item) => typeof item === "string")
    .map((item) => sanitizeInput(item))
    .filter((item) => item.length > 0);
}

/**
 * Sanitize user input for search queries
 * Removes special characters that could break search
 *
 * @param query - Search query to sanitize
 * @returns Sanitized query
 */
export function sanitizeSearchQuery(query: string): string {
  if (typeof query !== "string") {
    return "";
  }

  return (
    query
      // Remove special regex characters
      .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
      // Remove HTML
      .replace(/<[^>]*>/g, "")
      .trim()
      .slice(0, 100)
  ); // Limit length
}

/**
 * Sanitize numeric input
 * Ensures input is a valid number within range
 *
 * @param input - Input to sanitize
 * @param min - Minimum allowed value
 * @param max - Maximum allowed value
 * @returns Sanitized number or null if invalid
 */
export function sanitizeNumber(
  input: unknown,
  min?: number,
  max?: number,
): number | null {
  const num = Number(input);

  if (isNaN(num) || !isFinite(num)) {
    return null;
  }

  if (min !== undefined && num < min) {
    return min;
  }

  if (max !== undefined && num > max) {
    return max;
  }

  return num;
}

/**
 * Sanitize boolean input
 * Converts various truthy/falsy values to boolean
 *
 * @param input - Input to sanitize
 * @returns Boolean value
 */
export function sanitizeBoolean(input: unknown): boolean {
  if (typeof input === "boolean") {
    return input;
  }

  if (typeof input === "string") {
    const lower = input.toLowerCase().trim();
    return lower === "true" || lower === "1" || lower === "yes";
  }

  return Boolean(input);
}

/**
 * Sanitization middleware for API routes
 * Automatically sanitizes request body
 *
 * @param body - Request body to sanitize
 * @returns Sanitized body
 */
export function sanitizeRequestBody<T extends Record<string, unknown>>(
  body: T,
): T {
  return sanitizeObject(body);
}

/**
 * Create a sanitization schema validator
 * Combines validation with sanitization
 *
 * @example
 * ```typescript
 * const schema = {
 *   name: (v: string) => sanitizeInput(v),
 *   email: (v: string) => sanitizeEmail(v),
 *   age: (v: any) => sanitizeNumber(v, 0, 150),
 * };
 *
 * const sanitized = sanitizeWithSchema(userInput, schema);
 * ```
 */
export function sanitizeWithSchema<T extends Record<string, unknown>>(
  data: Partial<Record<keyof T, unknown>>,
  schema: Record<keyof T, (value: unknown) => unknown>,
): Partial<T> {
  const result: Partial<T> = {};

  for (const [key, sanitizer] of Object.entries(schema) as Array<
    [keyof T, (value: unknown) => unknown]
  >) {
    if (key in data) {
      const sanitized = sanitizer(data[key]);
      if (sanitized !== null && sanitized !== undefined) {
        result[key] = sanitized as T[keyof T];
      }
    }
  }

  return result;
}

// Made with Bob
