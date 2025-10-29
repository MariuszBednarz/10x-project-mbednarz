/**
 * Logs Service
 *
 * Business logic for querying scraping operation logs
 *
 * @see .ai/api-implementation-plan.md Section 3.6
 */

import type { SupabaseClient } from "@/db/supabase.client";
import type { ScrapingLogsQueryParams, ScrapingLogsListResponseDTO, ScrapingLogDTO } from "@/types";
import { ServiceError } from "@/lib/utils/error-handler";

export class LogsService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Get scraping logs with filtering and pagination
   *
   * Queries scraping_logs table
   * Optional filter by status (success/failure)
   *
   * @param params - Query parameters (status filter, pagination)
   * @returns Scraping logs list with metadata
   *
   * @throws ServiceError if database query fails
   */
  async getScrapingLogs(params: ScrapingLogsQueryParams): Promise<ScrapingLogsListResponseDTO> {
    try {
      // Build base query
      let query = this.supabase
        .from("scraping_logs")
        .select("*", { count: "exact" })
        .order("started_at", { ascending: false });

      // Apply status filter if provided
      if (params.status) {
        query = query.eq("status", params.status);
      }

      // Apply pagination
      const limit = params.limit || 10; // Lower default for logs
      const offset = params.offset || 0;
      query = query.range(offset, offset + limit - 1);

      // Execute query
      const { data, error, count } = await query;

      if (error) {
        throw new ServiceError("DATABASE_ERROR", "Failed to fetch scraping logs from database", error.message);
      }

      return {
        data: (data as ScrapingLogDTO[]) || [],
        meta: {
          total: count || 0,
          limit,
          offset,
        },
      };
    } catch (error) {
      if (error instanceof ServiceError) {
        throw error;
      }

      console.error("[LogsService.getScrapingLogs] Unexpected error:", error);
      throw new ServiceError("INTERNAL_ERROR", "An unexpected error occurred while fetching scraping logs");
    }
  }
}
