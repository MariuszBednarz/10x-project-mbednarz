import { defineMiddleware } from "astro:middleware";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../types/database.types";

export const onRequest = defineMiddleware(async (context, next) => {
  // Get Supabase config from environment
  const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

  // Get JWT token from Authorization header (for API routes)
  const authHeader = context.request.headers.get("Authorization");
  const token = authHeader?.replace("Bearer ", "");

  // Create Supabase client with user's JWT token
  const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: token ? `Bearer ${token}` : "",
      },
    },
    auth: {
      // Don't persist session in middleware
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });

  // Attach to context
  context.locals.supabase = supabase;

  // Note: Protected routes are guarded client-side since SSR middleware
  // doesn't have access to localStorage where Supabase stores sessions.
  // See: src/components/hooks/useAuthGuard.ts for client-side protection

  return next();
});
