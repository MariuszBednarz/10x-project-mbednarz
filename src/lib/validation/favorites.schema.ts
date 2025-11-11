/**
 * Favorites Validation Schemas
 *
 * Zod schemas for favorites endpoints
 *
 * @see .ai/api-implementation-plan.md Section 5.4
 */

import { z } from "zod";
import { wardNameSchema } from "./common.schema";

/**
 * Add Favorite Command Schema
 *
 * Validates POST /api/users/me/favorites request body:
 * - ward_name: required, 1-255 characters, trimmed
 */
export const addFavoriteCommandSchema = z.object({
  ward_name: wardNameSchema,
});

export type AddFavoriteCommandInput = z.infer<typeof addFavoriteCommandSchema>;

/**
 * Validate add favorite command
 *
 * @param input - Raw request body
 * @returns Validated command
 * @throws ValidationError with code VALIDATION_ERROR
 *
 * @example
 * const command = validateAddFavoriteCommand(await request.json());
 */
export function validateAddFavoriteCommand(input: unknown): AddFavoriteCommandInput {
  try {
    return addFavoriteCommandSchema.parse(input);
  } catch (error: unknown) {
    const zodError = error as { errors?: { message: string }[] };
    throw {
      code: "VALIDATION_ERROR",
      message: zodError.errors?.[0]?.message || "Validation failed",
    };
  }
}
