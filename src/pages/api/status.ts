/**
 * GET /api/status
 *
 * Get system health and data freshness status
 *
 * @see .ai/api-implementation-plan.md Section 4.8
 * @see .ai/api-plan.md Section 4.4
 */

import type { APIRoute } from "astro";
import { StatusService } from "@/lib/services/status.service";
import { createErrorResponse, createSuccessResponse } from "@/lib/utils/api-response";
import { getAuthenticatedUser } from "@/lib/utils/auth";
import { isEmailNotVerifiedError, getErrorMessage } from "@/lib/utils/error-handler";

export const prerender = false;

/**
 * GET /api/status
 *
 * Get comprehensive system status
 *
 * No query parameters required
 *
 * Response: 200 OK
 * {
 *   isStale: boolean,
 *   lastScrapeTime: string,
 *   hoursSinceLastScrape: number,
 *   totalWards: number,
 *   totalHospitals: number,
 *   scrapingSuccessRate30d: number
 * }
 *
 * Errors:
 * - 401 UNAUTHORIZED: Missing or invalid authentication token
 * - 403 FORBIDDEN: Email not verified
 * - 500 INTERNAL_SERVER_ERROR: Unexpected server error
 *
 * Note: Consider caching this response for 5 minutes in production
 */
export const GET: APIRoute = async ({ locals }) => {
  try {
    // 1. Authenticate user
    const user = await getAuthenticatedUser(locals.supabase);
    if (!user) {
      return createErrorResponse(401, "UNAUTHORIZED", "Missing or invalid authentication token");
    }

    // 2. Call service
    const statusService = new StatusService(locals.supabase);
    const status = await statusService.getSystemStatus();

    // 3. Return response
    return createSuccessResponse(200, status);
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
    console.error("[GET /api/status] Error:", {
      message: getErrorMessage(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    return createErrorResponse(500, "INTERNAL_SERVER_ERROR", "Failed to fetch system status");
  }
};
