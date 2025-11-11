import type { APIRoute } from "astro";
import { WardsService } from "@/lib/services/wards.service";
import { validateWardsQuery } from "@/lib/validation/wards.schema";
import { createErrorResponse, createSuccessResponse } from "@/lib/utils/api-response";
import { getAuthenticatedUser } from "@/lib/utils/auth";
import { isValidationError, isEmailNotVerifiedError, getErrorMessage } from "@/lib/utils/error-handler";

export const prerender = false;

export const GET: APIRoute = async ({ request, locals }) => {
  try {
    const user = await getAuthenticatedUser(locals.supabase);
    if (!user) {
      return createErrorResponse(401, "UNAUTHORIZED", "Missing or invalid authentication token");
    }

    const url = new URL(request.url);
    const queryParams = {
      search: url.searchParams.get("search") || undefined,
      favorites_only: url.searchParams.get("favorites_only") === "true",
      limit: parseInt(url.searchParams.get("limit") || "50"),
      offset: parseInt(url.searchParams.get("offset") || "0"),
    };

    const validatedParams = validateWardsQuery(queryParams);

    const wardsService = new WardsService(locals.supabase);
    const result = await wardsService.getWards(validatedParams, user.id);

    return createSuccessResponse(200, result);
  } catch (error: unknown) {
    if (isValidationError(error)) {
      return createErrorResponse(400, "BAD_REQUEST", getErrorMessage(error));
    }

    if (isEmailNotVerifiedError(error)) {
      return createErrorResponse(
        403,
        "FORBIDDEN",
        getErrorMessage(error),
        undefined,
        "Please verify your email address"
      );
    }

    console.error("[GET /api/wards] Error:", {
      message: getErrorMessage(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    return createErrorResponse(500, "INTERNAL_SERVER_ERROR", "Failed to fetch wards");
  }
};
