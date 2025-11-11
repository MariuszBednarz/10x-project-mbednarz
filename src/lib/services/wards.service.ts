import type { SupabaseClient } from "@/db/supabase.client";
import type { WardsQueryParams, WardsListResponseDTO, WardAggregatedDTO } from "@/types";
import { ServiceError } from "@/lib/utils/error-handler";

export class WardsService {
  constructor(private supabase: SupabaseClient) {}

  async getWards(params: WardsQueryParams, userId: string): Promise<WardsListResponseDTO> {
    try {
      const { data, error } = await this.supabase.rpc("get_wards_aggregated", {
        p_search: params.search || null,
        p_user_id: userId,
        p_favorites_only: params.favorites_only || false,
      });

      if (error) {
        throw new ServiceError("DATABASE_ERROR", "Failed to fetch wards from database", error.message);
      }

      const wards: WardAggregatedDTO[] = data || [];

      const [isStale, lastScrapeTime] = await Promise.all([this.isDataStale(), this.getLastScrapeTime()]);

      const limit = params.limit || 50;
      const offset = params.offset || 0;
      const total = wards.length;

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

      throw new ServiceError("INTERNAL_ERROR", "An unexpected error occurred while fetching wards");
    }
  }

  async isDataStale(): Promise<boolean> {
    try {
      const { data, error } = await this.supabase.rpc("is_data_stale");

      if (error) {
        return false;
      }

      return Boolean(data);
    } catch {
      return false;
    }
  }

  async getLastScrapeTime(): Promise<string | null> {
    try {
      const { data, error } = await this.supabase.rpc("get_last_scrape_time");

      if (error) {
        return null;
      }

      return data ? new Date(data).toISOString() : null;
    } catch {
      return null;
    }
  }
}
