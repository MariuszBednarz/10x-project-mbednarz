/**
 * Wards Service
 *
 * Business logic for ward aggregation, search, and filtering
 *
 * @see .ai/api-implementation-plan.md Section 3.1
 */

import type { SupabaseClient } from "@/db/supabase.client";
import type { WardsQueryParams, WardsListResponseDTO, WardAggregatedDTO } from "@/types";
import { ServiceError } from "@/lib/utils/error-handler";

export class WardsService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Get aggregated wards with statistics
   *
   * Calls PostgreSQL function: get_wards_aggregated()
   *
   * @param params - Query parameters (search, favorites_only, pagination)
   * @param userId - Authenticated user ID (required for isFavorite detection)
   * @returns Wards list with metadata
   *
   * @throws ServiceError if database query fails
   *
   * ⚠️ CRITICAL: Always pass authenticated user.id (never NULL)
   * NULL breaks isFavorite detection
   */
  async getWards(params: WardsQueryParams, userId: string): Promise<WardsListResponseDTO> {
    try {
      // Call PostgreSQL function for ward aggregation
      const { data, error } = await this.supabase.rpc("get_wards_aggregated", {
        p_search: params.search || null,
        p_user_id: userId,
        p_favorites_only: params.favorites_only || false,
      });

      if (error) {
        throw new ServiceError("DATABASE_ERROR", "Failed to fetch wards from database", error.message);
      }

      // Handle empty results gracefully
      const wards: WardAggregatedDTO[] = data || [];

      // Get metadata (data freshness indicators)
      const [isStale, lastScrapeTime] = await Promise.all([this.isDataStale(), this.getLastScrapeTime()]);

      // Calculate pagination metadata
      const limit = params.limit || 50;
      const offset = params.offset || 0;
      const total = wards.length;

      // Apply pagination to results
      const paginatedWards = wards.slice(offset, offset + limit);

      return {
        data: paginatedWards,
        meta: {
          total,
          limit,
          offset,
          lastScrapeTime: lastScrapeTime || new Date().toISOString(),
          isStale,
        },
      };
    } catch (error) {
      if (error instanceof ServiceError) {
        throw error;
      }

      console.error("[WardsService.getWards] Unexpected error:", error);
      throw new ServiceError("INTERNAL_ERROR", "An unexpected error occurred while fetching wards");
    }
  }

  /**
   * Check if data is stale (>12 hours old)
   *
   * Calls PostgreSQL function: is_data_stale()
   *
   * @returns true if data is stale, false otherwise
   */
  async isDataStale(): Promise<boolean> {
    try {
      const { data, error } = await this.supabase.rpc("is_data_stale");

      if (error) {
        console.error("[WardsService.isDataStale] Error:", error);
        return false; // Graceful degradation
      }

      return Boolean(data);
    } catch (error) {
      console.error("[WardsService.isDataStale] Unexpected error:", error);
      return false; // Graceful degradation
    }
  }

  /**
   * Get last scrape timestamp
   *
   * Calls PostgreSQL function: get_last_scrape_time()
   *
   * @returns Last scrape timestamp (ISO string) or null if no data
   */
  async getLastScrapeTime(): Promise<string | null> {
    try {
      const { data, error } = await this.supabase.rpc("get_last_scrape_time");

      if (error) {
        console.error("[WardsService.getLastScrapeTime] Error:", error);
        return null; // Graceful degradation
      }

      return data ? new Date(data).toISOString() : null;
    } catch (error) {
      console.error("[WardsService.getLastScrapeTime] Unexpected error:", error);
      return null; // Graceful degradation
    }
  }
}
