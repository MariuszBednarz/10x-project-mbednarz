import { createClient } from "@supabase/supabase-js";

import type { Database } from "../types/database.types";

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

export const supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Enable session persistence in localStorage (browser only)
    persistSession: true,
    // Auto-refresh token before expiry
    autoRefreshToken: true,
    // Detect session from URL (e.g., email verification links)
    detectSessionInUrl: true,
    // Use localStorage for session storage (default, but explicit)
    storage: typeof window !== "undefined" ? window.localStorage : undefined,
  },
});

// Export SupabaseClient type for use in services
export type SupabaseClient = typeof supabaseClient;
