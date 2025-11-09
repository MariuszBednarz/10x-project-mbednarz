/**
 * Session Monitor Hook
 *
 * Monitors Supabase session state and automatically redirects to login
 * when the session expires or becomes invalid.
 *
 * Features:
 * - Listens to auth state changes (SIGNED_OUT, TOKEN_REFRESHED, etc.)
 * - Detects token expiration via Supabase events
 * - Automatic redirect on session loss (protected routes only)
 * - No periodic checks to avoid false positives for unauthenticated users
 * - Cleanup on unmount
 */

import { useEffect } from "react";
import { supabaseClient } from "@/db/supabase.client";

interface UseSessionMonitorOptions {
  /**
   * Whether to enable session monitoring
   * @default true
   */
  enabled?: boolean;

  /**
   * Callback when session expires
   */
  onSessionExpired?: () => void;
}

/**
 * Hook to monitor user session and handle expiration
 *
 * @example
 * useSessionMonitor(); // Basic usage
 *
 * @example
 * useSessionMonitor({
 *   onSessionExpired: () => {
 *     toast.error("Sesja wygasła. Zaloguj się ponownie.");
 *   }
 * });
 */
export function useSessionMonitor(options: UseSessionMonitorOptions = {}) {
  const { enabled = true, onSessionExpired } = options;

  useEffect(() => {
    if (!enabled) return;

    // Listen to auth state changes
    const {
      data: { subscription },
    } = supabaseClient.auth.onAuthStateChange((event, session) => {
      // Handle signed out event
      if (event === "SIGNED_OUT") {
        console.log("[Session Monitor] User signed out");
        onSessionExpired?.();

        // Redirect to login if not already there
        if (window.location.pathname !== "/login") {
          window.location.href = "/login";
        }
      }

      // Handle token expired event
      if (event === "TOKEN_REFRESHED") {
        console.log("[Session Monitor] Token refreshed successfully");
      }

      // Check if session is null but user is on protected route
      if (!session && event === "INITIAL_SESSION") {
        const protectedRoutes = ["/settings", "/wards"];
        const isProtectedRoute = protectedRoutes.some(
          (route) => window.location.pathname === route || window.location.pathname.startsWith(`${route}/`)
        );

        if (isProtectedRoute) {
          console.log("[Session Monitor] No session on protected route, redirecting to login");
          window.location.href = "/login";
        }
      }
    });

    // Cleanup on unmount
    return () => {
      subscription.unsubscribe();
    };
  }, [enabled, onSessionExpired]);
}
