/**
 * POST /api/auth/logout
 *
 * Sign out the current user and clear session
 *
 * This endpoint performs server-side logout by:
 * 1. Validating the current session
 * 2. Calling Supabase signOut to invalidate the token
 * 3. Returning success response (client should clear localStorage)
 *
 * @see .ai/api-implementation-plan.md Section 4.10 (Logout)
 */

import type { APIRoute } from "astro";
import { createErrorResponse, createSuccessResponse } from "@/lib/utils/api-response";

export const prerender = false;

/**
 * POST /api/auth/logout
 *
 * Sign out the current user
 *
 * No request body required
 *
 * Response: 200 OK
 * {
 *   message: "Logged out successfully"
 * }
 *
 * Errors:
 * - 500 INTERNAL_SERVER_ERROR: Failed to logout
 */
export const POST: APIRoute = async ({ locals }) => {
  try {
    // Sign out using Supabase client from middleware
    // This will invalidate the JWT token on Supabase side
    const { error } = await locals.supabase.auth.signOut();

    if (error) {
      throw error;
    }

    // Return success - client should clear localStorage
    return createSuccessResponse(200, {
      message: "Logged out successfully",
    });
  } catch {
    return createErrorResponse(500, "INTERNAL_SERVER_ERROR", "Failed to logout");
  }
};
