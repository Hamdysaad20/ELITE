import { z } from "zod";

// Validation constants - shared between FE and BE
export const ADDRESS_VALIDATION = {
  // Length constraints
  LABEL_MAX_LENGTH: 20,
  LABEL_MIN_LENGTH: 1,
  STREET_MAX_LENGTH: 200,
  STREET_MIN_LENGTH: 3,
  APARTMENT_MAX_LENGTH: 50,
  APARTMENT_MIN_LENGTH: 1,
  CITY_MAX_LENGTH: 100,
  CITY_MIN_LENGTH: 2,
  STATE_MAX_LENGTH: 100,
  STATE_MIN_LENGTH: 2,
  PHONE_MAX_LENGTH: 11,
  PHONE_MIN_LENGTH: 11,
  NOTES_MAX_LENGTH: 500,
  NOTES_MIN_LENGTH: 1,

  // Regex patterns
  PHONE_REGEX: /^01\d{9}$/,
  PHONE_EGYPT_REGEX: /^01\d{9}$/, // Egyptian mobile format: 01XXXXXXXXX
  CITY_REGEX: /^[\p{L}\p{M}\s\-'.]+$/u,
  STREET_REGEX: /^[\p{L}\p{M}\p{N}\s\-'.#,\/،]+$/u, // Allows numbers and Arabic punctuation
  STATE_REGEX: /^[\p{L}\p{M}\s\-'.]+$/u,
  APARTMENT_REGEX: /^[\p{L}\p{M}\p{N}\s\-#\/.،,]+$/u,

  // Security patterns (prevent XSS, SQL injection attempts)
  XSS_PATTERN: /<script|javascript:|onerror=|onload=|eval\(|expression\(/i,
  SQL_INJECTION_PATTERN:
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE|UNION|SCRIPT)\b)/i,

  // Allowed countries (for future expansion)
  ALLOWED_COUNTRIES: ["Egypt", "EG", "EGY"] as const,

  // Address completeness thresholds
  MIN_COMPLETE_FIELDS: 3, // street, city, and at least one more field
} as const;

// Address label enum
export const AddressLabel = z.enum(["Home", "Work", "Office", "Other"]);

// Custom validation functions
const sanitizeInput = (value: string): string => {
  // Remove leading/trailing whitespace and normalize spaces
  return value.trim().replace(/\s+/g, " ");
};

const validateNoXSS = (value: string): boolean => {
  return !ADDRESS_VALIDATION.XSS_PATTERN.test(value);
};

const validateNoSQLInjection = (value: string): boolean => {
  return !ADDRESS_VALIDATION.SQL_INJECTION_PATTERN.test(value);
};

const validateStreetFormat = (value: string): boolean => {
  // Street should contain at least one letter (not just numbers)
  const hasLetter = /\p{L}/u.test(value);
  return hasLetter;
};

const validatePhoneCountry = (
  phone: string,
  country: string = "Egypt",
): boolean => {
  if (!phone) return true;
  const cleaned = phone.replace(/\D/g, "");

  if (country === "Egypt" || country === "EG" || country === "EGY") {
    // Strict Egyptian mobile format: must start with 01 and be exactly 11 digits.
    return ADDRESS_VALIDATION.PHONE_EGYPT_REGEX.test(cleaned);
  }

  // Default to international format
  if (cleaned.length < ADDRESS_VALIDATION.PHONE_MIN_LENGTH) {
    return false;
  }

  return ADDRESS_VALIDATION.PHONE_REGEX.test(cleaned);
};

// Base address schema object (before superRefine)
const baseAddressSchema = z.object({
  label: AddressLabel,

  street: z
    .string()
    .min(
      ADDRESS_VALIDATION.STREET_MIN_LENGTH,
      `Street address must be at least ${ADDRESS_VALIDATION.STREET_MIN_LENGTH} characters`,
    )
    .max(
      ADDRESS_VALIDATION.STREET_MAX_LENGTH,
      `Street address must be less than ${ADDRESS_VALIDATION.STREET_MAX_LENGTH} characters`,
    )
    .trim()
    .transform(sanitizeInput)
    .refine(validateNoXSS, {
      message: "Street address contains invalid characters",
    })
    .refine(validateNoSQLInjection, {
      message: "Street address contains invalid characters",
    })
    .refine(validateStreetFormat, {
      message: "Street address must contain at least one letter",
    })
    .refine((val) => ADDRESS_VALIDATION.STREET_REGEX.test(val), {
      message: "Street address contains invalid characters",
    }),

  apartment: z.preprocess(
    (val) =>
      typeof val === "string" && val.trim() === ""
        ? undefined
        : (val as unknown),
    z
      .string()
      .min(
        ADDRESS_VALIDATION.APARTMENT_MIN_LENGTH,
        `Apartment must be at least ${ADDRESS_VALIDATION.APARTMENT_MIN_LENGTH} character if provided`,
      )
      .max(
        ADDRESS_VALIDATION.APARTMENT_MAX_LENGTH,
        `Apartment must be less than ${ADDRESS_VALIDATION.APARTMENT_MAX_LENGTH} characters`,
      )
      .trim()
      .transform(sanitizeInput)
      .refine((val) => !val || validateNoXSS(val), {
        message: "Apartment contains invalid characters",
      })
      .refine((val) => !val || validateNoSQLInjection(val), {
        message: "Apartment contains invalid characters",
      })
      .refine((val) => !val || ADDRESS_VALIDATION.APARTMENT_REGEX.test(val), {
        message: "Apartment contains invalid characters",
      })
      .optional()
      .nullable(),
  ),

  city: z
    .string()
    .min(
      ADDRESS_VALIDATION.CITY_MIN_LENGTH,
      `City must be at least ${ADDRESS_VALIDATION.CITY_MIN_LENGTH} characters`,
    )
    .max(
      ADDRESS_VALIDATION.CITY_MAX_LENGTH,
      `City must be less than ${ADDRESS_VALIDATION.CITY_MAX_LENGTH} characters`,
    )
    .trim()
    .transform(sanitizeInput)
    .refine(validateNoXSS, { message: "City name contains invalid characters" })
    .refine(validateNoSQLInjection, {
      message: "City name contains invalid characters",
    })
    .refine((val) => ADDRESS_VALIDATION.CITY_REGEX.test(val), {
      message: "City name cannot contain numbers or special characters",
    }),

  state: z.preprocess(
    (val) =>
      typeof val === "string" && val.trim() === ""
        ? undefined
        : (val as unknown),
    z
      .string()
      .min(
        ADDRESS_VALIDATION.STATE_MIN_LENGTH,
        `State must be at least ${ADDRESS_VALIDATION.STATE_MIN_LENGTH} characters if provided`,
      )
      .max(
        ADDRESS_VALIDATION.STATE_MAX_LENGTH,
        `State must be less than ${ADDRESS_VALIDATION.STATE_MAX_LENGTH} characters`,
      )
      .trim()
      .transform(sanitizeInput)
      .refine((val) => !val || validateNoXSS(val), {
        message: "State contains invalid characters",
      })
      .refine((val) => !val || validateNoSQLInjection(val), {
        message: "State contains invalid characters",
      })
      .refine((val) => !val || ADDRESS_VALIDATION.STATE_REGEX.test(val), {
        message: "State contains invalid characters",
      })
      .optional()
      .nullable(),
  ),

  country: z
    .string()
    .default("Egypt")
    .refine(
      (val) =>
        ADDRESS_VALIDATION.ALLOWED_COUNTRIES.some(
          (c) =>
            c.toLowerCase() === val.toLowerCase() ||
            val.toLowerCase().includes(c.toLowerCase()),
        ),
      { message: "Country not supported" },
    )
    .optional(),

  phone: z.preprocess(
    (val) =>
      typeof val === "string" && val.trim() === ""
        ? undefined
        : (val as unknown),
    z
      .string()
      .trim()
      .min(
        ADDRESS_VALIDATION.PHONE_MIN_LENGTH,
        `Phone number must be at least ${ADDRESS_VALIDATION.PHONE_MIN_LENGTH} digits if provided`,
      )
      .max(
        ADDRESS_VALIDATION.PHONE_MAX_LENGTH,
        `Phone number must be less than ${ADDRESS_VALIDATION.PHONE_MAX_LENGTH} characters`,
      )
      .transform(sanitizeInput)
      .refine(
        (val: string) =>
          !val || val === "" || validatePhoneCountry(val, "Egypt"),
        {
          message:
            "Please enter a valid phone number (must be 11 digits and start with 01)",
        },
      )
      .optional()
      .nullable(),
  ),

  notes: z.preprocess(
    (val) =>
      typeof val === "string" && val.trim() === ""
        ? undefined
        : (val as unknown),
    z
      .string()
      .trim()
      .min(
        ADDRESS_VALIDATION.NOTES_MIN_LENGTH,
        `Notes must be at least ${ADDRESS_VALIDATION.NOTES_MIN_LENGTH} character if provided`,
      )
      .max(
        ADDRESS_VALIDATION.NOTES_MAX_LENGTH,
        `Notes must be less than ${ADDRESS_VALIDATION.NOTES_MAX_LENGTH} characters`,
      )
      .transform(sanitizeInput)
      .refine((val: string) => !val || validateNoXSS(val), {
        message: "Notes contains invalid characters",
      })
      .refine((val: string) => !val || validateNoSQLInjection(val), {
        message: "Notes contains invalid characters",
      })
      .optional()
      .nullable(),
  ),

  isDefault: z.boolean().optional().default(false),
});

// Full address schema with superRefine validations
export const addressSchema = baseAddressSchema.superRefine((data, ctx) => {
  // Country-specific validation for phone
  if (data.phone && typeof data.phone === "string" && data.phone.trim()) {
    const country = (data.country || "Egypt") as string;
    if (!validatePhoneCountry(data.phone, country)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          country === "Egypt"
            ? "Please enter a valid Egyptian phone number (must be 11 digits and start with 01)"
            : "Please enter a valid phone number",
        path: ["phone"],
      });
    }
  }

  // Note: We intentionally do NOT enforce "completeness" here.
  // Apartment/notes and other fields are optional; checkout/payment flows can
  // enforce stricter requirements when needed.
});

// Schema for creating a new address (all fields required except optional ones)
export const createAddressSchema = addressSchema;

// Schema for updating an address (all fields optional)
// Use the base schema and make it partial, then apply a modified superRefine
export const updateAddressSchema = baseAddressSchema
  .partial()
  .extend({
    label: AddressLabel.optional(),
  })
  .superRefine((data, ctx) => {
    // Only validate if fields are provided (skip validation for undefined fields)
    // Country-specific validation for phone
    if (data.phone && typeof data.phone === "string" && data.phone.trim()) {
      const country = (data.country || "Egypt") as string;
      if (!validatePhoneCountry(data.phone, country)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            country === "Egypt"
              ? "Please enter a valid Egyptian phone number (must be 11 digits and start with 01)"
              : "Please enter a valid phone number",
          path: ["phone"],
        });
      }
    }
    // Note: We skip the completeness check for updates since partial updates are allowed
  });

// Type exports
export type AddressInput = z.infer<typeof addressSchema>;
export type CreateAddressInput = z.infer<typeof createAddressSchema>;
export type UpdateAddressInput = z.infer<typeof updateAddressSchema>;
