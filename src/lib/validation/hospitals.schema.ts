/**
 * Hospitals Validation Schemas
 *
 * Zod schemas for GET /api/wards/{wardName}/hospitals endpoint
 *
 * @see .ai/api-implementation-plan.md Section 5.3
 */

import { z } from "zod";
import { paginationSchema } from "./common.schema";

/**
 * Hospitals Query Schema
 *
 * Validates query parameters for GET /api/wards/{wardName}/hospitals:
 * - district: optional, max 100 characters
 * - search: optional, 1-100 characters
 * - order: enum, default "availablePlaces.desc"
 * - limit: 1-100, default 50
 * - offset: ≥0, default 0
 */
export const hospitalsQuerySchema = paginationSchema.extend({
  district: z.string().max(100).optional(),
  search: z.string().min(1).max(100).optional(),
  order: z.enum(["availablePlaces.desc", "hospitalName.asc"]).default("availablePlaces.desc"),
});

export type HospitalsQueryInput = z.infer<typeof hospitalsQuerySchema>;

/**
 * Validate hospitals query parameters
 *
 * @param input - Raw query parameters
 * @returns Validated and parsed parameters
 * @throws ValidationError with code VALIDATION_ERROR
 *
 * @example
 * const validated = validateHospitalsQuery({ district: "Warszawa" });
 */
export function validateHospitalsQuery(input: unknown): HospitalsQueryInput {
  try {
    return hospitalsQuerySchema.parse(input);
  } catch (error: any) {
    throw {
      code: "VALIDATION_ERROR",
      message: error.errors?.[0]?.message || "Validation failed",
    };
  }
}
