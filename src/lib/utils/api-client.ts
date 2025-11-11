import { supabaseClient } from "@/db/supabase.client";

export async function authenticatedFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const {
    data: { session },
  } = await supabaseClient.auth.getSession();

  const headers = new Headers(options.headers);

  if (session?.access_token) {
    headers.set("Authorization", `Bearer ${session.access_token}`);
  } else {
    console.warn("[authenticatedFetch] No access token available");
  }

  const enhancedOptions: RequestInit = {
    ...options,
    headers,
    credentials: options.credentials || "include",
  };

  const response = await fetch(url, enhancedOptions);

  if (response.status === 401 && session?.access_token) {
    const contentType = response.headers.get("content-type");
    if (contentType?.includes("application/json")) {
      const clonedResponse = response.clone();
      try {
        const errorData = await clonedResponse.json();
        if (errorData.message === "Missing or invalid authentication token") {
          await supabaseClient.auth.signOut();

          if (typeof window !== "undefined") {
            const keysBeforeClear = Object.keys(localStorage).filter(
              (key) => key.startsWith("sb-") && key.includes("-auth-token")
            );

            keysBeforeClear.forEach((key) => {
              localStorage.removeItem(key);
            });
          }
        }
      } catch (error) {
        console.warn("[authenticatedFetch] Failed to parse 401 response:", error);
      }
    }
  }

  return response;
}

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
