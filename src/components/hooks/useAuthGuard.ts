/**
 * Auth Guard Hook
 *
 * Client-side authentication guard for protected pages.
 * Redirects to login if user is not authenticated.
 *
 * This is necessary because Supabase stores session in localStorage,
 * which is not accessible in SSR middleware.
 */

import { useEffect, useState } from "react";
import { supabaseClient } from "@/db/supabase.client";
import type { User } from "@supabase/supabase-js";

interface UseAuthGuardOptions {
  /**
   * Redirect URL if not authenticated
   * @default "/login"
   */
  redirectTo?: string;

  /**
   * Whether to check email verification
   * @default true
   */
  requireEmailVerification?: boolean;

  /**
   * Redirect URL if email not verified
   * @default "/verify-email"
   */
  verifyEmailRedirectTo?: string;
}

interface AuthGuardState {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
}

/**
 * Hook to protect pages that require authentication
 *
 * @example
 * function ProtectedPage() {
 *   const { user, loading, isAuthenticated } = useAuthGuard();
 *
 *   if (loading) return <div>Loading...</div>;
 *
 *   return <div>Welcome {user?.email}</div>;
 * }
 */
export function useAuthGuard(options: UseAuthGuardOptions = {}): AuthGuardState {
  const { redirectTo = "/login", requireEmailVerification = true, verifyEmailRedirectTo = "/verify-email" } = options;

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const checkAuth = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabaseClient.auth.getSession();

        if (!mounted) return;

        // No session - redirect to login
        if (error || !session) {
          console.log("[Auth Guard] No session, redirecting to login");
          window.location.href = redirectTo;
          return;
        }

        // Check email verification
        if (requireEmailVerification && !session.user.email_confirmed_at) {
          console.log("[Auth Guard] Email not verified, redirecting");
          window.location.href = verifyEmailRedirectTo;
          return;
        }

        // User is authenticated
        setUser(session.user);
        setLoading(false);
      } catch (error) {
        console.error("[Auth Guard] Error checking auth:", error);
        if (mounted) {
          window.location.href = redirectTo;
        }
      }
    };

    checkAuth();

    return () => {
      mounted = false;
    };
  }, [redirectTo, requireEmailVerification, verifyEmailRedirectTo]);

  return {
    user,
    loading,
    isAuthenticated: user !== null,
  };
}
