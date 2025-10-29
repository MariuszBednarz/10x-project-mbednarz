/**
 * GET /api/insights/current
 *
 * Get current active AI-generated insight
 *
 * @see .ai/api-implementation-plan.md Section 4.7
 * @see .ai/api-plan.md Section 4.3
 */

import type { APIRoute } from "astro";
import { InsightsService } from "@/lib/services/insights.service";
import { createErrorResponse, createSuccessResponse } from "@/lib/utils/api-response";
import { getAuthenticatedUser } from "@/lib/utils/auth";
import { isEmailNotVerifiedError, getErrorMessage } from "@/lib/utils/error-handler";

export const prerender = false;

/**
 * GET /api/insights/current
 *
 * Get current non-expired AI insight
 *
 * No query parameters required
 *
 * Response: 200 OK
 * {
 *   insight_text: string,
 *   generated_at: string,
 *   expires_at: string
 * }
 *
 * Response: 204 No Content (if no active insight)
 *
 * Errors:
 * - 401 UNAUTHORIZED: Missing or invalid authentication token
 * - 403 FORBIDDEN: Email not verified
 * - 500 INTERNAL_SERVER_ERROR: Unexpected server error
 *
 * Note: Graceful degradation pattern - returns 204 if no insight available
 */
export const GET: APIRoute = async ({ locals }) => {
  try {
    // 1. Authenticate user
    const user = await getAuthenticatedUser(locals.supabase);
    if (!user) {
      return createErrorResponse(401, "UNAUTHORIZED", "Missing or invalid authentication token");
    }

    // 2. Call service
    const insightsService = new InsightsService(locals.supabase);
    const insight = await insightsService.getCurrentInsight();

    // 3. Return response
    // If no active insight, return 204 No Content (not an error)
    if (!insight) {
      return new Response(null, { status: 204 });
    }

    return createSuccessResponse(200, insight);
  } catch (error: any) {
    // Handle email not verified error
    if (isEmailNotVerifiedError(error)) {
      return createErrorResponse(403, "FORBIDDEN", error.message, undefined, "Please verify your email address");
    }

    // Log and handle unexpected errors
    console.error("[GET /api/insights/current] Error:", {
      message: getErrorMessage(error),
      stack: error?.stack,
    });

    return createErrorResponse(500, "INTERNAL_SERVER_ERROR", "Failed to fetch insight");
  }
};
