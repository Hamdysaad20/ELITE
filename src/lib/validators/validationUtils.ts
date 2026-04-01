/**
 * General validation utilities for input sanitization and security
 */

import { ADDRESS_VALIDATION } from "@/server/validators/addressSchemas";

/**
 * Sanitize input string - removes dangerous characters and normalizes whitespace
 */
export function sanitizeInput(value: string): string {
  if (!value) return "";

  // Remove leading/trailing whitespace
  let sanitized = value.trim();

  // Normalize multiple spaces to single space
  sanitized = sanitized.replace(/\s+/g, " ");

  // Remove null bytes and control characters (except newlines and tabs)
  sanitized = sanitized.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, "");

  return sanitized;
}

/**
 * Check for XSS attempts
 */
export function containsXSS(value: string): boolean {
  return ADDRESS_VALIDATION.XSS_PATTERN.test(value);
}

/**
 * Check for SQL injection attempts
 */
export function containsSQLInjection(value: string): boolean {
  return ADDRESS_VALIDATION.SQL_INJECTION_PATTERN.test(value);
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate Egyptian phone number
 */
export function isValidEgyptianPhone(phone: string): boolean {
  const cleaned = phone.replace(/\s/g, "");
  return ADDRESS_VALIDATION.PHONE_EGYPT_REGEX.test(cleaned);
}

/**
 * Validate international phone number
 */
export function isValidInternationalPhone(phone: string): boolean {
  const cleaned = phone.replace(/\s/g, "");
  return ADDRESS_VALIDATION.PHONE_REGEX.test(cleaned);
}

/**
 * Validate phone number based on country
 */
export function validatePhoneByCountry(
  phone: string,
  country: string = "Egypt",
): {
  isValid: boolean;
  message?: string;
} {
  if (!phone || phone.trim() === "") {
    return { isValid: true };
  }

  const cleaned = phone.replace(/\s/g, "");

  if (country === "Egypt" || country === "EG" || country === "EGY") {
    if (isValidEgyptianPhone(phone)) {
      return { isValid: true };
    }
    return {
      isValid: false,
      message:
        "Please enter a valid Egyptian phone number (e.g., +20 1XX XXX XXXX or 01XXXXXXXXX)",
    };
  }

  if (isValidInternationalPhone(phone)) {
    return { isValid: true };
  }

  return {
    isValid: false,
    message: "Please enter a valid phone number (e.g., +20 123 456 7890)",
  };
}

/**
 * Check if string contains only allowed characters for city names
 */
export function isValidCityName(city: string): boolean {
  return ADDRESS_VALIDATION.CITY_REGEX.test(city);
}

/**
 * Check if string contains only allowed characters for street addresses
 */
export function isValidStreetAddress(street: string): boolean {
  return ADDRESS_VALIDATION.STREET_REGEX.test(street);
}

/**
 * Validate minimum length
 */
export function validateMinLength(
  value: string,
  minLength: number,
  fieldName: string,
): {
  isValid: boolean;
  message?: string;
} {
  if (value.length < minLength) {
    return {
      isValid: false,
      message: `${fieldName} must be at least ${minLength} characters`,
    };
  }
  return { isValid: true };
}

/**
 * Validate maximum length
 */
export function validateMaxLength(
  value: string,
  maxLength: number,
  fieldName: string,
): {
  isValid: boolean;
  message?: string;
} {
  if (value.length > maxLength) {
    return {
      isValid: false,
      message: `${fieldName} must be less than ${maxLength} characters`,
    };
  }
  return { isValid: true };
}

/**
 * Comprehensive input validation with security checks
 */
export function validateInputSecurity(
  value: string,
  fieldName: string,
): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (containsXSS(value)) {
    errors.push(`${fieldName} contains potentially dangerous content`);
  }

  if (containsSQLInjection(value)) {
    errors.push(`${fieldName} contains potentially dangerous content`);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Calculate address completeness score (0-100)
 */
export function calculateAddressCompleteness(address: {
  street?: string | null;
  city?: string | null;
  apartment?: string | null;
  state?: string | null;
  phone?: string | null;
  country?: string | null;
}): number {
  let score = 0;
  const maxScore = 100;

  // Required fields (40 points total)
  if (address.street?.trim()) score += 20;
  if (address.city?.trim()) score += 20;

  // Optional but important fields (60 points total)
  if (address.apartment?.trim()) score += 10;
  if (address.state?.trim()) score += 10;
  if (address.phone?.trim()) score += 20;
  if (address.country?.trim()) score += 20;

  return Math.min(score, maxScore);
}

/**
 * Get address completeness level
 */
export function getAddressCompletenessLevel(
  score: number,
): "complete" | "good" | "fair" | "poor" {
  if (score >= 90) return "complete";
  if (score >= 70) return "good";
  if (score >= 50) return "fair";
  return "poor";
}
