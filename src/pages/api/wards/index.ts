/**
 * GET /api/wards
 *
 * Get aggregated list of wards with statistics
 *
 * @see .ai/api-implementation-plan.md Section 4.1
 * @see .ai/api-plan.md Section 4.1
 */

import type { APIRoute } from "astro";
import { WardsService } from "@/lib/services/wards.service";
import { validateWardsQuery } from "@/lib/validation/wards.schema";
import { createErrorResponse, createSuccessResponse } from "@/lib/utils/api-response";
import { getAuthenticatedUser } from "@/lib/utils/auth";
import { isValidationError, isEmailNotVerifiedError, getErrorMessage } from "@/lib/utils/error-handler";

export const prerender = false;

/**
 * GET /api/wards
 *
 * Query Parameters:
 * - search (optional): string (1-100 chars) - Search ward names
 * - favorites_only (optional): boolean - Filter to user's favorites only
 * - limit (optional): number (1-100, default 50) - Results per page
 * - offset (optional): number (≥0, default 0) - Pagination offset
 *
 * Response: 200 OK
 * {
 *   data: WardAggregatedDTO[],
 *   meta: {
 *     total: number,
 *     limit: number,
 *     offset: number,
 *     lastScrapeTime: string,
 *     isStale: boolean
 *   }
 * }
 *
 * Errors:
 * - 400 BAD_REQUEST: Invalid query parameters
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
      search: url.searchParams.get("search") || undefined,
      favorites_only: url.searchParams.get("favorites_only") === "true",
      limit: parseInt(url.searchParams.get("limit") || "50"),
      offset: parseInt(url.searchParams.get("offset") || "0"),
    };

    const validatedParams = validateWardsQuery(queryParams);

    // 3. Call service
    const wardsService = new WardsService(locals.supabase);
    const result = await wardsService.getWards(validatedParams, user.id);

    // 4. Return response
    return createSuccessResponse(200, result);
  } catch (error: any) {
    // Handle validation errors
    if (isValidationError(error)) {
      return createErrorResponse(400, "BAD_REQUEST", error.message);
    }

    // Handle email not verified error
    if (isEmailNotVerifiedError(error)) {
      return createErrorResponse(403, "FORBIDDEN", error.message, undefined, "Please verify your email address");
    }

    // Log and handle unexpected errors
    console.error("[GET /api/wards] Error:", {
      message: getErrorMessage(error),
      stack: error?.stack,
    });

    return createErrorResponse(500, "INTERNAL_SERVER_ERROR", "Failed to fetch wards");
  }
};
