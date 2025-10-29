/**
 * DELETE /api/users/me/favorites/{id}
 *
 * Remove ward from user's favorites
 *
 * @see .ai/api-implementation-plan.md Section 4.6
 * @see .ai/api-plan.md Section 4.2
 */

import type { APIRoute } from "astro";
import { FavoritesService } from "@/lib/services/favorites.service";
import { createErrorResponse } from "@/lib/utils/api-response";
import { getAuthenticatedUser, isValidUUID } from "@/lib/utils/auth";
import { isEmailNotVerifiedError, getErrorMessage } from "@/lib/utils/error-handler";

export const prerender = false;

/**
 * DELETE /api/users/me/favorites/{id}
 *
 * Remove favorite by ID
 *
 * Path Parameters:
 * - id (required): string (UUID) - Favorite ID to delete
 *
 * Response: 204 No Content (empty body)
 *
 * Errors:
 * - 400 BAD_REQUEST: Invalid favorite ID format
 * - 401 UNAUTHORIZED: Missing or invalid authentication token
 * - 403 FORBIDDEN: Email not verified
 * - 404 NOT_FOUND: Favorite not found or does not belong to user
 * - 500 INTERNAL_SERVER_ERROR: Unexpected server error
 */
export const DELETE: APIRoute = async ({ params, locals }) => {
  try {
    // 1. Authenticate user
    const user = await getAuthenticatedUser(locals.supabase);
    if (!user) {
      return createErrorResponse(401, "UNAUTHORIZED", "Missing or invalid authentication token");
    }

    // 2. Validate favorite ID parameter
    const favoriteId = params.id;

    if (!favoriteId) {
      return createErrorResponse(400, "BAD_REQUEST", "Favorite ID is required");
    }

    // Validate UUID format
    // ⚠️ CRITICAL: Always validate UUID format before database query
    if (!isValidUUID(favoriteId)) {
      return createErrorResponse(
        400,
        "BAD_REQUEST",
        "Invalid favorite ID format",
        undefined,
        "ID must be a valid UUID"
      );
    }

    // 3. Call service
    const favoritesService = new FavoritesService(locals.supabase);

    // Check if favorite exists and belongs to user (404 handling)
    const exists = await favoritesService.favoriteExists(user.id, favoriteId);
    if (!exists) {
      return createErrorResponse(404, "NOT_FOUND", "Favorite not found or does not belong to you");
    }

    // Remove the favorite
    await favoritesService.removeFavorite(user.id, favoriteId);

    // 4. Return 204 No Content (empty body)
    return new Response(null, { status: 204 });
  } catch (error: any) {
    // Handle email not verified error
    if (isEmailNotVerifiedError(error)) {
      return createErrorResponse(403, "FORBIDDEN", error.message, undefined, "Please verify your email address");
    }

    // Log and handle unexpected errors
    console.error(`[DELETE /api/users/me/favorites/${params.id}] Error:`, {
      favoriteId: params.id,
      message: getErrorMessage(error),
      stack: error?.stack,
    });

    return createErrorResponse(500, "INTERNAL_SERVER_ERROR", "Failed to remove favorite");
  }
};
