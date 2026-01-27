"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import { useCallback, useEffect } from "react";
import { useLocalizedRouter } from "@/hooks/useLocalizedRouter";

/**
 * Hook to get current user session
 *
 * @example
 * ```tsx
 * const { user, isAuthenticated, isLoading } = useAuth();
 *
 * if (isLoading) return <Spinner />;
 * if (!isAuthenticated) return <SignInPrompt />;
 *
 * return <div>Welcome, {user.name}!</div>;
 * ```
 */
export function useAuth() {
  const { data: session, status } = useSession();

  return {
    user: session?.user
      ? {
          id: session.user.id,
          email: session.user.email || undefined,
          name: session.user.name || undefined,
          role: session.user.role || "user",
          status: session.user.status || "active",
        }
      : null,
    session,
    isAuthenticated: status === "authenticated",
    isLoading: status === "loading",
    isUnauthenticated: status === "unauthenticated",
  };
}

/**
 * Hook for authentication actions
 *
 * @example
 * ```tsx
 * const { login, logout, isLoading } = useAuthActions();
 *
 * const handleLogin = async () => {
 *   await login({ email: "user@example.com" });
 * };
 * ```
 */
export function useAuthActions() {
  const { status } = useSession();

  const login = useCallback(
    async (options?: { email?: string; callbackUrl?: string }) => {
      const { email, callbackUrl = "/" } = options || {};

      if (email) {
        await signIn("email", {
          email,
          callbackUrl,
        });
      } else {
        await signIn(undefined, { callbackUrl });
      }
    },
    [],
  );

  const logout = useCallback(async (callbackUrl = "/") => {
    await signOut({ callbackUrl });
  }, []);

  const requireAuth = useCallback(() => {
    if (status === "unauthenticated") {
      // Use pathname hook for consistency (includes locale)
      const pathname = typeof window !== "undefined" ? window.location.pathname : "/";
      signIn(undefined, { callbackUrl: pathname });
      return false;
    }
    return status === "authenticated";
  }, [status]);

  return {
    login,
    logout,
    requireAuth,
    isLoading: status === "loading",
  };
}

/**
 * Hook to require authentication
 * Redirects to sign-in if not authenticated
 *
 * @example
 * ```tsx
 * function ProtectedPage() {
 *   const { user, isLoading } = useRequireAuth();
 *
 *   if (isLoading) return <Spinner />;
 *
 *   return <div>Protected content for {user.name}</div>;
 * }
 * ```
 */
export function useRequireAuth() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const localizedRouter = useLocalizedRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      const search = typeof window !== "undefined" ? window.location.search : "";
      const currentUrl = pathname + search;
      localizedRouter.push(`/auth/signin?callbackUrl=${encodeURIComponent(currentUrl)}`);
    }
  }, [isLoading, isAuthenticated, localizedRouter, pathname]);

  return {
    user,
    isLoading,
    isAuthenticated,
  };
}

/**
 * Hook to check if user has specific role
 *
 * @example
 * ```tsx
 * const { hasRole, isLoading } = useRole();
 *
 * if (isLoading) return <Spinner />;
 * if (!hasRole("admin")) return <AccessDenied />;
 *
 * return <AdminPanel />;
 * ```
 */
export function useRole() {
  const { user, isAuthenticated, isLoading } = useAuth();

  const hasRole = useCallback(
    (role: string | string[]) => {
      if (!isAuthenticated || !user?.role) return false;

      const roles = Array.isArray(role) ? role : [role];
      return roles.includes(user.role) || user.role === "admin";
    },
    [isAuthenticated, user],
  );

  return {
    role: user?.role || null,
    hasRole,
    isAdmin: user?.role === "admin",
    isLoading,
  };
}
