/**
 * GET /api/wards/{wardName}/hospitals
 *
 * Get hospitals for a specific ward with filtering and sorting
 *
 * @see .ai/api-implementation-plan.md Section 4.2
 * @see .ai/api-plan.md Section 4.1
 */

import type { APIRoute } from "astro";
import { HospitalsService } from "@/lib/services/hospitals.service";
import { validateHospitalsQuery } from "@/lib/validation/hospitals.schema";
import { createErrorResponse, createSuccessResponse } from "@/lib/utils/api-response";
import { getAuthenticatedUser } from "@/lib/utils/auth";
import { isValidationError, isEmailNotVerifiedError, getErrorMessage } from "@/lib/utils/error-handler";

export const prerender = false;

/**
 * GET /api/wards/{wardName}/hospitals
 *
 * Path Parameters:
 * - wardName (required): string - Ward name (URL-encoded)
 *
 * Query Parameters:
 * - district (optional): string (max 100 chars) - Filter by district
 * - search (optional): string (1-100 chars) - Search hospital names
 * - order (optional): enum - Sort order ("availablePlaces.desc" | "hospitalName.asc")
 * - limit (optional): number (1-100, default 50) - Results per page
 * - offset (optional): number (≥0, default 0) - Pagination offset
 *
 * Response: 200 OK
 * {
 *   data: HospitalWardDTO[],
 *   meta: {
 *     total: number,
 *     limit: number,
 *     offset: number
 *   }
 * }
 *
 * Errors:
 * - 400 BAD_REQUEST: Invalid query parameters or ward name
 * - 401 UNAUTHORIZED: Missing or invalid authentication token
 * - 403 FORBIDDEN: Email not verified
 * - 404 NOT_FOUND: Ward does not exist
 * - 500 INTERNAL_SERVER_ERROR: Unexpected server error
 */
export const GET: APIRoute = async ({ params, request, locals }) => {
  try {
    // 1. Authenticate user
    const user = await getAuthenticatedUser(locals.supabase);
    if (!user) {
      return createErrorResponse(401, "UNAUTHORIZED", "Missing or invalid authentication token");
    }

    // 2. Decode and validate ward name
    // ⚠️ CRITICAL: Use decodeURIComponent for URL-encoded names
    // Example: "Kardiologia%20Dzieci%C4%99ca" → "Kardiologia Dziecięca"
    const wardName = params.wardName ? decodeURIComponent(params.wardName) : "";

    if (!wardName) {
      return createErrorResponse(400, "BAD_REQUEST", "Ward name is required");
    }

    // 3. Parse and validate query parameters
    const url = new URL(request.url);
    const queryParams = {
      district: url.searchParams.get("district") || undefined,
      search: url.searchParams.get("search") || undefined,
      order:
        (url.searchParams.get("order") as "availablePlaces.desc" | "hospitalName.asc" | undefined) ||
        "availablePlaces.desc",
      limit: parseInt(url.searchParams.get("limit") || "50"),
      offset: parseInt(url.searchParams.get("offset") || "0"),
    };

    const validatedParams = validateHospitalsQuery(queryParams);

    // 4. Call service
    const hospitalsService = new HospitalsService(locals.supabase);

    // Check if ward exists first (404 handling)
    const exists = await hospitalsService.wardExists(wardName);
    if (!exists) {
      return createErrorResponse(404, "NOT_FOUND", `Ward "${wardName}" does not exist`);
    }

    const result = await hospitalsService.getHospitalsByWard(wardName, validatedParams);

    // 5. Return response
    return createSuccessResponse(200, result);
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

    // Log and handle unexpected errors
    console.error(`[GET /api/wards/${params.wardName}/hospitals] Error:`, {
      wardName: params.wardName,
      message: getErrorMessage(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    return createErrorResponse(500, "INTERNAL_SERVER_ERROR", "Failed to fetch hospitals");
  }
};
