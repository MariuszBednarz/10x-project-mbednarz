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

  // Merge headers with Authorization if session exists
  const headers = new Headers(options.headers);

  if (session?.access_token) {
    headers.set("Authorization", `Bearer ${session.access_token}`);
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
          // Clear invalid session from localStorage
          await supabaseClient.auth.signOut();

          // Force clear localStorage - signOut() sometimes doesn't work properly
          // Remove all Supabase auth keys (sb-*-auth-token)
          if (typeof window !== "undefined") {
            Object.keys(localStorage).forEach((key) => {
              if (key.startsWith("sb-") && key.includes("-auth-token")) {
                localStorage.removeItem(key);
              }
            });
          }
        }
      } catch {
        // If JSON parsing fails, ignore - not our target error
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
