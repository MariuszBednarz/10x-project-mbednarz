/**
 * GET/POST /api/users/me/favorites
 *
 * Manage user favorites
 *
 * @see .ai/api-implementation-plan.md Sections 4.4 (GET), 4.5 (POST)
 * @see .ai/api-plan.md Section 4.2
 */

import type { APIRoute } from "astro";
import { FavoritesService } from "@/lib/services/favorites.service";
import { validateAddFavoriteCommand } from "@/lib/validation/favorites.schema";
import { createErrorResponse, createSuccessResponse } from "@/lib/utils/api-response";
import { getAuthenticatedUser } from "@/lib/utils/auth";
import {
  isValidationError,
  isEmailNotVerifiedError,
  isDuplicateKeyError,
  getErrorMessage,
} from "@/lib/utils/error-handler";

export const prerender = false;

/**
 * GET /api/users/me/favorites
 *
 * Get authenticated user's favorites with live statistics
 *
 * Query Parameters:
 * - limit (optional): number (1-100, default 50) - Results per page
 * - offset (optional): number (≥0, default 0) - Pagination offset
 *
 * Response: 200 OK
 * {
 *   data: FavoriteWithStatsDTO[],
 *   meta: {
 *     total: number,
 *     limit: number,
 *     offset: number
 *   }
 * }
 *
 * Errors:
 * - 401 UNAUTHORIZED: Missing or invalid authentication token
 * - 403 FORBIDDEN: Email not verified
 * - 500 INTERNAL_SERVER_ERROR: Unexpected server error
 */
export const GET: APIRoute = async ({ request, locals }) => {
  try {
    // 1. Authenticate user
    const user = await getAuthenticatedUser(locals.supabase);
    if (!user) {
      return createErrorResponse(401, "UNAUTHORIZED", "Missing or invalid authentication token");
    }

    // 2. Parse and validate query parameters
    const url = new URL(request.url);
    const queryParams = {
      limit: parseInt(url.searchParams.get("limit") || "50"),
      offset: parseInt(url.searchParams.get("offset") || "0"),
    };

    // 3. Call service
    const favoritesService = new FavoritesService(locals.supabase);
    const result = await favoritesService.getUserFavorites(user.id, queryParams);

    // 4. Return response
    return createSuccessResponse(200, result);
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
    console.error("[GET /api/users/me/favorites] Error:", {
      message: getErrorMessage(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    return createErrorResponse(500, "INTERNAL_SERVER_ERROR", "Failed to fetch favorites");
  }
};

/**
 * POST /api/users/me/favorites
 *
 * Add ward to user's favorites
 *
 * Request Body:
 * {
 *   ward_name: string (required, 1-255 chars)
 * }
 *
 * Response: 201 Created
 * {
 *   id: string,
 *   user_id: string,
 *   ward_name: string,
 *   created_at: string
 * }
 *
 * Errors:
 * - 400 BAD_REQUEST: Invalid request body
 * - 401 UNAUTHORIZED: Missing or invalid authentication token
 * - 403 FORBIDDEN: Email not verified
 * - 409 CONFLICT: Ward already in favorites
 * - 422 UNPROCESSABLE_ENTITY: Ward name too long
 * - 500 INTERNAL_SERVER_ERROR: Unexpected server error
 */
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // 1. Authenticate user
    const user = await getAuthenticatedUser(locals.supabase);
    if (!user) {
      return createErrorResponse(401, "UNAUTHORIZED", "Missing or invalid authentication token");
    }

    // 2. Parse and validate request body
    let body;
    try {
      body = await request.json();
    } catch {
      return createErrorResponse(400, "BAD_REQUEST", "Invalid JSON in request body");
    }

    const command = validateAddFavoriteCommand(body);

    // 3. Call service
    const favoritesService = new FavoritesService(locals.supabase);
    const favorite = await favoritesService.addFavorite(user.id, command);

    // 4. Return response
    return createSuccessResponse(201, favorite);
  } catch (error: unknown) {
    // Handle validation errors
    if (isValidationError(error)) {
      return createErrorResponse(400, "BAD_REQUEST", getErrorMessage(error));
    }

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

    // Handle duplicate key violation (PostgreSQL error code 23505)
    if (isDuplicateKeyError(error)) {
      return createErrorResponse(409, "CONFLICT", "This ward is already in your favorites");
    }

    // Handle ward name too long (service error)
    if ((error as { code?: string })?.code === "CONFLICT") {
      return createErrorResponse(409, "CONFLICT", getErrorMessage(error));
    }

    return createErrorResponse(500, "INTERNAL_SERVER_ERROR", "Failed to add favorite");
  }
};
