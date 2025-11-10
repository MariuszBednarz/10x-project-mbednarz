import { describe, it, expect, vi, beforeEach } from "vitest";
import { FavoritesService } from "./favorites.service";
import type { SupabaseClient } from "@/db/supabase.client";
import type { PaginationQueryParams, FavoriteWithStatsDTO, AddFavoriteCommand, UserFavoriteDTO } from "@/types";
import { ServiceError } from "@/lib/utils/error-handler";

describe("FavoritesService", () => {
  let mockSupabase: SupabaseClient;
  let favoritesService: FavoritesService;

  beforeEach(() => {
    // Reset mock before each test
    mockSupabase = {
      rpc: vi.fn(),
      from: vi.fn(),
    } as any;

    favoritesService = new FavoritesService(mockSupabase);
  });

  describe("getUserFavorites", () => {
    const mockUserId = "123e4567-e89b-12d3-a456-426614174000";
    const mockFavorites: FavoriteWithStatsDTO[] = [
      {
        id: "1",
        ward_name: "Oddział Kardiologii",
        created_at: "2024-01-01T10:00:00Z",
        hospital_count: 3,
        total_available_places: 15,
        last_scraped_at: "2024-01-15T10:00:00Z",
      },
      {
        id: "2",
        ward_name: "Oddział Neurologii",
        created_at: "2024-01-02T10:00:00Z",
        hospital_count: 2,
        total_available_places: 8,
        last_scraped_at: "2024-01-15T10:00:00Z",
      },
      {
        id: "3",
        ward_name: "Oddział Ortopedii",
        created_at: "2024-01-03T10:00:00Z",
        hospital_count: 4,
        total_available_places: 20,
        last_scraped_at: "2024-01-15T10:00:00Z",
      },
    ];

    describe("Successful favorites retrieval", () => {
      it("should call get_user_favorites_with_stats RPC", async () => {
        vi.mocked(mockSupabase.rpc).mockResolvedValue({
          data: mockFavorites,
          error: null,
        } as any);

        const params: PaginationQueryParams = { limit: 50, offset: 0 };
        await favoritesService.getUserFavorites(mockUserId, params);

        expect(mockSupabase.rpc).toHaveBeenCalledWith("get_user_favorites_with_stats");
      });

      it("should return favorites with metadata", async () => {
        vi.mocked(mockSupabase.rpc).mockResolvedValue({
          data: mockFavorites,
          error: null,
        } as any);

        const params: PaginationQueryParams = { limit: 50, offset: 0 };
        const result = await favoritesService.getUserFavorites(mockUserId, params);

        expect(result.data).toEqual(mockFavorites);
        expect(result.meta.total).toBe(3);
        expect(result.meta.limit).toBe(50);
        expect(result.meta.offset).toBe(0);
      });

      it("should handle empty results gracefully", async () => {
        vi.mocked(mockSupabase.rpc).mockResolvedValue({
          data: [],
          error: null,
        } as any);

        const params: PaginationQueryParams = {};
        const result = await favoritesService.getUserFavorites(mockUserId, params);

        expect(result.data).toEqual([]);
        expect(result.meta.total).toBe(0);
      });

      it("should handle null data from database", async () => {
        vi.mocked(mockSupabase.rpc).mockResolvedValue({
          data: null,
          error: null,
        } as any);

        const params: PaginationQueryParams = {};
        const result = await favoritesService.getUserFavorites(mockUserId, params);

        expect(result.data).toEqual([]);
        expect(result.meta.total).toBe(0);
      });
    });

    describe("Pagination", () => {
      it("should apply pagination correctly", async () => {
        vi.mocked(mockSupabase.rpc).mockResolvedValue({
          data: mockFavorites,
          error: null,
        } as any);

        const params: PaginationQueryParams = { limit: 2, offset: 1 };
        const result = await favoritesService.getUserFavorites(mockUserId, params);

        expect(result.data).toEqual([mockFavorites[1], mockFavorites[2]]);
        expect(result.meta.total).toBe(3);
        expect(result.meta.limit).toBe(2);
        expect(result.meta.offset).toBe(1);
      });

      it("should use default pagination when not provided", async () => {
        vi.mocked(mockSupabase.rpc).mockResolvedValue({
          data: mockFavorites,
          error: null,
        } as any);

        const params: PaginationQueryParams = {};
        const result = await favoritesService.getUserFavorites(mockUserId, params);

        expect(result.meta.limit).toBe(50);
        expect(result.meta.offset).toBe(0);
      });

      it("should handle offset beyond total records", async () => {
        vi.mocked(mockSupabase.rpc).mockResolvedValue({
          data: mockFavorites,
          error: null,
        } as any);

        const params: PaginationQueryParams = { offset: 100 };
        const result = await favoritesService.getUserFavorites(mockUserId, params);

        expect(result.data).toEqual([]);
        expect(result.meta.total).toBe(3);
      });

      it("should handle limit larger than total records", async () => {
        vi.mocked(mockSupabase.rpc).mockResolvedValue({
          data: mockFavorites,
          error: null,
        } as any);

        const params: PaginationQueryParams = { limit: 100 };
        const result = await favoritesService.getUserFavorites(mockUserId, params);

        expect(result.data).toEqual(mockFavorites);
        expect(result.meta.total).toBe(3);
      });
    });

    describe("Polish characters support", () => {
      it("should handle favorites with Polish characters", async () => {
        const polishFavorites: FavoriteWithStatsDTO[] = [
          {
            id: "1",
            ward_name: "Oddział Ginekologiczno-Położniczy",
            created_at: "2024-01-01T10:00:00Z",
            hospital_count: 2,
            total_available_places: 10,
            last_scraped_at: "2024-01-15T10:00:00Z",
          },
        ];

        vi.mocked(mockSupabase.rpc).mockResolvedValue({
          data: polishFavorites,
          error: null,
        } as any);

        const params: PaginationQueryParams = {};
        const result = await favoritesService.getUserFavorites(mockUserId, params);

        expect(result.data[0].ward_name).toBe("Oddział Ginekologiczno-Położniczy");
      });
    });

    describe("Error handling", () => {
      it("should throw ServiceError when database query fails", async () => {
        vi.mocked(mockSupabase.rpc).mockResolvedValue({
          data: null,
          error: { message: "Database connection error", code: "PGRST301" },
        } as any);

        const params: PaginationQueryParams = {};

        await expect(favoritesService.getUserFavorites(mockUserId, params)).rejects.toThrow(ServiceError);
        await expect(favoritesService.getUserFavorites(mockUserId, params)).rejects.toThrow(
          "Failed to fetch favorites from database"
        );
      });

      it("should throw ServiceError with DATABASE_ERROR code", async () => {
        vi.mocked(mockSupabase.rpc).mockResolvedValue({
          data: null,
          error: { message: "Invalid RPC call", code: "PGRST302" },
        } as any);

        const params: PaginationQueryParams = {};

        try {
          await favoritesService.getUserFavorites(mockUserId, params);
          expect.fail("Should have thrown an error");
        } catch (error) {
          expect(error).toBeInstanceOf(ServiceError);
          expect((error as ServiceError).code).toBe("DATABASE_ERROR");
        }
      });

      it("should wrap unexpected errors as ServiceError", async () => {
        vi.mocked(mockSupabase.rpc).mockRejectedValue(new Error("Unexpected error"));

        const params: PaginationQueryParams = {};

        try {
          await favoritesService.getUserFavorites(mockUserId, params);
          expect.fail("Should have thrown an error");
        } catch (error) {
          expect(error).toBeInstanceOf(ServiceError);
          expect((error as ServiceError).code).toBe("INTERNAL_ERROR");
          expect((error as ServiceError).message).toContain("unexpected error");
        }
      });
    });
  });

  describe("addFavorite", () => {
    const mockUserId = "123e4567-e89b-12d3-a456-426614174000";
    const mockCreatedFavorite: UserFavoriteDTO = {
      id: "1",
      user_id: mockUserId,
      ward_name: "Oddział Kardiologii",
      created_at: "2024-01-15T10:00:00Z",
    };

    describe("Successful favorite addition", () => {
      it("should insert favorite and return created record", async () => {
        const mockFrom = {
          insert: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: mockCreatedFavorite,
            error: null,
          }),
        };

        vi.mocked(mockSupabase.from).mockReturnValue(mockFrom as any);

        const command: AddFavoriteCommand = { ward_name: "Oddział Kardiologii" };
        const result = await favoritesService.addFavorite(mockUserId, command);

        expect(mockSupabase.from).toHaveBeenCalledWith("user_favorites");
        expect(mockFrom.insert).toHaveBeenCalledWith({
          user_id: mockUserId,
          ward_name: "Oddział Kardiologii",
        });
        expect(result).toEqual(mockCreatedFavorite);
      });

      it("should handle Polish characters in ward name", async () => {
        const polishFavorite: UserFavoriteDTO = {
          id: "1",
          user_id: mockUserId,
          ward_name: "Oddział Ginekologiczno-Położniczy",
          created_at: "2024-01-15T10:00:00Z",
        };

        const mockFrom = {
          insert: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: polishFavorite,
            error: null,
          }),
        };

        vi.mocked(mockSupabase.from).mockReturnValue(mockFrom as any);

        const command: AddFavoriteCommand = { ward_name: "Oddział Ginekologiczno-Położniczy" };
        const result = await favoritesService.addFavorite(mockUserId, command);

        expect(result.ward_name).toBe("Oddział Ginekologiczno-Położniczy");
      });
    });

    describe("Duplicate handling", () => {
      it("should throw CONFLICT error for duplicate favorite", async () => {
        const mockFrom = {
          insert: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: null,
            error: { code: "23505", message: "Duplicate key violation" },
          }),
        };

        vi.mocked(mockSupabase.from).mockReturnValue(mockFrom as any);

        const command: AddFavoriteCommand = { ward_name: "Oddział Kardiologii" };

        try {
          await favoritesService.addFavorite(mockUserId, command);
          expect.fail("Should have thrown an error");
        } catch (error) {
          expect(error).toBeInstanceOf(ServiceError);
          expect((error as ServiceError).code).toBe("CONFLICT");
          expect((error as ServiceError).message).toBe("This ward is already in your favorites");
        }
      });
    });

    describe("Error handling", () => {
      it("should throw ServiceError when insert fails", async () => {
        const mockFrom = {
          insert: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: null,
            error: { message: "Insert failed", code: "PGRST301" },
          }),
        };

        vi.mocked(mockSupabase.from).mockReturnValue(mockFrom as any);

        const command: AddFavoriteCommand = { ward_name: "Oddział Kardiologii" };

        await expect(favoritesService.addFavorite(mockUserId, command)).rejects.toThrow(ServiceError);
        await expect(favoritesService.addFavorite(mockUserId, command)).rejects.toThrow(
          "Failed to add favorite to database"
        );
      });

      it("should throw ServiceError when no data returned", async () => {
        const mockFrom = {
          insert: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: null,
            error: null,
          }),
        };

        vi.mocked(mockSupabase.from).mockReturnValue(mockFrom as any);

        const command: AddFavoriteCommand = { ward_name: "Oddział Kardiologii" };

        try {
          await favoritesService.addFavorite(mockUserId, command);
          expect.fail("Should have thrown an error");
        } catch (error) {
          expect(error).toBeInstanceOf(ServiceError);
          expect((error as ServiceError).code).toBe("INTERNAL_ERROR");
          expect((error as ServiceError).message).toBe("Failed to retrieve created favorite");
        }
      });

      it("should wrap unexpected errors as ServiceError", async () => {
        vi.mocked(mockSupabase.from).mockImplementation(() => {
          throw new Error("Unexpected error");
        });

        const command: AddFavoriteCommand = { ward_name: "Oddział Kardiologii" };

        try {
          await favoritesService.addFavorite(mockUserId, command);
          expect.fail("Should have thrown an error");
        } catch (error) {
          expect(error).toBeInstanceOf(ServiceError);
          expect((error as ServiceError).code).toBe("INTERNAL_ERROR");
          expect((error as ServiceError).message).toContain("unexpected error");
        }
      });
    });
  });

  describe("removeFavoriteByWardName", () => {
    const mockUserId = "123e4567-e89b-12d3-a456-426614174000";

    describe("Successful favorite removal", () => {
      it("should delete favorite and return true", async () => {
        const mockEq2 = vi.fn().mockResolvedValue({
          data: null,
          error: null,
          count: 1,
        });

        const mockEq1 = vi.fn().mockReturnValue({
          eq: mockEq2,
        });

        const mockDelete = vi.fn().mockReturnValue({
          eq: mockEq1,
        });

        const mockFrom = {
          delete: mockDelete,
        };

        vi.mocked(mockSupabase.from).mockReturnValue(mockFrom as any);

        const result = await favoritesService.removeFavoriteByWardName(mockUserId, "Oddział Kardiologii");

        expect(mockSupabase.from).toHaveBeenCalledWith("user_favorites");
        expect(mockDelete).toHaveBeenCalledWith({ count: "exact" });
        expect(mockEq1).toHaveBeenCalledWith("user_id", mockUserId);
        expect(mockEq2).toHaveBeenCalledWith("ward_name", "Oddział Kardiologii");
        expect(result).toBe(true);
      });

      it("should return false when favorite not found", async () => {
        const mockEq2 = vi.fn().mockResolvedValue({
          data: null,
          error: null,
          count: 0,
        });

        const mockEq1 = vi.fn().mockReturnValue({
          eq: mockEq2,
        });

        const mockDelete = vi.fn().mockReturnValue({
          eq: mockEq1,
        });

        const mockFrom = {
          delete: mockDelete,
        };

        vi.mocked(mockSupabase.from).mockReturnValue(mockFrom as any);

        const result = await favoritesService.removeFavoriteByWardName(mockUserId, "Nonexistent Ward");

        expect(result).toBe(false);
      });

      it("should return false when count is null", async () => {
        const mockEq2 = vi.fn().mockResolvedValue({
          data: null,
          error: null,
          count: null,
        });

        const mockEq1 = vi.fn().mockReturnValue({
          eq: mockEq2,
        });

        const mockDelete = vi.fn().mockReturnValue({
          eq: mockEq1,
        });

        const mockFrom = {
          delete: mockDelete,
        };

        vi.mocked(mockSupabase.from).mockReturnValue(mockFrom as any);

        const result = await favoritesService.removeFavoriteByWardName(mockUserId, "Oddział Kardiologii");

        expect(result).toBe(false);
      });

      it("should handle Polish characters in ward name", async () => {
        const mockEq2 = vi.fn().mockResolvedValue({
          data: null,
          error: null,
          count: 1,
        });

        const mockEq1 = vi.fn().mockReturnValue({
          eq: mockEq2,
        });

        const mockDelete = vi.fn().mockReturnValue({
          eq: mockEq1,
        });

        const mockFrom = {
          delete: mockDelete,
        };

        vi.mocked(mockSupabase.from).mockReturnValue(mockFrom as any);

        const result = await favoritesService.removeFavoriteByWardName(mockUserId, "Oddział Ginekologiczno-Położniczy");

        expect(mockEq2).toHaveBeenCalledWith("ward_name", "Oddział Ginekologiczno-Położniczy");
        expect(result).toBe(true);
      });
    });

    describe("Error handling", () => {
      it("should throw ServiceError when delete fails", async () => {
        const mockEq2 = vi.fn().mockResolvedValue({
          data: null,
          error: { message: "Delete failed", code: "PGRST301" },
          count: null,
        });

        const mockEq1 = vi.fn().mockReturnValue({
          eq: mockEq2,
        });

        const mockDelete = vi.fn().mockReturnValue({
          eq: mockEq1,
        });

        const mockFrom = {
          delete: mockDelete,
        };

        vi.mocked(mockSupabase.from).mockReturnValue(mockFrom as any);

        await expect(favoritesService.removeFavoriteByWardName(mockUserId, "Oddział Kardiologii")).rejects.toThrow(
          ServiceError
        );
        await expect(favoritesService.removeFavoriteByWardName(mockUserId, "Oddział Kardiologii")).rejects.toThrow(
          "Failed to remove favorite from database"
        );
      });

      it("should throw ServiceError with DATABASE_ERROR code", async () => {
        const mockEq2 = vi.fn().mockResolvedValue({
          data: null,
          error: { message: "Database error", code: "PGRST302" },
          count: null,
        });

        const mockEq1 = vi.fn().mockReturnValue({
          eq: mockEq2,
        });

        const mockDelete = vi.fn().mockReturnValue({
          eq: mockEq1,
        });

        const mockFrom = {
          delete: mockDelete,
        };

        vi.mocked(mockSupabase.from).mockReturnValue(mockFrom as any);

        try {
          await favoritesService.removeFavoriteByWardName(mockUserId, "Oddział Kardiologii");
          expect.fail("Should have thrown an error");
        } catch (error) {
          expect(error).toBeInstanceOf(ServiceError);
          expect((error as ServiceError).code).toBe("DATABASE_ERROR");
        }
      });

      it("should wrap unexpected errors as ServiceError", async () => {
        vi.mocked(mockSupabase.from).mockImplementation(() => {
          throw new Error("Unexpected error");
        });

        try {
          await favoritesService.removeFavoriteByWardName(mockUserId, "Oddział Kardiologii");
          expect.fail("Should have thrown an error");
        } catch (error) {
          expect(error).toBeInstanceOf(ServiceError);
          expect((error as ServiceError).code).toBe("INTERNAL_ERROR");
          expect((error as ServiceError).message).toContain("unexpected error");
        }
      });
    });

    describe("Edge cases", () => {
      it("should handle empty ward name", async () => {
        const mockEq2 = vi.fn().mockResolvedValue({
          data: null,
          error: null,
          count: 0,
        });

        const mockEq1 = vi.fn().mockReturnValue({
          eq: mockEq2,
        });

        const mockDelete = vi.fn().mockReturnValue({
          eq: mockEq1,
        });

        const mockFrom = {
          delete: mockDelete,
        };

        vi.mocked(mockSupabase.from).mockReturnValue(mockFrom as any);

        const result = await favoritesService.removeFavoriteByWardName(mockUserId, "");

        expect(mockEq2).toHaveBeenCalledWith("ward_name", "");
        expect(result).toBe(false);
      });

      it("should handle ward name with special characters", async () => {
        const mockEq2 = vi.fn().mockResolvedValue({
          data: null,
          error: null,
          count: 1,
        });

        const mockEq1 = vi.fn().mockReturnValue({
          eq: mockEq2,
        });

        const mockDelete = vi.fn().mockReturnValue({
          eq: mockEq1,
        });

        const mockFrom = {
          delete: mockDelete,
        };

        vi.mocked(mockSupabase.from).mockReturnValue(mockFrom as any);

        const result = await favoritesService.removeFavoriteByWardName(mockUserId, "Oddział A&E - Numer 1");

        expect(mockEq2).toHaveBeenCalledWith("ward_name", "Oddział A&E - Numer 1");
        expect(result).toBe(true);
      });
    });
  });
});
