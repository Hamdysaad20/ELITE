import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import {
  defaultLocale,
  isLocale,
  localeCookieName,
  type Locale,
} from "./src/i18n/config";
import { getLocaleFromPathname, stripLocaleFromPathname } from "./src/i18n/routing";

const NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET;
const PUBLIC_FILE = /\.(.*)$/;

// Routes that require authentication (without locale prefix)
const PROTECTED_ROUTES = [
  "/api/orders",
  "/api/cart",
  "/api/auth/me",
  "/api/loyalty",
  "/dashboard",
  "/profile",
  "/orders",
];

// Routes that require admin role (without locale prefix)
const ADMIN_ROUTES = [
  "/api/sync/products",
  "/api/admin",
  "/admin",
];

// Public routes (allow without auth, without locale prefix)
const PUBLIC_ROUTES = [
  "/api/auth",
  "/api/products",
  "/api/categories",
  "/api/menu",
  "/api/health",
  "/api/pos/availability",
  "/api/checkout/config",
  "/api/deals",
  "/api/recommendations",
  "/api/reviews",
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
 * Get preferred locale from request
 */
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

/**
 * Return 401 Unauthorized response
 */
function unauthorizedResponse(
  request: NextRequest,
  message: string,
  locale: Locale,
): NextResponse {
  const { pathname } = request.nextUrl;
  const normalizedPath = stripLocaleFromPathname(pathname);

  // For API routes, return JSON error
  if (normalizedPath.startsWith("/api/")) {
    return NextResponse.json(
      { success: false, error: message },
      { status: 401 },
    );
  }

  // For pages, redirect to sign-in with locale
  const signInUrl = new URL(`/${locale}/auth/signin`, request.url);
  signInUrl.searchParams.set("callbackUrl", pathname);
  return NextResponse.redirect(signInUrl);
}

/**
 * Return 403 Forbidden response
 */
function forbiddenResponse(
  request: NextRequest,
  message: string,
  locale: Locale,
): NextResponse {
  const { pathname } = request.nextUrl;
  const normalizedPath = stripLocaleFromPathname(pathname);

  if (normalizedPath.startsWith("/api/")) {
    return NextResponse.json(
      { success: false, error: message },
      { status: 403 },
    );
  }

  // For pages, redirect to error page with locale
  const errorUrl = new URL(`/${locale}/auth/error`, request.url);
  errorUrl.searchParams.set("error", "AccessDenied");
  return NextResponse.redirect(errorUrl);
}

/**
 * Verify CSRF token for state-changing requests
 *
 * TODO: Re-enable once client-side CSRF token handling is implemented
 * Currently disabled to prevent breaking existing functionality
 */
function verifyCSRFToken(request: NextRequest): boolean {
  // CSRF protection temporarily disabled
  // Need to implement client-side token handling before enabling
  return true;

  /* Commented out until client-side is ready
  const method = request.method;

  // Only check CSRF for state-changing methods
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    return true;
  }

  // Skip CSRF check for auth routes (NextAuth handles its own CSRF)
  const pathname = request.nextUrl.pathname;
  if (pathname.startsWith('/api/auth/')) {
    return true;
  }

  // Get CSRF token from header
  const csrfToken = request.headers.get('x-csrf-token');

  // Get session CSRF token from cookie
  const sessionToken = request.cookies.get('next-auth.csrf-token')?.value;

  // Verify tokens exist and match using timing-safe comparison
  if (!csrfToken || !sessionToken) {
    return false;
  }

  try {
    const tokenBuffer = Buffer.from(csrfToken);
    const sessionBuffer = Buffer.from(sessionToken);
    
    if (tokenBuffer.length !== sessionBuffer.length) {
      return false;
    }
    
    return timingSafeEqual(tokenBuffer, sessionBuffer);
  } catch {
    return false;
  }
  */
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

  // Content Security Policy
  // Note: unsafe-inline for styles is needed for Tailwind/CSS-in-JS
  // unsafe-eval for scripts should be removed if not needed by dependencies
  const cspHeader = `
    default-src 'self';
    script-src 'self';
    style-src 'self' 'unsafe-inline';
    img-src 'self' data: blob: https:;
    font-src 'self' data:;
    connect-src 'self' https:;
    frame-ancestors 'none';
  `
    .replace(/\s{2,}/g, " ")
    .trim();

  response.headers.set("Content-Security-Policy", cspHeader);

  // Permissions Policy
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()",
  );

  return response;
}

/**
 * Unified middleware: handles i18n first, then authentication
 */
async function runMiddleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for static files, API routes (handled separately), and Next.js internals
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    PUBLIC_FILE.test(pathname)
  ) {
    return NextResponse.next();
  }

  // Step 1: Handle i18n locale detection and redirect
  const pathnameLocale = getLocaleFromPathname(pathname);
  let locale: Locale;
  let normalizedPath: string;

  if (!pathnameLocale && !pathname.startsWith("/api")) {
    // Admin routes default to Arabic locale
    const isAdminRoute = pathname.startsWith("/admin");
    locale = isAdminRoute ? "ar" : getPreferredLocale(request);
    const url = request.nextUrl.clone();
    url.pathname = pathname === "/" ? `/${locale}` : `/${locale}${pathname}`;
    return NextResponse.redirect(url);
  }

  // For API routes lacking a locale prefix, assign the preferred locale without redirecting
  locale = pathnameLocale || getPreferredLocale(request);
  normalizedPath = stripLocaleFromPathname(pathname);

  // Redirect /en/admin/* to /ar/admin/* (admin is Arabic-first)
  if (pathnameLocale === "en" && normalizedPath.startsWith("/admin")) {
    const url = request.nextUrl.clone();
    url.pathname = `/ar${normalizedPath}`;
    return NextResponse.redirect(url);
  }

  // Step 2: CSRF Protection for state-changing requests
  if (normalizedPath.startsWith("/api/") && !verifyCSRFToken(request)) {
    return NextResponse.json(
      {
        success: false,
        error: "Invalid CSRF token. Please refresh the page and try again.",
        code: "CSRF_TOKEN_INVALID"
      },
      { status: 403 }
    );
  }

  // Step 3: Handle authentication for protected routes
  // Check normalized path (without locale) against route lists
  const requiresAuth = matchesRoute(normalizedPath, PROTECTED_ROUTES);
  const requiresAdmin = matchesRoute(normalizedPath, ADMIN_ROUTES);

  // Allow public routes (including API routes that are public)
  if (
    matchesRoute(normalizedPath, PUBLIC_ROUTES) ||
    normalizedPath.startsWith("/api/auth")
  ) {
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-locale", locale);
    const response = NextResponse.next({ request: { headers: requestHeaders } });
    response.cookies.set(localeCookieName, locale, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
    });
    return addSecurityHeaders(response);
  }

  // If route doesn't require auth or admin, just add locale headers and continue
  if (!requiresAuth && !requiresAdmin) {
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-locale", locale);

    const response = NextResponse.next({ request: { headers: requestHeaders } });
    response.cookies.set(localeCookieName, locale, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
    });
    return addSecurityHeaders(response);
  }

  // Special handling for sync routes with x-admin-token
  if (normalizedPath.startsWith("/api/sync/")) {
    const adminToken = request.headers.get("x-admin-token");
    if (adminToken === process.env.ADMIN_TOKEN) {
      const requestHeaders = new Headers(request.headers);
      requestHeaders.set("x-locale", locale);

      const response = NextResponse.next({
        request: { headers: requestHeaders },
      });
      response.cookies.set(localeCookieName, locale, {
        path: "/",
        maxAge: 60 * 60 * 24 * 365,
        sameSite: "lax",
      });
      return addSecurityHeaders(response);
    }
    // If no valid admin token, fall through to regular auth check
  }

  // Get session token for authentication
  try {
    const token = await getToken({
      req: request,
      secret: NEXTAUTH_SECRET,
    });

    // No token = not authenticated
    if (!token || !token.sub) {
      return unauthorizedResponse(request, "Authentication required", locale);
    }

    // Check if user account is suspended
    if (token.status === "suspended") {
      return unauthorizedResponse(request, "Account suspended", locale);
    }

    if (token.status === "deleted") {
      return unauthorizedResponse(request, "Account not found", locale);
    }

    // Check admin access — allow barista, manager, and admin roles
    const INVENTORY_ROLES = ["barista", "manager", "admin"];
    if (requiresAdmin && (!token.role || !INVENTORY_ROLES.includes(token.role as string))) {
      return forbiddenResponse(request, "Staff access required", locale);
    }

    // Authentication successful, proceed with locale headers
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-locale", locale);

    const response = NextResponse.next({ request: { headers: requestHeaders } });

    // Add user context headers for downstream use (no PII)
    response.headers.set("x-user-id", token.sub);
    if (token.role) {
      response.headers.set("x-user-role", token.role as string);
    }

    // Set locale cookie
    response.cookies.set(localeCookieName, locale, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
    });

    return addSecurityHeaders(response);
  } catch (error) {
    console.error("Middleware auth error:", error);
    return unauthorizedResponse(request, "Authentication failed", locale);
  }
}

/**
 * Main Middleware Wrapper for Request/Response Logging Telemetry
 */
export async function middleware(request: NextRequest) {
  const startTime = Date.now();
  const { pathname } = request.nextUrl;

  // Skip logging for pure assets immediately
  const isAsset =
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    PUBLIC_FILE.test(pathname);

  try {
    const response = await runMiddleware(request);

    if (!isAsset) {
      const duration = Date.now() - startTime;
      const status = response.status;
      // Identify specific user context if available
      const userId = response.headers.get("x-user-id") || "guest";

      console.log(
        `[TELEMETRY] ${request.method} ${pathname} | Status: ${status} | User: ${userId} | [${duration}ms]`,
      );
    }

    return response;
  } catch (err) {
    if (!isAsset) {
      const duration = Date.now() - startTime;
      console.error(
        `[TELEMETRY] ${request.method} ${pathname} | ERROR | [${duration}ms]`,
      );
    }
    throw err;
  }
}

// Configure which routes this middleware runs on
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)",
  ],
};
