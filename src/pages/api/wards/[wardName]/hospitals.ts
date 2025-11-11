import type { APIRoute } from "astro";
import { HospitalsService } from "@/lib/services/hospitals.service";
import { validateHospitalsQuery } from "@/lib/validation/hospitals.schema";
import { createErrorResponse, createSuccessResponse } from "@/lib/utils/api-response";
import { getAuthenticatedUser } from "@/lib/utils/auth";
import { isValidationError, isEmailNotVerifiedError, getErrorMessage } from "@/lib/utils/error-handler";

export const prerender = false;

export const GET: APIRoute = async ({ params, request, locals }) => {
  try {
    const user = await getAuthenticatedUser(locals.supabase);
    if (!user) {
      return createErrorResponse(401, "UNAUTHORIZED", "Missing or invalid authentication token");
    }

    const wardName = params.wardName ? decodeURIComponent(params.wardName) : "";

    if (!wardName) {
      return createErrorResponse(400, "BAD_REQUEST", "Ward name is required");
    }

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

    const hospitalsService = new HospitalsService(locals.supabase);

    const exists = await hospitalsService.wardExists(wardName);
    if (!exists) {
      return createErrorResponse(404, "NOT_FOUND", `Ward "${wardName}" does not exist`);
    }

    const result = await hospitalsService.getHospitalsByWard(wardName, validatedParams);

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

    console.error(`[GET /api/wards/${params.wardName}/hospitals] Error:`, {
      wardName: params.wardName,
      message: getErrorMessage(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    return createErrorResponse(500, "INTERNAL_SERVER_ERROR", "Failed to fetch hospitals");
  }
};
