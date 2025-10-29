/**
 * Logs Validation Schemas
 *
 * Zod schemas for GET /api/logs/scraping endpoint
 *
 * @see .ai/api-implementation-plan.md Section 5.5
 */

import { z } from "zod";
import { paginationSchema } from "./common.schema";

/**
 * Scraping Logs Query Schema
 *
 * Validates query parameters for GET /api/logs/scraping:
 * - status: optional enum ("success" | "failure")
 * - limit: 1-100, default 10 (lower than other endpoints)
 * - offset: ≥0, default 0
 */
export const scrapingLogsQuerySchema = paginationSchema
  .extend({
    status: z.enum(["success", "failure"]).optional(),
  })
  .merge(
    z.object({
      limit: z.number().int().min(1).max(100).default(10), // Override default to 10
    })
  );

export type ScrapingLogsQueryInput = z.infer<typeof scrapingLogsQuerySchema>;

/**
 * Validate scraping logs query parameters
 *
 * @param input - Raw query parameters
 * @returns Validated and parsed parameters
 * @throws ValidationError with code VALIDATION_ERROR
 *
 * @example
 * const validated = validateScrapingLogsQuery({ status: "failure" });
 */
export function validateScrapingLogsQuery(input: unknown): ScrapingLogsQueryInput {
  try {
    return scrapingLogsQuerySchema.parse(input);
  } catch (error: any) {
    throw {
      code: "VALIDATION_ERROR",
      message: error.errors?.[0]?.message || "Validation failed",
    };
  }
}
