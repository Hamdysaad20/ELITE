import { NextRequest, NextResponse } from "next/server";
import {
  defaultLocale,
  isLocale,
  localeCookieName,
  locales,
  type Locale,
} from "./src/i18n/config";
import { getLocaleFromPathname } from "./src/i18n/routing";

const PUBLIC_FILE = /\.(.*)$/;

function getPreferredLocale(request: NextRequest): Locale {
  const cookieLocale = request.cookies.get(localeCookieName)?.value;
  if (isLocale(cookieLocale)) return cookieLocale;

  const acceptLanguage = request.headers.get("accept-language");
  if (!acceptLanguage) return defaultLocale;

  const candidates = acceptLanguage
    .split(",")
    .map((part) => part.trim().split(";")[0])
    .filter(Boolean);

  for (const candidate of candidates) {
    const lower = candidate.toLowerCase();
    if (lower.startsWith("ar")) return "ar";
    if (lower.startsWith("en")) return "en";
  }

  return defaultLocale;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    PUBLIC_FILE.test(pathname)
  ) {
    return NextResponse.next();
  }

  const pathnameLocale = getLocaleFromPathname(pathname);
  if (!pathnameLocale) {
    const locale = getPreferredLocale(request);
    const url = request.nextUrl.clone();
    url.pathname = pathname === "/" ? `/${locale}` : `/${locale}${pathname}`;
    return NextResponse.redirect(url);
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-locale", pathnameLocale);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.cookies.set(localeCookieName, pathnameLocale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
  return response;
}

export const config = {
  matcher: ["/((?!api|_next|.*\\..*).*)"],
};
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET;

// Routes that require authentication
const PROTECTED_ROUTES = [
  "/api/orders",
  "/api/cart",
  "/api/auth/me",
  "/api/loyalty",
  "/dashboard",
  "/profile",
  "/orders",
];

// Routes that require admin role
const ADMIN_ROUTES = [
  "/api/sync/products",
  "/api/admin",
  "/admin",
];

// Public routes (allow without auth)
const PUBLIC_ROUTES = [
  "/api/auth",
  "/api/products",
  "/api/categories",
  "/api/menu",
  "/api/health",
  "/api/pos/availability",
  "/auth",
  "/",
  "/_next",
  "/favicon.ico",
];

/**
 * Check if a path matches any pattern in the list
 */
function matchesRoute(pathname: string, routes: string[]): boolean {
  return routes.some((route) => pathname.startsWith(route));
}

/**
 * Middleware to protect routes and enforce authentication
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public routes
  if (matchesRoute(pathname, PUBLIC_ROUTES)) {
    return addSecurityHeaders(NextResponse.next());
  }

  // Check if route requires authentication
  const requiresAuth = matchesRoute(pathname, PROTECTED_ROUTES);
  const requiresAdmin = matchesRoute(pathname, ADMIN_ROUTES);

  if (!requiresAuth && !requiresAdmin) {
    return addSecurityHeaders(NextResponse.next());
  }

  // Special handling for sync routes with x-admin-token
  if (pathname.startsWith("/api/sync/")) {
    const adminToken = request.headers.get("x-admin-token");
    if (adminToken === process.env.ADMIN_TOKEN) {
      return addSecurityHeaders(NextResponse.next());
    }
    // If no valid admin token, fall through to regular auth check
  }

  // Get session token
  try {
    const token = await getToken({
      req: request,
      secret: NEXTAUTH_SECRET,
    });

    // No token = not authenticated
    if (!token || !token.sub) {
      return unauthorizedResponse(request, "Authentication required");
    }

    // Check if user account is suspended
    if (token.status === "suspended") {
      return unauthorizedResponse(request, "Account suspended");
    }

    if (token.status === "deleted") {
      return unauthorizedResponse(request, "Account not found");
    }

    // Check admin access
    if (requiresAdmin && token.role !== "admin") {
      return forbiddenResponse(request, "Admin access required");
    }

    // Authentication successful, proceed
    const response = NextResponse.next();
    
    // Add user context headers for downstream use
    response.headers.set("x-user-id", token.sub);
    if (token.email) {
      response.headers.set("x-user-email", token.email as string);
    }
    if (token.role) {
      response.headers.set("x-user-role", token.role as string);
    }

    return addSecurityHeaders(response);
  } catch (error) {
    console.error("Middleware auth error:", error);
    return unauthorizedResponse(request, "Authentication failed");
  }
}

/**
 * Return 401 Unauthorized response
 */
function unauthorizedResponse(request: NextRequest, message: string): NextResponse {
  const { pathname } = request.nextUrl;

  // For API routes, return JSON error
  if (pathname.startsWith("/api/")) {
    return NextResponse.json(
      { success: false, error: message },
      { status: 401 },
    );
  }

  // For pages, redirect to sign-in
  const signInUrl = new URL("/auth/signin", request.url);
  signInUrl.searchParams.set("callbackUrl", pathname);
  return NextResponse.redirect(signInUrl);
}

/**
 * Return 403 Forbidden response
 */
function forbiddenResponse(request: NextRequest, message: string): NextResponse {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/api/")) {
    return NextResponse.json(
      { success: false, error: message },
      { status: 403 },
    );
  }

  // For pages, redirect to error page
  const errorUrl = new URL("/auth/error", request.url);
  errorUrl.searchParams.set("error", "AccessDenied");
  return NextResponse.redirect(errorUrl);
}

/**
 * Add security headers to response
 */
function addSecurityHeaders(response: NextResponse): NextResponse {
  // Prevent clickjacking
  response.headers.set("X-Frame-Options", "DENY");
  
  // Prevent MIME type sniffing
  response.headers.set("X-Content-Type-Options", "nosniff");
  
  // Enable XSS protection
  response.headers.set("X-XSS-Protection", "1; mode=block");
  
  // Referrer policy
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  
  // Content Security Policy (adjust as needed)
  const cspHeader = `
    default-src 'self';
    script-src 'self' 'unsafe-eval' 'unsafe-inline';
    style-src 'self' 'unsafe-inline';
    img-src 'self' data: blob: https:;
    font-src 'self' data:;
    connect-src 'self' https:;
    frame-ancestors 'none';
  `.replace(/\s{2,}/g, " ").trim();
  
  response.headers.set("Content-Security-Policy", cspHeader);
  
  // Permissions Policy
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()",
  );

  return response;
}

// Configure which routes this middleware runs on
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|public).*)",
  ],
};

