/**
 * Authentication Utilities
 *
 * Helper functions for JWT authentication and user verification
 *
 * @see .ai/api-implementation-plan.md Section 6.2
 */

import type { SupabaseClient } from "@/db/supabase.client";
import type { User } from "@supabase/supabase-js";

/**
 * Get authenticated user from Supabase client
 *
 * Validates JWT token and checks email verification status
 *
 * @param supabase - Supabase client with user context (from locals)
 * @returns User object if authenticated and verified, null otherwise
 * @throws Error with code EMAIL_NOT_VERIFIED if email not confirmed
 *
 * @example
 * const user = await getAuthenticatedUser(locals.supabase);
 * if (!user) {
 *   return createErrorResponse(401, "UNAUTHORIZED", "Missing or invalid authentication token");
 * }
 */
export async function getAuthenticatedUser(supabase: SupabaseClient): Promise<User | null> {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  // No user or error retrieving user
  if (error || !user) {
    return null;
  }

  // Check email verification
  if (!user.email_confirmed_at) {
    throw {
      code: "EMAIL_NOT_VERIFIED",
      message: "Email address not verified",
    };
  }

  return user;
}

/**
 * Validate UUID format
 *
 * @param id - String to validate as UUID
 * @returns true if valid UUID format, false otherwise
 *
 * @example
 * if (!isValidUUID(favoriteId)) {
 *   return createErrorResponse(400, "BAD_REQUEST", "Invalid favorite ID format");
 * }
 */
export function isValidUUID(id: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
}
