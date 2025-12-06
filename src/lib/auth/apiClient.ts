import { getSession } from "next-auth/react";

/**
 * Authenticated fetch wrapper that automatically includes NextAuth session
 * 
 * @example
 * ```typescript
 * const response = await authFetch("/api/orders");
 * const data = await response.json();
 * ```
 */
export async function authFetch(
  url: string,
  options?: RequestInit,
): Promise<Response> {
  const session = await getSession();

  const headers = new Headers(options?.headers);

  // Add session token if available
  if (session?.user) {
    // NextAuth handles cookies automatically, but you can add custom headers if needed
    headers.set("X-Requested-With", "XMLHttpRequest");
  }

  return fetch(url, {
    ...options,
    headers,
    credentials: "include", // Important: include cookies
  });
}

/**
 * Type-safe API client with automatic error handling
 * 
 * @example
 * ```typescript
 * const orders = await apiClient.get<Order[]>("/api/orders");
 * const newOrder = await apiClient.post<Order>("/api/orders", { items: [...] });
 * ```
 */
export const apiClient = {
  async get<T>(url: string, options?: RequestInit): Promise<T> {
    const response = await authFetch(url, {
      ...options,
      method: "GET",
    });

    if (!response.ok) {
      throw new ApiError(response.status, await response.text());
    }

    const data = await response.json();
    return data.data || data;
  },

  async post<T>(
    url: string,
    body?: any,
    options?: RequestInit,
  ): Promise<T> {
    const response = await authFetch(url, {
      ...options,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      throw new ApiError(response.status, await response.text());
    }

    const data = await response.json();
    return data.data || data;
  },

  async patch<T>(
    url: string,
    body?: any,
    options?: RequestInit,
  ): Promise<T> {
    const response = await authFetch(url, {
      ...options,
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      throw new ApiError(response.status, await response.text());
    }

    const data = await response.json();
    return data.data || data;
  },

  async delete<T>(url: string, options?: RequestInit): Promise<T> {
    const response = await authFetch(url, {
      ...options,
      method: "DELETE",
    });

    if (!response.ok) {
      throw new ApiError(response.status, await response.text());
    }

    const data = await response.json();
    return data.data || data;
  },
};

/**
 * Custom API error class
 */
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }

  get isUnauthorized() {
    return this.status === 401;
  }

  get isForbidden() {
    return this.status === 403;
  }

  get isNotFound() {
    return this.status === 404;
  }

  get isRateLimited() {
    return this.status === 429;
  }
}

