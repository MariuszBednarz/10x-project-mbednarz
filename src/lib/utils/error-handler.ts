/**
 * Error Handling Utilities
 *
 * Custom error classes and error handling helpers
 *
 * @see .ai/api-implementation-plan.md Section 6
 */

/**
 * Custom Service Error
 *
 * Thrown by service layer methods to indicate specific error conditions
 */
export class ServiceError extends Error {
  constructor(
    public code: string,
    message: string,
    public details?: string
  ) {
    super(message);
    this.name = "ServiceError";
  }
}

/**
 * Validation Error
 *
 * Thrown when input validation fails
 */
export class ValidationError extends Error {
  constructor(
    message: string,
    public details?: string
  ) {
    super(message);
    this.name = "ValidationError";
    this.code = "VALIDATION_ERROR";
  }

  code: string;
}

/**
 * Check if error is a Supabase duplicate key error (23505)
 *
 * @param error - Error object from Supabase
 * @returns true if duplicate key violation
 */
export function isDuplicateKeyError(error: any): boolean {
  return error?.code === "23505";
}

/**
 * Check if error is a validation error
 *
 * @param error - Error object
 * @returns true if validation error
 */
export function isValidationError(error: any): boolean {
  return error?.code === "VALIDATION_ERROR" || error instanceof ValidationError;
}

/**
 * Check if error is an email not verified error
 *
 * @param error - Error object
 * @returns true if email not verified error
 */
export function isEmailNotVerifiedError(error: any): boolean {
  return error?.code === "EMAIL_NOT_VERIFIED";
}

/**
 * Extract error message from unknown error
 *
 * @param error - Error object of unknown type
 * @returns Error message string
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "string") {
    return error;
  }
  if (error && typeof error === "object" && "message" in error) {
    return String(error.message);
  }
  return "An unknown error occurred";
}
