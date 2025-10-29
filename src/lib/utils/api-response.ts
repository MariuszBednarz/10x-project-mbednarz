/**
 * API Response Utilities
 *
 * Standardized response helpers for REST API endpoints
 *
 * @see .ai/api-implementation-plan.md Section 6.1
 */

import type { ErrorResponseDTO } from "@/types";

/**
 * Create standardized error response
 *
 * @param status - HTTP status code (400, 401, 404, 500, etc.)
 * @param code - Error code (VALIDATION_ERROR, UNAUTHORIZED, etc.)
 * @param message - Human-readable error message
 * @param details - Optional additional error details
 * @param hint - Optional hint for resolving the error
 *
 * @example
 * return createErrorResponse(400, "BAD_REQUEST", "Invalid limit parameter");
 */
export function createErrorResponse(
  status: number,
  code: string,
  message: string,
  details?: string,
  hint?: string
): Response {
  const error: ErrorResponseDTO = {
    code,
    message,
    ...(details && { details }),
    ...(hint && { hint }),
  };

  return new Response(JSON.stringify(error), {
    status,
    headers: {
      "Content-Type": "application/json",
    },
  });
}

/**
 * Create standardized success response
 *
 * @param status - HTTP status code (200, 201, etc.)
 * @param data - Response data (DTO or list response)
 *
 * @example
 * return createSuccessResponse(200, { data: wards, meta: { total: 10 } });
 */
export function createSuccessResponse<T>(status: number, data: T): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
    },
  });
}
