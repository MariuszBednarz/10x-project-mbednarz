/**
 * Common Validation Schemas
 *
 * Reusable Zod schemas for shared input validation
 *
 * @see .ai/api-implementation-plan.md Section 5.1
 */

import { z } from "zod";

/**
 * Pagination Schema
 *
 * Validates limit and offset parameters for paginated endpoints
 * - limit: 1-100, default 50
 * - offset: ≥0, default 0
 */
export const paginationSchema = z.object({
  limit: z.number().int().min(1).max(100).default(50),
  offset: z.number().int().min(0).default(0),
});

export type PaginationInput = z.infer<typeof paginationSchema>;

/**
 * UUID Schema
 *
 * Validates UUID format (v4)
 */
export const uuidSchema = z.string().uuid();

/**
 * Ward Name Schema
 *
 * Validates ward name:
 * - Required (min 1 char)
 * - Max 255 characters
 * - Trimmed whitespace
 */
export const wardNameSchema = z
  .string()
  .min(1, "Ward name is required")
  .max(255, "Ward name exceeds 255 characters")
  .trim();
