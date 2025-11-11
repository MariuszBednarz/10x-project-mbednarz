/**
 * API Client with automatic JWT token injection
 * Reads session from Supabase client and adds Authorization header
 */

import { supabaseClient } from "@/db/supabase.client";

/**
 * Enhanced fetch that automatically includes JWT token from Supabase session
 */
export async function authenticatedFetch(url: string, options: RequestInit = {}): Promise<Response> {
  // Get current session from Supabase
  const {
    data: { session },
  } = await supabaseClient.auth.getSession();

  console.warn("[authenticatedFetch] Request details:", {
    url,
    method: options.method || "GET",
    hasSession: !!session,
    hasAccessToken: !!session?.access_token,
    tokenLength: session?.access_token?.length || 0,
  });

  // Merge headers with Authorization if session exists
  const headers = new Headers(options.headers);

  if (session?.access_token) {
    headers.set("Authorization", `Bearer ${session.access_token}`);
    console.warn("[authenticatedFetch] Authorization header set");
  } else {
    console.warn("[authenticatedFetch] WARNING: No access token available!");
  }

  // Include credentials for cookie-based auth (fallback)
  const enhancedOptions: RequestInit = {
    ...options,
    headers,
    credentials: options.credentials || "include",
  };

  const response = await fetch(url, enhancedOptions);

  // Handle invalid authentication token edge case
  // When user deletes account in one tab, other tabs have invalid token
  if (response.status === 401) {
    const contentType = response.headers.get("content-type");
    if (contentType?.includes("application/json")) {
      const clonedResponse = response.clone();
      try {
        const errorData = await clonedResponse.json();
        if (errorData.message === "Missing or invalid authentication token") {
          console.warn("[authenticatedFetch] Detected invalid token (401), attempting to clear session...");

          // Clear invalid session from localStorage
          await supabaseClient.auth.signOut();

          console.warn("[authenticatedFetch] Called supabaseClient.auth.signOut()");

          // Force clear localStorage - signOut() sometimes doesn't work properly
          // Remove all Supabase auth keys (sb-*-auth-token)
          if (typeof window !== "undefined") {
            const keysBeforeClear = Object.keys(localStorage).filter(
              (key) => key.startsWith("sb-") && key.includes("-auth-token")
            );

            console.warn("[authenticatedFetch] Found Supabase auth keys in localStorage:", {
              keys: keysBeforeClear,
              count: keysBeforeClear.length,
            });

            keysBeforeClear.forEach((key) => {
              localStorage.removeItem(key);
              console.warn(`[authenticatedFetch] Removed localStorage key: ${key}`);
            });

            const keysAfterClear = Object.keys(localStorage).filter(
              (key) => key.startsWith("sb-") && key.includes("-auth-token")
            );

            console.warn("[authenticatedFetch] Remaining keys after cleanup:", {
              keys: keysAfterClear,
              count: keysAfterClear.length,
              cleanupSuccess: keysAfterClear.length === 0,
            });
          }
        }
      } catch (error) {
        // If JSON parsing fails, ignore - not our target error
        console.warn("[authenticatedFetch] Failed to parse 401 response JSON:", error);
      }
    }
  }

  return response;
}

/**
 * Convenience methods for common HTTP verbs
 */
export const apiClient = {
  async get(url: string, options: RequestInit = {}) {
    return authenticatedFetch(url, { ...options, method: "GET" });
  },

  async post(url: string, body?: unknown, options: RequestInit = {}) {
    return authenticatedFetch(url, {
      ...options,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  },

  async put(url: string, body?: unknown, options: RequestInit = {}) {
    return authenticatedFetch(url, {
      ...options,
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  },

  async delete(url: string, options: RequestInit = {}) {
    return authenticatedFetch(url, { ...options, method: "DELETE" });
  },

  async patch(url: string, body?: unknown, options: RequestInit = {}) {
    return authenticatedFetch(url, {
      ...options,
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  },
};
