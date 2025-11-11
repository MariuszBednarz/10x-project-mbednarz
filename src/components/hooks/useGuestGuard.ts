/**
 * Guest Guard Hook
 *
 * Client-side guard for guest-only pages (login, register).
 * Redirects to protected area if user is already authenticated.
 */

import { useEffect, useState } from "react";
import { supabaseClient } from "@/db/supabase.client";

interface UseGuestGuardOptions {
  /**
   * Redirect URL if already authenticated
   * @default "/wards"
   */
  redirectTo?: string;
}

/**
 * Hook to protect pages that should only be accessible to guests (not logged in)
 *
 * @example
 * function LoginPage() {
 *   const { loading } = useGuestGuard();
 *
 *   if (loading) return <div>Loading...</div>;
 *
 *   return <LoginForm />;
 * }
 */
export function useGuestGuard(options: UseGuestGuardOptions = {}) {
  const { redirectTo = "/wards" } = options;
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const checkAuth = async () => {
      try {
        const {
          data: { session },
        } = await supabaseClient.auth.getSession();

        if (!mounted) return;

        // User is authenticated and email is verified - redirect
        if (session?.user?.email_confirmed_at) {
          window.location.href = redirectTo;
          return;
        }

        // User is not authenticated - allow access
        setLoading(false);
      } catch {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    checkAuth();

    return () => {
      mounted = false;
    };
  }, [redirectTo]);

  return { loading };
}
