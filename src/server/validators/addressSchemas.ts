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
  ZIP_CODE_MAX_LENGTH: 20,
  ZIP_CODE_MIN_LENGTH: 3,
  PHONE_MAX_LENGTH: 20,
  PHONE_MIN_LENGTH: 8,
  NOTES_MAX_LENGTH: 500,
  NOTES_MIN_LENGTH: 1,

  // Regex patterns
  PHONE_REGEX: /^[\+]?[1-9][\d\s\-\(\)]{7,19}$/,
  PHONE_EGYPT_REGEX: /^(\+20|0)?1[0-9]{9}$/, // Egyptian phone format
  ZIP_REGEX: /^[A-Za-z0-9\s\-]{3,20}$/,
  ZIP_EGYPT_REGEX: /^\d{5}$/, // Egyptian postal code (5 digits)
  CITY_REGEX: /^[A-Za-z\s\-\'\.]+$/,
  STREET_REGEX: /^[A-Za-z0-9\s\-\'\.\,\#\/]+$/, // Allows numbers for street numbers
  STATE_REGEX: /^[A-Za-z\s\-\'\.]+$/,
  APARTMENT_REGEX: /^[A-Za-z0-9\s\-\#\/]+$/,

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
  const hasLetter = /[A-Za-z]/.test(value);
  return hasLetter;
};

const validatePhoneCountry = (
  phone: string,
  country: string = "Egypt",
): boolean => {
  if (!phone) return true;
  const cleaned = phone.replace(/\s/g, "");

  if (country === "Egypt" || country === "EG" || country === "EGY") {
    // Egyptian phone: +20 or 0 followed by 1 and 9 digits
    return (
      ADDRESS_VALIDATION.PHONE_EGYPT_REGEX.test(cleaned) ||
      ADDRESS_VALIDATION.PHONE_REGEX.test(cleaned)
    );
  }

  // Default to international format
  return ADDRESS_VALIDATION.PHONE_REGEX.test(cleaned);
};

const validateZipCountry = (
  zip: string,
  country: string = "Egypt",
): boolean => {
  if (!zip) return true;

  if (country === "Egypt" || country === "EG" || country === "EGY") {
    // Egyptian postal codes are 5 digits
    return (
      ADDRESS_VALIDATION.ZIP_EGYPT_REGEX.test(zip) ||
      ADDRESS_VALIDATION.ZIP_REGEX.test(zip)
    );
  }

  // Default to alphanumeric format
  return ADDRESS_VALIDATION.ZIP_REGEX.test(zip);
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

  apartment: z
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

  state: z
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

  zipCode: z
    .string()
    .trim()
    .min(
      ADDRESS_VALIDATION.ZIP_CODE_MIN_LENGTH,
      `Zip code must be at least ${ADDRESS_VALIDATION.ZIP_CODE_MIN_LENGTH} characters if provided`,
    )
    .max(
      ADDRESS_VALIDATION.ZIP_CODE_MAX_LENGTH,
      `Zip code must be less than ${ADDRESS_VALIDATION.ZIP_CODE_MAX_LENGTH} characters`,
    )
    .transform(sanitizeInput)
    .refine(
      (val: string) =>
        !val || val === "" || ADDRESS_VALIDATION.ZIP_REGEX.test(val),
      {
        message:
          "Please enter a valid zip/postal code (3-20 alphanumeric characters)",
      },
    )
    .optional()
    .nullable(),

  phone: z
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
        !val ||
        val === "" ||
        ADDRESS_VALIDATION.PHONE_REGEX.test(val.replace(/\s/g, "")),
      { message: "Please enter a valid phone number (e.g., +20 123 456 7890)" },
    )
    .optional()
    .nullable(),

  notes: z
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

  isDefault: z.boolean().optional().default(false),
});

// Full address schema with superRefine validations
export const addressSchema = baseAddressSchema.superRefine((data, ctx) => {
  // Country-specific validation for zip code
  if (data.zipCode && typeof data.zipCode === "string" && data.zipCode.trim()) {
    const country = (data.country || "Egypt") as string;
    if (!validateZipCountry(data.zipCode, country)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          country === "Egypt"
            ? "Egyptian postal codes must be 5 digits (e.g., 12345)"
            : "Please enter a valid zip/postal code",
        path: ["zipCode"],
      });
    }
  }

  // Country-specific validation for phone
  if (data.phone && typeof data.phone === "string" && data.phone.trim()) {
    const country = (data.country || "Egypt") as string;
    if (!validatePhoneCountry(data.phone, country)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          country === "Egypt"
            ? "Please enter a valid Egyptian phone number (e.g., +20 1XX XXX XXXX or 01XXXXXXXXX)"
            : "Please enter a valid phone number (e.g., +20 123 456 7890)",
        path: ["phone"],
      });
    }
  }

  // Address completeness check: must have street, city, and at least one more field
  const hasStreet = !!data.street;
  const hasCity = !!data.city;
  const hasAdditional = !!(
    data.apartment ||
    data.state ||
    data.zipCode ||
    data.phone
  );

  if (!hasStreet || !hasCity || !hasAdditional) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message:
        "Address must include street, city, and at least one additional field (apartment, state, zip code, or phone)",
      path: ["street"],
    });
  }
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
    // Country-specific validation for zip code
    if (
      data.zipCode &&
      typeof data.zipCode === "string" &&
      data.zipCode.trim()
    ) {
      const country = (data.country || "Egypt") as string;
      if (!validateZipCountry(data.zipCode, country)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            country === "Egypt"
              ? "Egyptian postal codes must be 5 digits (e.g., 12345)"
              : "Please enter a valid zip/postal code",
          path: ["zipCode"],
        });
      }
    }

    // Country-specific validation for phone
    if (data.phone && typeof data.phone === "string" && data.phone.trim()) {
      const country = (data.country || "Egypt") as string;
      if (!validatePhoneCountry(data.phone, country)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            country === "Egypt"
              ? "Please enter a valid Egyptian phone number (e.g., +20 1XX XXX XXXX or 01XXXXXXXXX)"
              : "Please enter a valid phone number (e.g., +20 123 456 7890)",
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
