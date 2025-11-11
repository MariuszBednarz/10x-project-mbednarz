import { useEffect, useState } from "react";
import { supabaseClient } from "@/db/supabase.client";
import type { User } from "@supabase/supabase-js";

interface UseAuthGuardOptions {
  redirectTo?: string;
  requireEmailVerification?: boolean;
  verifyEmailRedirectTo?: string;
}

interface AuthGuardState {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
}

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

        if (error || !session) {
          window.location.href = redirectTo;
          return;
        }

        if (requireEmailVerification && !session.user.email_confirmed_at) {
          window.location.href = verifyEmailRedirectTo;
          return;
        }

        setUser(session.user);
        setLoading(false);
      } catch {
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
