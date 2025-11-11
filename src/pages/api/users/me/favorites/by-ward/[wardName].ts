import type { APIRoute } from "astro";
import { FavoritesService } from "@/lib/services/favorites.service";
import { createErrorResponse } from "@/lib/utils/api-response";
import { getAuthenticatedUser } from "@/lib/utils/auth";
import { isEmailNotVerifiedError, getErrorMessage } from "@/lib/utils/error-handler";

export const prerender = false;

export const DELETE: APIRoute = async ({ params, locals }) => {
  try {
    const user = await getAuthenticatedUser(locals.supabase);
    if (!user) {
      return createErrorResponse(401, "UNAUTHORIZED", "Missing or invalid authentication token");
    }

    const wardName = params.wardName;

    if (!wardName) {
      return createErrorResponse(400, "BAD_REQUEST", "Ward name is required");
    }

    const decodedWardName = decodeURIComponent(wardName);

    const favoritesService = new FavoritesService(locals.supabase);

    const deleted = await favoritesService.removeFavoriteByWardName(user.id, decodedWardName);

    if (!deleted) {
      return createErrorResponse(404, "NOT_FOUND", "Favorite not found");
    }

    return new Response(null, { status: 204 });
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

    console.error(`[DELETE /api/users/me/favorites/by-ward/${params.wardName}] Error:`, {
      wardName: params.wardName,
      message: getErrorMessage(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    return createErrorResponse(500, "INTERNAL_SERVER_ERROR", "Failed to remove favorite");
  }
};
