import type { SupabaseClient } from "@/db/supabase.client";
import type {
  PaginationQueryParams,
  FavoritesListResponseDTO,
  AddFavoriteCommand,
  UserFavoriteDTO,
  FavoriteWithStatsDTO,
} from "@/types";
import { ServiceError } from "@/lib/utils/error-handler";

export class FavoritesService {
  constructor(private supabase: SupabaseClient) {}

  async getUserFavorites(userId: string, params: PaginationQueryParams): Promise<FavoritesListResponseDTO> {
    try {
      const { data, error } = await this.supabase.rpc("get_user_favorites_with_stats");

      if (error) {
        throw new ServiceError("DATABASE_ERROR", "Failed to fetch favorites from database", error.message);
      }

      const allFavorites: FavoriteWithStatsDTO[] = data || [];

      const limit = params.limit || 50;
      const offset = params.offset || 0;
      const total = allFavorites.length;

      const paginatedFavorites = allFavorites.slice(offset, offset + limit);

      return {
        data: paginatedFavorites,
        meta: {
          total,
          limit,
          offset,
        },
      };
    } catch (error) {
      if (error instanceof ServiceError) {
        throw error;
      }

      throw new ServiceError("INTERNAL_ERROR", "An unexpected error occurred while fetching favorites");
    }
  }

  async addFavorite(userId: string, command: AddFavoriteCommand): Promise<UserFavoriteDTO> {
    try {
      const { data, error } = await this.supabase
        .from("user_favorites")
        .insert({
          user_id: userId,
          ward_name: command.ward_name,
        })
        .select()
        .single();

      if (error) {
        if (error.code === "23505") {
          throw new ServiceError("CONFLICT", "This ward is already in your favorites");
        }

        throw new ServiceError("DATABASE_ERROR", "Failed to add favorite to database", error.message);
      }

      if (!data) {
        throw new ServiceError("INTERNAL_ERROR", "Failed to retrieve created favorite");
      }

      return data as UserFavoriteDTO;
    } catch (error) {
      if (error instanceof ServiceError) {
        throw error;
      }

      throw new ServiceError("INTERNAL_ERROR", "An unexpected error occurred while adding favorite");
    }
  }

  async removeFavoriteByWardName(userId: string, wardName: string): Promise<boolean> {
    try {
      const { error, count } = await this.supabase
        .from("user_favorites")
        .delete({ count: "exact" })
        .eq("user_id", userId)
        .eq("ward_name", wardName);

      if (error) {
        throw new ServiceError("DATABASE_ERROR", "Failed to remove favorite from database", error.message);
      }

      return count !== null && count > 0;
    } catch (error) {
      if (error instanceof ServiceError) {
        throw error;
      }

      throw new ServiceError("INTERNAL_ERROR", "An unexpected error occurred while removing favorite");
    }
  }
}
