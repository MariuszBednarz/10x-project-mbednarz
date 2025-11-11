/**
 * Hospitals Service
 *
 * Business logic for querying hospitals by ward with filtering and sorting
 *
 * @see .ai/api-implementation-plan.md Section 3.2
 */

import type { SupabaseClient } from "@/db/supabase.client";
import type { HospitalsQueryParams, HospitalsListResponseDTO, HospitalWardDTO } from "@/types";
import { ServiceError } from "@/lib/utils/error-handler";

export class HospitalsService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Get hospitals for a specific ward
   *
   * Queries hospital_wards table with filters and sorting
   *
   * @param wardName - Ward name (exact match)
   * @param params - Query parameters (district, search, order, pagination)
   * @returns Hospitals list with metadata
   *
   * @throws ServiceError if database query fails
   */
  async getHospitalsByWard(wardName: string, params: HospitalsQueryParams): Promise<HospitalsListResponseDTO> {
    try {
      // Build base query
      let query = this.supabase.from("hospital_wards").select("*", { count: "exact" }).eq("wardName", wardName);

      // Apply district filter if provided
      if (params.district) {
        query = query.eq("district", params.district);
      }

      // Apply search filter if provided
      if (params.search) {
        query = query.ilike("hospitalName", `%${params.search}%`);
      }

      // Apply sorting
      const order = params.order || "availablePlaces.desc";
      if (order === "availablePlaces.desc") {
        // Sort by available places (descending)
        // Note: availablePlaces is VARCHAR, PostgreSQL will handle conversion
        query = query.order("availablePlaces", { ascending: false, nullsFirst: false });
      } else if (order === "hospitalName.asc") {
        // Sort by hospital name (ascending)
        query = query.order("hospitalName", { ascending: true });
      }

      // Apply pagination
      const limit = params.limit || 50;
      const offset = params.offset || 0;
      query = query.range(offset, offset + limit - 1);

      // Execute query
      const { data, error, count } = await query;

      if (error) {
        throw new ServiceError("DATABASE_ERROR", "Failed to fetch hospitals from database", error.message);
      }

      return {
        data: (data as HospitalWardDTO[]) || [],
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

      throw new ServiceError("INTERNAL_ERROR", "An unexpected error occurred while fetching hospitals");
    }
  }

  /**
   * Check if ward exists
   *
   * @param wardName - Ward name to check
   * @returns true if ward exists, false otherwise
   */
  async wardExists(wardName: string): Promise<boolean> {
    try {
      const { error, count } = await this.supabase
        .from("hospital_wards")
        .select("wardName", { count: "exact" })
        .eq("wardName", wardName)
        .limit(1);

      if (error) {
        return false;
      }

      const exists = count !== null && count > 0;

      return exists;
    } catch {
      return false;
    }
  }
}
