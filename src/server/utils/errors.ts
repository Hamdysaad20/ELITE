/**
 * Centralized API Error types to standardize error handling and status codes
 */
import { NextResponse } from "next/server";

export class ApiError extends Error {
  status: number;
  code?: string;

  constructor(message: string, status = 500, code?: string) {
    super(message);
    this.name = this.constructor.name;
    this.status = status;
    this.code = code;
  }
}

export class BadRequestError extends ApiError {
  constructor(message = "Bad Request", code = "BAD_REQUEST") {
    super(message, 400, code);
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message = "Unauthorized", code = "UNAUTHORIZED") {
    super(message, 401, code);
  }
}

export class ForbiddenError extends ApiError {
  constructor(message = "Forbidden", code = "FORBIDDEN") {
    super(message, 403, code);
  }
}

export class NotFoundError extends ApiError {
  constructor(message = "Not Found", code = "NOT_FOUND") {
    super(message, 404, code);
  }
}

export class ConflictError extends ApiError {
  constructor(message = "Conflict", code = "CONFLICT") {
    super(message, 409, code);
  }
}

export class UnprocessableEntityError extends ApiError {
  constructor(message = "Unprocessable Entity", code = "UNPROCESSABLE_ENTITY") {
    super(message, 422, code);
  }
}

export class ServiceUnavailableError extends ApiError {
  constructor(message = "Service Unavailable", code = "SERVICE_UNAVAILABLE") {
    super(message, 503, code);
  }
}

export class TooManyRequestsError extends ApiError {
  constructor(message = "Too Many Requests", code = "TOO_MANY_REQUESTS") {
    super(message, 429, code);
  }
}

export function handleError(error: unknown): NextResponse {
  if (error instanceof ApiError) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        code: error.code,
      },
      { status: error.status },
    );
  }

  // Intercept unexpected system failures without leaking server states
  console.error("[CRITICAL] Unhandled API Exception:", error);

  return NextResponse.json(
    {
      success: false,
      error: "Internal Server Error",
    },
    { status: 500 },
  );
}
