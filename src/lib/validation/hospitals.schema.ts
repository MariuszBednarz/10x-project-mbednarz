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
 * - district: optional, max 100 characters, alphanumeric + Polish characters + spaces/hyphens
 * - search: optional, 1-100 characters, alphanumeric + Polish characters + spaces/hyphens
 * - order: enum, default "availablePlaces.desc"
 * - limit: 1-100, default 50
 * - offset: ≥0, default 0
 *
 * Security: Search and district queries are limited to safe characters
 * Allowed: letters, digits, spaces, hyphens, Polish diacritics
 */
export const hospitalsQuerySchema = paginationSchema.extend({
  district: z
    .string()
    .max(100)
    .regex(/^[a-zA-Z0-9\sąćęłńóśźżĄĆĘŁŃÓŚŹŻ-]*$/, {
      message: "District filter contains invalid characters. Only letters, numbers, spaces, and hyphens are allowed.",
    })
    .optional(),
  search: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[a-zA-Z0-9\sąćęłńóśźżĄĆĘŁŃÓŚŹŻ-]*$/, {
      message: "Search query contains invalid characters. Only letters, numbers, spaces, and hyphens are allowed.",
    })
    .optional(),
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
  } catch (error: unknown) {
    const zodError = error as { errors?: { message: string }[] };
    throw {
      code: "VALIDATION_ERROR",
      message: zodError.errors?.[0]?.message || "Validation failed",
    };
  }
}
