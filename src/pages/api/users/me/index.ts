/**
 * GET /api/users/me - Get authenticated user profile
 * DELETE /api/users/me - Delete authenticated user's account (GDPR compliance)
 *
 * @see .ai/api-implementation-plan.md Sections 4.3 (GET), 4.9 (DELETE)
 * @see .ai/api-plan.md Sections 4.5 (GET), 4.6 (DELETE)
 */

import type { APIRoute } from "astro";
import { createClient } from "@supabase/supabase-js";
import { createErrorResponse, createSuccessResponse } from "@/lib/utils/api-response";
import { getAuthenticatedUser } from "@/lib/utils/auth";
import { isEmailNotVerifiedError, getErrorMessage } from "@/lib/utils/error-handler";

export const prerender = false;

/**
 * GET /api/users/me
 *
 * Get authenticated user profile
 *
 * No query parameters required
 *
 * Response: 200 OK
 * {
 *   id: string (UUID),
 *   email: string,
 *   email_confirmed_at: string | null,
 *   created_at: string
 * }
 *
 * Errors:
 * - 401 UNAUTHORIZED: Missing or invalid authentication token
 * - 403 FORBIDDEN: Email not verified
 * - 500 INTERNAL_SERVER_ERROR: Unexpected server error
 */
export const GET: APIRoute = async ({ locals }) => {
  try {
    // 1. Authenticate user
    const user = await getAuthenticatedUser(locals.supabase);
    if (!user) {
      return createErrorResponse(401, "UNAUTHORIZED", "Missing or invalid authentication token");
    }

    // 2. Return user profile
    return createSuccessResponse(200, {
      id: user.id,
      email: user.email,
      email_confirmed_at: user.email_confirmed_at || null,
      created_at: user.created_at,
    });
  } catch (error: any) {
    // Handle email not verified error
    if (isEmailNotVerifiedError(error)) {
      return createErrorResponse(403, "FORBIDDEN", error.message, undefined, "Please verify your email address");
    }

    // Log and handle unexpected errors
    console.error("[GET /api/users/me] Error:", {
      message: getErrorMessage(error),
      stack: error?.stack,
    });

    return createErrorResponse(500, "INTERNAL_SERVER_ERROR", "Failed to fetch user profile");
  }
};

/**
 * DELETE /api/users/me
 *
 * Delete authenticated user account and all associated data
 *
 * ⚠️ CRITICAL: This action is irreversible
 * - Deletes user from auth.users
 * - CASCADE deletes all user_favorites (via foreign key)
 * - Requires SUPABASE_SERVICE_ROLE_KEY environment variable
 *
 * No request body required
 *
 * Response: 204 No Content (empty body)
 *
 * Errors:
 * - 401 UNAUTHORIZED: Missing or invalid authentication token
 * - 403 FORBIDDEN: Email not verified
 * - 500 INTERNAL_SERVER_ERROR: Failed to delete account
 */
export const DELETE: APIRoute = async ({ locals }) => {
  try {
    // 1. Authenticate user
    const user = await getAuthenticatedUser(locals.supabase);
    if (!user) {
      return createErrorResponse(401, "UNAUTHORIZED", "Missing or invalid authentication token");
    }

    // 2. Check for service role key
    const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
    const serviceRoleKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      console.error("[DELETE /api/users/me] Missing Supabase configuration");
      return createErrorResponse(500, "INTERNAL_SERVER_ERROR", "Server configuration error");
    }

    // 3. Create admin client with service role key
    // ⚠️ CRITICAL: Only use service role key on backend
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // 4. Delete user from auth.users
    // CASCADE DELETE automatic via foreign key constraints
    // This will delete:
    // - User account from auth.users
    // - All user_favorites (CASCADE via user_id foreign key)
    const { error } = await supabaseAdmin.auth.admin.deleteUser(user.id);

    if (error) {
      console.error("[DELETE /api/users/me] Supabase Admin API error:", {
        userId: user.id,
        error: error.message,
      });
      throw error;
    }

    console.log(`[DELETE /api/users/me] Successfully deleted user: ${user.id}`);

    // 5. Return 204 No Content
    return new Response(null, { status: 204 });
  } catch (error: any) {
    // Handle email not verified error
    if (isEmailNotVerifiedError(error)) {
      return createErrorResponse(403, "FORBIDDEN", error.message, undefined, "Please verify your email address");
    }

    // Log and handle unexpected errors
    console.error("[DELETE /api/users/me] Error:", {
      message: getErrorMessage(error),
      stack: error?.stack,
    });

    return createErrorResponse(500, "INTERNAL_SERVER_ERROR", "Failed to delete user account");
  }
};
