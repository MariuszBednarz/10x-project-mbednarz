/**
 * GET /api/logs/scraping
 *
 * Get scraping operation logs (monitoring/debugging)
 *
 * @see .ai/api-implementation-plan.md Section 4.10
 * @see .ai/api-plan.md Section 4.7
 *
 * Note: Optional for MVP - useful for admin dashboard
 */

import type { APIRoute } from "astro";
import { LogsService } from "@/lib/services/logs.service";
import { validateScrapingLogsQuery } from "@/lib/validation/logs.schema";
import { createErrorResponse, createSuccessResponse } from "@/lib/utils/api-response";
import { getAuthenticatedUser } from "@/lib/utils/auth";
import { isValidationError, isEmailNotVerifiedError, getErrorMessage } from "@/lib/utils/error-handler";

export const prerender = false;

/**
 * GET /api/logs/scraping
 *
 * Get scraping operation logs
 *
 * Query Parameters:
 * - status (optional): enum ("success" | "failure") - Filter by status
 * - limit (optional): number (1-100, default 10) - Results per page
 * - offset (optional): number (≥0, default 0) - Pagination offset
 *
 * Response: 200 OK
 * {
 *   data: ScrapingLogDTO[],
 *   meta: {
 *     total: number,
 *     limit: number,
 *     offset: number
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
      status: url.searchParams.get("status") as "success" | "failure" | undefined,
      limit: parseInt(url.searchParams.get("limit") || "10"),
      offset: parseInt(url.searchParams.get("offset") || "0"),
    };

    const validatedParams = validateScrapingLogsQuery(queryParams);

    // 3. Call service
    const logsService = new LogsService(locals.supabase);
    const result = await logsService.getScrapingLogs(validatedParams);

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
    console.error("[GET /api/logs/scraping] Error:", {
      message: getErrorMessage(error),
      stack: error?.stack,
    });

    return createErrorResponse(500, "INTERNAL_SERVER_ERROR", "Failed to fetch scraping logs");
  }
};
