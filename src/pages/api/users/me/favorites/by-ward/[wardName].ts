/**
 * DELETE /api/users/me/favorites/by-ward/{wardName}
 *
 * Remove ward from user's favorites by ward name
 *
 * @see .ai/ui-plan.md Section 12.3 - Clean solution without migration
 */

import type { APIRoute } from "astro";
import { FavoritesService } from "@/lib/services/favorites.service";
import { createErrorResponse } from "@/lib/utils/api-response";
import { getAuthenticatedUser } from "@/lib/utils/auth";
import { isEmailNotVerifiedError, getErrorMessage } from "@/lib/utils/error-handler";

export const prerender = false;

/**
 * DELETE /api/users/me/favorites/by-ward/{wardName}
 *
 * Remove favorite by ward name (natural identifier from UI)
 *
 * Path Parameters:
 * - wardName (required): string - Ward name to remove from favorites (URL-encoded)
 *
 * Response: 204 No Content (empty body)
 *
 * Errors:
 * - 400 BAD_REQUEST: Missing ward name
 * - 401 UNAUTHORIZED: Missing or invalid authentication token
 * - 403 FORBIDDEN: Email not verified
 * - 404 NOT_FOUND: Favorite not found
 * - 500 INTERNAL_SERVER_ERROR: Unexpected server error
 */
export const DELETE: APIRoute = async ({ params, locals }) => {
  try {
    // 1. Authenticate user
    const user = await getAuthenticatedUser(locals.supabase);
    if (!user) {
      return createErrorResponse(401, "UNAUTHORIZED", "Missing or invalid authentication token");
    }

    // 2. Validate ward name parameter
    const wardName = params.wardName;

    if (!wardName) {
      return createErrorResponse(400, "BAD_REQUEST", "Ward name is required");
    }

    // Decode URL-encoded ward name (e.g., "Chirurgia%20Og%C3%B3lna" → "Chirurgia Ogólna")
    const decodedWardName = decodeURIComponent(wardName);

    // 3. Call service
    const favoritesService = new FavoritesService(locals.supabase);

    // Remove the favorite by ward name
    const deleted = await favoritesService.removeFavoriteByWardName(user.id, decodedWardName);

    if (!deleted) {
      return createErrorResponse(404, "NOT_FOUND", "Favorite not found");
    }

    // 4. Return 204 No Content (empty body)
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
    console.error(`[DELETE /api/users/me/favorites/by-ward/${params.wardName}] Error:`, {
      wardName: params.wardName,
      message: getErrorMessage(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    return createErrorResponse(500, "INTERNAL_SERVER_ERROR", "Failed to remove favorite");
  }
};
