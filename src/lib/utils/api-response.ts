import type { ErrorResponseDTO } from "@/types";

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

export function createSuccessResponse<T>(status: number, data: T): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
    },
  });
}
