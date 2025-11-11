import { useEffect, useState } from "react";
import { supabaseClient } from "@/db/supabase.client";

interface UseGuestGuardOptions {
  redirectTo?: string;
}

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

        if (session?.user?.email_confirmed_at) {
          window.location.href = redirectTo;
          return;
        }

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
