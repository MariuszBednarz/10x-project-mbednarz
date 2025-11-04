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

  return fetch(url, enhancedOptions);
}

/**
 * Convenience methods for common HTTP verbs
 */
export const apiClient = {
  async get(url: string, options: RequestInit = {}) {
    return authenticatedFetch(url, { ...options, method: "GET" });
  },

  async post(url: string, body?: any, options: RequestInit = {}) {
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

  async put(url: string, body?: any, options: RequestInit = {}) {
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

  async patch(url: string, body?: any, options: RequestInit = {}) {
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
