import type { NextRequest } from "next/server";
import type { ApiResponse } from "@/types";
import { ApiError } from "./errors";
import { API_CONFIG } from "@/lib/constants";

/**
 * Creates a standardized success response object
 *
 * @template T - The type of data being returned
 * @param data - The response data
 * @param message - Optional success message
 * @returns Standardized API success response
 *
 * @example
 * ```typescript
 * const response = successResponse({ items: [] }, 'Items fetched successfully');
 * ```
 */
export function successResponse<T>(data: T, message?: string): ApiResponse<T> {
  return {
    success: true,
    data,
    message,
  };
}

/**
 * Creates a standardized error response object
 *
 * @param error - The error message
 * @param message - Optional additional context message
 * @returns Standardized API error response
 *
 * @example
 * ```typescript
 * const response = errorResponse('Invalid input', 'Please check your data');
 * ```
 */
export function errorResponse(error: string, message?: string): ApiResponse {
  return {
    success: false,
    error,
    message,
  };
}

/**
 * Creates a JSON HTTP response with proper headers and status code
 *
 * @template T - The type of response data
 * @param data - The API response object
 * @param status - HTTP status code (default: 200)
 * @returns Next.js Response object with JSON data
 *
 * @example
 * ```typescript
 * return jsonResponse(successResponse(data), 201);
 * ```
 */
export function jsonResponse<T>(data: ApiResponse<T>, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "private, no-cache",
    },
  });
}

/**
 * Centralized error handler that converts various error types to proper API responses
 *
 * @param error - The error to handle (can be ApiError, Error, or unknown)
 * @returns Formatted JSON error response
 *
 * @example
 * ```typescript
 * try {
 *   // API logic here
 * } catch (error) {
 *   return handleApiError(error);
 * }
 * ```
 */
export function handleApiError(error: unknown): Response {
  console.error("API Error:", error);

  if (error instanceof ApiError) {
    return jsonResponse(errorResponse(error.message, error.code), error.status);
  }

  if (error instanceof Error) {
    return jsonResponse(errorResponse(error.message), 500);
  }

  return jsonResponse(errorResponse("An unexpected error occurred"), 500);
}

/**
 * Safely parses JSON request body with proper error handling
 *
 * @template T - Expected type of the parsed body
 * @param request - Next.js request object
 * @returns Parsed request body
 * @throws Error if body is invalid JSON
 *
 * @example
 * ```typescript
 * const body = await parseRequestBody<CreateUserInput>(request);
 * ```
 */
export async function parseRequestBody<T>(request: NextRequest): Promise<T> {
  try {
    const text = await request.text();
    if (!text.trim()) {
      throw new Error("Request body is empty");
    }
    return JSON.parse(text) as T;
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error("Invalid JSON in request body");
    }
    throw new Error("Failed to parse request body");
  }
}

/**
 * Extracts and returns URL search parameters as a key-value object
 *
 * @param request - Next.js request object
 * @returns Object containing all query parameters
 *
 * @example
 * ```typescript
 * const { page = '1', limit = '10' } = getQueryParams(request);
 * ```
 */
export function getQueryParams(request: NextRequest): Record<string, string> {
  const { searchParams } = new URL(request.url);
  return Object.fromEntries(searchParams.entries());
}

/**
 * Validates that all required fields are present in the data object
 *
 * @template T - Type of the data object
 * @param data - Object to validate
 * @param requiredFields - Array of required field names
 * @returns Error message if validation fails, null if all fields are present
 *
 * @example
 * ```typescript
 * const error = validateRequiredFields(userData, ['email', 'name']);
 * if (error) throw new BadRequestError(error);
 * ```
 */
export function validateRequiredFields<T extends Record<string, unknown>>(
  data: T,
  requiredFields: (keyof T)[],
): string | null {
  for (const field of requiredFields) {
    const value = data[field];
    if (value === undefined || value === null || value === "") {
      return `Missing required field: ${String(field)}`;
    }
  }
  return null;
}

/**
 * Extracts user ID from request headers with fallback to default
 *
 * @param request - Next.js request object
 * @returns User ID from header or default user ID
 *
 * @example
 * ```typescript
 * const userId = getUserId(request);
 * ```
 */
export function getUserId(request: NextRequest): string {
  return request.headers.get("x-user-id") || API_CONFIG.DEFAULT_USER_ID;
}
