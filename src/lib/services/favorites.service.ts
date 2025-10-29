/**
 * Favorites Service
 *
 * Business logic for managing user favorites (CRUD operations)
 *
 * @see .ai/api-implementation-plan.md Section 3.3
 */

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

  /**
   * Get user favorites with live statistics
   *
   * Calls PostgreSQL function: get_user_favorites_with_stats()
   * RLS automatically filters by authenticated user
   *
   * @param userId - Authenticated user ID
   * @param params - Pagination parameters
   * @returns Favorites list with metadata
   *
   * @throws ServiceError if database query fails
   */
  async getUserFavorites(userId: string, params: PaginationQueryParams): Promise<FavoritesListResponseDTO> {
    try {
      // Call PostgreSQL function (RLS filters by auth.uid())
      const { data, error } = await this.supabase.rpc("get_user_favorites_with_stats");

      if (error) {
        throw new ServiceError("DATABASE_ERROR", "Failed to fetch favorites from database", error.message);
      }

      // Handle empty results gracefully
      const allFavorites: FavoriteWithStatsDTO[] = data || [];

      // Apply pagination
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

      console.error("[FavoritesService.getUserFavorites] Unexpected error:", error);
      throw new ServiceError("INTERNAL_ERROR", "An unexpected error occurred while fetching favorites");
    }
  }

  /**
   * Add ward to favorites
   *
   * Inserts into user_favorites table
   * RLS policy enforces user_id matches authenticated user
   *
   * @param userId - Authenticated user ID
   * @param command - Add favorite command with ward_name
   * @returns Created favorite
   *
   * @throws ServiceError if database operation fails
   * @throws ServiceError with code CONFLICT if favorite already exists (duplicate)
   */
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
        // Handle duplicate key error (23505)
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

      console.error("[FavoritesService.addFavorite] Unexpected error:", error);
      throw new ServiceError("INTERNAL_ERROR", "An unexpected error occurred while adding favorite");
    }
  }

  /**
   * Remove favorite by ID
   *
   * Deletes from user_favorites table with RLS check
   *
   * @param userId - Authenticated user ID
   * @param favoriteId - Favorite UUID to delete
   *
   * @throws ServiceError if database operation fails
   */
  async removeFavorite(userId: string, favoriteId: string): Promise<void> {
    try {
      const { error } = await this.supabase.from("user_favorites").delete().eq("id", favoriteId).eq("user_id", userId); // Ensures user owns the favorite

      if (error) {
        throw new ServiceError("DATABASE_ERROR", "Failed to remove favorite from database", error.message);
      }
    } catch (error) {
      if (error instanceof ServiceError) {
        throw error;
      }

      console.error("[FavoritesService.removeFavorite] Unexpected error:", error);
      throw new ServiceError("INTERNAL_ERROR", "An unexpected error occurred while removing favorite");
    }
  }

  /**
   * Check if favorite exists and belongs to user
   *
   * @param userId - Authenticated user ID
   * @param favoriteId - Favorite UUID to check
   * @returns true if favorite exists and belongs to user
   */
  async favoriteExists(userId: string, favoriteId: string): Promise<boolean> {
    try {
      const { error, count } = await this.supabase
        .from("user_favorites")
        .select("id", { count: "exact" })
        .eq("id", favoriteId)
        .eq("user_id", userId)
        .limit(1);

      if (error) {
        console.error("[FavoritesService.favoriteExists] Error:", error);
        return false;
      }

      return count !== null && count > 0;
    } catch (error) {
      console.error("[FavoritesService.favoriteExists] Unexpected error:", error);
      return false;
    }
  }
}
