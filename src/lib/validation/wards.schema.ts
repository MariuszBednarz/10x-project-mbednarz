/**
 * Wards Validation Schemas
 *
 * Zod schemas for GET /api/wards endpoint
 *
 * @see .ai/api-implementation-plan.md Section 5.2
 */

import { z } from "zod";
import { paginationSchema } from "./common.schema";

/**
 * Wards Query Schema
 *
 * Validates query parameters for GET /api/wards:
 * - search: optional, 1-100 characters
 * - favorites_only: boolean, default false
 * - limit: 1-100, default 50
 * - offset: ≥0, default 0
 *
 * Note: Sorting is fixed at database level (total_places DESC)
 */
export const wardsQuerySchema = paginationSchema.extend({
  search: z.string().min(1).max(100).optional(),
  favorites_only: z.boolean().default(false),
});

export type WardsQueryInput = z.infer<typeof wardsQuerySchema>;

/**
 * Validate wards query parameters
 *
 * @param input - Raw query parameters
 * @returns Validated and parsed parameters
 * @throws ValidationError with code VALIDATION_ERROR
 *
 * @example
 * const validated = validateWardsQuery({ limit: "50", offset: "0" });
 */
export function validateWardsQuery(input: unknown): WardsQueryInput {
  try {
    return wardsQuerySchema.parse(input);
  } catch (error: any) {
    throw {
      code: "VALIDATION_ERROR",
      message: error.errors?.[0]?.message || "Validation failed",
    };
  }
}
