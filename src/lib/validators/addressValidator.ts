/**
 * Frontend address validation utilities
 * Uses the same validation schema as backend for consistency
 */
import {
  addressSchema,
  ADDRESS_VALIDATION,
} from "@/server/validators/addressSchemas";
import type { Address } from "@/types";

export type ValidationError = {
  field: string;
  message: string;
};

/**
 * Validate address data on the frontend using the same schema as backend
 */
export function validateAddress(data: Partial<Address>): {
  isValid: boolean;
  errors: ValidationError[];
} {
  try {
    // Convert partial address to full schema format
    const addressData = {
      label: data.label || "Home",
      street: data.street || "",
      apartment: data.apartment || null,
      city: data.city || "",
      state: data.state || null,
      country: data.country || "Egypt",
      phone: data.phone || null,
      notes: data.notes || null,
      isDefault: data.isDefault || false,
    };

    const result = addressSchema.safeParse(addressData);

    if (!result.success) {
      const errors: ValidationError[] = result.error.errors.map((err) => ({
        field: err.path.join("."),
        message: err.message,
      }));

      return {
        isValid: false,
        errors,
      };
    }

    return {
      isValid: true,
      errors: [],
    };
  } catch (error) {
    return {
      isValid: false,
      errors: [
        {
          field: "general",
          message: error instanceof Error ? error.message : "Validation failed",
        },
      ],
    };
  }
}

/**
 * Validate a single field
 */
export function validateAddressField(
  field: string,
  value: string | null | undefined,
): { isValid: boolean; message?: string } {
  const fieldMap: Record<string, keyof typeof ADDRESS_VALIDATION> = {
    street: "STREET_MAX_LENGTH",
    apartment: "APARTMENT_MAX_LENGTH",
    city: "CITY_MAX_LENGTH",
    state: "STATE_MAX_LENGTH",
    phone: "PHONE_MAX_LENGTH",
    notes: "NOTES_MAX_LENGTH",
  };

  const valueStr = value?.trim() || "";

  switch (field) {
    case "street":
      if (!valueStr) {
        return { isValid: false, message: "Street address is required" };
      }
      if (valueStr.length > ADDRESS_VALIDATION.STREET_MAX_LENGTH) {
        return {
          isValid: false,
          message: `Street address must be less than ${ADDRESS_VALIDATION.STREET_MAX_LENGTH} characters`,
        };
      }
      return { isValid: true };

    case "city":
      if (!valueStr) {
        return { isValid: false, message: "City is required" };
      }
      if (valueStr.length > ADDRESS_VALIDATION.CITY_MAX_LENGTH) {
        return {
          isValid: false,
          message: `City must be less than ${ADDRESS_VALIDATION.CITY_MAX_LENGTH} characters`,
        };
      }
      if (!ADDRESS_VALIDATION.CITY_REGEX.test(valueStr)) {
        return {
          isValid: false,
          message: "City name cannot contain numbers or special characters",
        };
      }
      return { isValid: true };

    case "phone":
      if (valueStr) {
        if (valueStr.length > ADDRESS_VALIDATION.PHONE_MAX_LENGTH) {
          return {
            isValid: false,
            message: `Phone number must be less than ${ADDRESS_VALIDATION.PHONE_MAX_LENGTH} characters`,
          };
        }
        const phoneDigits = valueStr.replace(/\D/g, "");
        if (!ADDRESS_VALIDATION.PHONE_EGYPT_REGEX.test(phoneDigits)) {
          return {
            isValid: false,
            message:
              "Please enter a valid phone number (must be 11 digits and start with 01)",
          };
        }
      }
      return { isValid: true };

    case "apartment":
      if (
        valueStr &&
        valueStr.length > ADDRESS_VALIDATION.APARTMENT_MAX_LENGTH
      ) {
        return {
          isValid: false,
          message: `Apartment must be less than ${ADDRESS_VALIDATION.APARTMENT_MAX_LENGTH} characters`,
        };
      }
      return { isValid: true };

    case "state":
      if (valueStr && valueStr.length > ADDRESS_VALIDATION.STATE_MAX_LENGTH) {
        return {
          isValid: false,
          message: `State must be less than ${ADDRESS_VALIDATION.STATE_MAX_LENGTH} characters`,
        };
      }
      return { isValid: true };

    case "notes":
      if (valueStr && valueStr.length > ADDRESS_VALIDATION.NOTES_MAX_LENGTH) {
        return {
          isValid: false,
          message: `Notes must be less than ${ADDRESS_VALIDATION.NOTES_MAX_LENGTH} characters`,
        };
      }
      return { isValid: true };

    default:
      return { isValid: true };
  }
}

/**
 * Export validation constants for use in components
 */
export { ADDRESS_VALIDATION };
