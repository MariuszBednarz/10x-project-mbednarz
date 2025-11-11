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

export const GET: APIRoute = async ({ request, locals }) => {
  try {
    const user = await getAuthenticatedUser(locals.supabase);
    if (!user) {
      return createErrorResponse(401, "UNAUTHORIZED", "Missing or invalid authentication token");
    }

    const url = new URL(request.url);
    const queryParams = {
      limit: parseInt(url.searchParams.get("limit") || "50"),
      offset: parseInt(url.searchParams.get("offset") || "0"),
    };

    const favoritesService = new FavoritesService(locals.supabase);
    const result = await favoritesService.getUserFavorites(user.id, queryParams);

    return createSuccessResponse(200, result);
  } catch (error: unknown) {
    if (isEmailNotVerifiedError(error)) {
      return createErrorResponse(
        403,
        "FORBIDDEN",
        getErrorMessage(error),
        undefined,
        "Please verify your email address"
      );
    }

    console.error("[GET /api/users/me/favorites] Error:", {
      message: getErrorMessage(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    return createErrorResponse(500, "INTERNAL_SERVER_ERROR", "Failed to fetch favorites");
  }
};

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const user = await getAuthenticatedUser(locals.supabase);
    if (!user) {
      return createErrorResponse(401, "UNAUTHORIZED", "Missing or invalid authentication token");
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return createErrorResponse(400, "BAD_REQUEST", "Invalid JSON in request body");
    }

    const command = validateAddFavoriteCommand(body);

    const favoritesService = new FavoritesService(locals.supabase);
    const favorite = await favoritesService.addFavorite(user.id, command);

    return createSuccessResponse(201, favorite);
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

    if (isDuplicateKeyError(error)) {
      return createErrorResponse(409, "CONFLICT", "This ward is already in your favorites");
    }

    if ((error as { code?: string })?.code === "CONFLICT") {
      return createErrorResponse(409, "CONFLICT", getErrorMessage(error));
    }

    return createErrorResponse(500, "INTERNAL_SERVER_ERROR", "Failed to add favorite");
  }
};
