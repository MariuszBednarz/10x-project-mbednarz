import type { APIRoute } from "astro";
import { createClient } from "@supabase/supabase-js";
import { createErrorResponse, createSuccessResponse } from "@/lib/utils/api-response";
import { getAuthenticatedUser } from "@/lib/utils/auth";
import { isEmailNotVerifiedError, getErrorMessage } from "@/lib/utils/error-handler";

export const prerender = false;

export const GET: APIRoute = async ({ locals }) => {
  try {
    const user = await getAuthenticatedUser(locals.supabase);
    if (!user) {
      return createErrorResponse(401, "UNAUTHORIZED", "Missing or invalid authentication token");
    }

    return createSuccessResponse(200, {
      id: user.id,
      email: user.email,
      email_confirmed_at: user.email_confirmed_at || null,
      created_at: user.created_at,
    });
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

    console.error("[GET /api/users/me] Error:", {
      message: getErrorMessage(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    return createErrorResponse(500, "INTERNAL_SERVER_ERROR", "Failed to fetch user profile");
  }
};

export const DELETE: APIRoute = async ({ locals }) => {
  try {
    const user = await getAuthenticatedUser(locals.supabase);
    if (!user) {
      return createErrorResponse(401, "UNAUTHORIZED", "Missing or invalid authentication token");
    }

    const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
    const serviceRoleKey =
      import.meta.env.SUPABASE_SERVICE_ROLE_KEY ||
      (locals.runtime?.env?.SUPABASE_SERVICE_ROLE_KEY as string | undefined);

    if (!supabaseUrl || !serviceRoleKey) {
      console.warn("[DELETE /api/users/me] Missing environment variables");
      return createErrorResponse(
        500,
        "INTERNAL_SERVER_ERROR",
        `DEBUG ENV: supabaseUrl=${supabaseUrl ? "OK" : "MISSING"}, serviceRoleKey=${serviceRoleKey ? `OK-length:${serviceRoleKey.length}` : "MISSING"}, allEnvKeys=${Object.keys(import.meta.env).join(",")}`
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const { error } = await supabaseAdmin.auth.admin.deleteUser(user.id);

    if (error) {
      console.error("[DELETE /api/users/me] Failed to delete user:", {
        userId: user.id,
        error: error.message,
      });
      return createErrorResponse(
        500,
        "INTERNAL_SERVER_ERROR",
        `DEBUG DELETE ERROR: ${error.message} | code: ${error.code || "N/A"} | status: ${error.status || "N/A"}`
      );
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

    console.error("[DELETE /api/users/me] Error:", {
      message: getErrorMessage(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    return createErrorResponse(500, "INTERNAL_SERVER_ERROR", "Failed to delete user account");
  }
};
