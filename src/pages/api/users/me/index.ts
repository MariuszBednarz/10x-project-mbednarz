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
  } catch (error: unknown) {
    // Handle email not verified error
    if (isEmailNotVerifiedError(error)) {
      return createErrorResponse(
        403,
        "FORBIDDEN",
        getErrorMessage(error),
        undefined,
        "Please verify your email address"
      );
    }

    // Log and handle unexpected errors
    console.error("[GET /api/users/me] Error:", {
      message: getErrorMessage(error),
      stack: error instanceof Error ? error.stack : undefined,
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
      console.warn("[DELETE /api/users/me] Authentication failed - no user found");
      return createErrorResponse(401, "UNAUTHORIZED", "Missing or invalid authentication token");
    }

    console.warn("[DELETE /api/users/me] Starting account deletion for user:", {
      userId: user.id,
      email: user.email,
    });

    // 2. Check for service role key
    const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
    // Cloudflare Pages: secret env vars are in runtime.env, not import.meta.env
    const serviceRoleKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

    console.warn("[DELETE /api/users/me] Environment variables check:", {
      supabaseUrl: supabaseUrl ? "✓ Present" : "✗ Missing",
      serviceRoleKey: serviceRoleKey ? "✓ Present" : "✗ Missing",
      serviceRoleKeyLength: serviceRoleKey?.length || 0,
    });

    if (!supabaseUrl || !serviceRoleKey) {
      console.warn("[DELETE /api/users/me] CRITICAL: Missing environment variables - cannot delete user");
      // TEMPORARY DEBUG: Return detailed env info
      return createErrorResponse(
        500,
        "INTERNAL_SERVER_ERROR",
        `DEBUG ENV: supabaseUrl=${supabaseUrl ? "OK" : "MISSING"}, serviceRoleKey=${serviceRoleKey ? `OK-length:${serviceRoleKey.length}` : "MISSING"}, allEnvKeys=${Object.keys(import.meta.env).join(",")}`
      );
    }

    // 3. Create admin client with service role key
    // ⚠️ CRITICAL: Only use service role key on backend
    console.warn("[DELETE /api/users/me] Creating admin client with:", {
      urlLength: supabaseUrl.length,
      keyLength: serviceRoleKey.length,
      keyPrefix: serviceRoleKey.substring(0, 20) + "...",
    });

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    console.warn("[DELETE /api/users/me] Admin client created successfully");

    // 4. Delete user from auth.users
    // CASCADE DELETE automatic via foreign key constraints
    // This will delete:
    // - User account from auth.users
    // - All user_favorites (CASCADE via user_id foreign key)
    console.warn("[DELETE /api/users/me] Attempting to delete user via admin client...");
    const { error } = await supabaseAdmin.auth.admin.deleteUser(user.id);

    if (error) {
      console.error("[DELETE /api/users/me] Failed to delete user:", {
        userId: user.id,
        error: error.message,
        errorDetails: error,
      });
      // TEMPORARY DEBUG: Return detailed error info
      return createErrorResponse(
        500,
        "INTERNAL_SERVER_ERROR",
        `DEBUG DELETE ERROR: ${error.message} | code: ${error.code || "N/A"} | status: ${error.status || "N/A"}`
      );
    }

    console.warn("[DELETE /api/users/me] User deleted successfully:", {
      userId: user.id,
    });

    // 5. Return 204 No Content
    return new Response(null, { status: 204 });
  } catch (error: unknown) {
    // Handle email not verified error
    if (isEmailNotVerifiedError(error)) {
      return createErrorResponse(
        403,
        "FORBIDDEN",
        getErrorMessage(error),
        undefined,
        "Please verify your email address"
      );
    }

    // Log and handle unexpected errors
    console.error("[DELETE /api/users/me] Error:", {
      message: getErrorMessage(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    return createErrorResponse(500, "INTERNAL_SERVER_ERROR", "Failed to delete user account");
  }
};
