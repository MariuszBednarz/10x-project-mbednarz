import type { SupabaseClient } from "@/db/supabase.client";
import type { HospitalsQueryParams, HospitalsListResponseDTO, HospitalWardDTO } from "@/types";
import { ServiceError } from "@/lib/utils/error-handler";

export class HospitalsService {
  constructor(private supabase: SupabaseClient) {}

  async getHospitalsByWard(wardName: string, params: HospitalsQueryParams): Promise<HospitalsListResponseDTO> {
    try {
      let query = this.supabase.from("hospital_wards").select("*", { count: "exact" }).eq("wardName", wardName);

      if (params.district) {
        query = query.eq("district", params.district);
      }

      if (params.search) {
        query = query.ilike("hospitalName", `%${params.search}%`);
      }

      const order = params.order || "availablePlaces.desc";
      if (order === "availablePlaces.desc") {
        query = query.order("availablePlaces", { ascending: false, nullsFirst: false });
      } else if (order === "hospitalName.asc") {
        query = query.order("hospitalName", { ascending: true });
      }

      const limit = params.limit || 50;
      const offset = params.offset || 0;
      query = query.range(offset, offset + limit - 1);

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

      return count !== null && count > 0;
    } catch {
      return false;
    }
  }
}
