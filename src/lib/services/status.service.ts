/**
 * Status Service
 *
 * Business logic for system health and data freshness status
 *
 * @see .ai/api-implementation-plan.md Section 3.5
 */

import type { SupabaseClient } from "@/db/supabase.client";
import type { SystemStatusDTO } from "@/types";
import { parseSystemStatus } from "@/types";
import { ServiceError } from "@/lib/utils/error-handler";

export class StatusService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Get comprehensive system status
   *
   * Calls PostgreSQL function: get_system_status()
   * Returns aggregated metrics:
   * - Data freshness (isStale, lastScrapeTime, hoursSinceLastScrape)
   * - Counts (totalWards, totalHospitals)
   * - Success rate (scrapingSuccessRate30d)
   *
   * @returns System status with all metrics
   *
   * @throws ServiceError if database query fails
   */
  async getSystemStatus(): Promise<SystemStatusDTO> {
    try {
      const { data, error } = await this.supabase.rpc("get_system_status");

      if (error) {
        throw new ServiceError("DATABASE_ERROR", "Failed to fetch system status from database", error.message);
      }

      if (!data) {
        throw new ServiceError("INTERNAL_ERROR", "System status function returned no data");
      }

      // Parse JSON response to SystemStatusDTO
      // PostgreSQL function returns JSON type, need to parse it
      return parseSystemStatus(data);
    } catch (error) {
      if (error instanceof ServiceError) {
        throw error;
      }

      throw new ServiceError("INTERNAL_ERROR", "An unexpected error occurred while fetching system status");
    }
  }
}
