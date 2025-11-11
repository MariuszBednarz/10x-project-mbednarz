import { describe, it, expect, vi, beforeEach } from "vitest";
import { WardsService } from "./wards.service";
import type { SupabaseClient } from "@/db/supabase.client";
import type { WardsQueryParams, WardAggregatedDTO } from "@/types";
import { ServiceError } from "@/lib/utils/error-handler";

describe("WardsService", () => {
  let mockSupabase: SupabaseClient;
  let wardsService: WardsService;

  beforeEach(() => {
    // Reset mock before each test
    mockSupabase = {
      rpc: vi.fn(),
    } as any;

    wardsService = new WardsService(mockSupabase);
  });

  describe("getWards", () => {
    const mockUserId = "123e4567-e89b-12d3-a456-426614174000";
    const mockWards: WardAggregatedDTO[] = [
      {
        wardName: "Oddział Kardiologii",
        hospitalCount: 3,
        totalPlaces: 15,
        isFavorite: true,
        lastScrapedAt: "2024-01-15T10:00:00Z",
      },
      {
        wardName: "Oddział Neurologii",
        hospitalCount: 2,
        totalPlaces: 8,
        isFavorite: false,
        lastScrapedAt: "2024-01-15T10:00:00Z",
      },
      {
        wardName: "Oddział Ortopedii",
        hospitalCount: 4,
        totalPlaces: 20,
        isFavorite: false,
        lastScrapedAt: "2024-01-15T10:00:00Z",
      },
    ];

    describe("Successful ward retrieval", () => {
      it("should call get_wards_aggregated with correct parameters", async () => {
        const params: WardsQueryParams = {
          search: "Kardiologia",
          favorites_only: false,
          limit: 25,
          offset: 0,
        };

        vi.mocked(mockSupabase.rpc).mockImplementation((fnName: string) => {
          if (fnName === "get_wards_aggregated") {
            return Promise.resolve({ data: mockWards, error: null }) as any;
          }
          if (fnName === "is_data_stale") {
            return Promise.resolve({ data: false, error: null }) as any;
          }
          if (fnName === "get_last_scrape_time") {
            return Promise.resolve({ data: "2024-01-15T10:00:00Z", error: null }) as any;
          }
          return Promise.resolve({ data: null, error: null }) as any;
        });

        await wardsService.getWards(params, mockUserId);

        expect(mockSupabase.rpc).toHaveBeenCalledWith("get_wards_aggregated", {
          p_search: "Kardiologia",
          p_user_id: mockUserId,
          p_favorites_only: false,
        });
      });

      it("should return wards with metadata", async () => {
        const params: WardsQueryParams = {
          limit: 50,
          offset: 0,
        };

        vi.mocked(mockSupabase.rpc).mockImplementation((fnName: string) => {
          if (fnName === "get_wards_aggregated") {
            return Promise.resolve({ data: mockWards, error: null }) as any;
          }
          if (fnName === "is_data_stale") {
            return Promise.resolve({ data: false, error: null }) as any;
          }
          if (fnName === "get_last_scrape_time") {
            return Promise.resolve({ data: "2024-01-15T10:00:00Z", error: null }) as any;
          }
          return Promise.resolve({ data: null, error: null }) as any;
        });

        const result = await wardsService.getWards(params, mockUserId);

        expect(result.data).toEqual(mockWards);
        expect(result.meta.total).toBe(3);
        expect(result.meta.limit).toBe(50);
        expect(result.meta.offset).toBe(0);
        expect(result.meta.lastScrapeTime).toBe("2024-01-15T10:00:00.000Z");
        expect(result.meta.isStale).toBe(false);
      });

      it("should handle null search parameter", async () => {
        const params: WardsQueryParams = {};

        vi.mocked(mockSupabase.rpc).mockImplementation((fnName: string) => {
          if (fnName === "get_wards_aggregated") {
            return Promise.resolve({ data: mockWards, error: null }) as any;
          }
          if (fnName === "is_data_stale") {
            return Promise.resolve({ data: false, error: null }) as any;
          }
          if (fnName === "get_last_scrape_time") {
            return Promise.resolve({ data: "2024-01-15T10:00:00Z", error: null }) as any;
          }
          return Promise.resolve({ data: null, error: null }) as any;
        });

        await wardsService.getWards(params, mockUserId);

        expect(mockSupabase.rpc).toHaveBeenCalledWith("get_wards_aggregated", {
          p_search: null,
          p_user_id: mockUserId,
          p_favorites_only: false,
        });
      });

      it("should handle favorites_only filter", async () => {
        const params: WardsQueryParams = {
          favorites_only: true,
        };

        const favoritesOnly = [mockWards[0]]; // Only favorite ward

        vi.mocked(mockSupabase.rpc).mockImplementation((fnName: string) => {
          if (fnName === "get_wards_aggregated") {
            return Promise.resolve({ data: favoritesOnly, error: null }) as any;
          }
          if (fnName === "is_data_stale") {
            return Promise.resolve({ data: false, error: null }) as any;
          }
          if (fnName === "get_last_scrape_time") {
            return Promise.resolve({ data: "2024-01-15T10:00:00Z", error: null }) as any;
          }
          return Promise.resolve({ data: null, error: null }) as any;
        });

        const result = await wardsService.getWards(params, mockUserId);

        expect(mockSupabase.rpc).toHaveBeenCalledWith("get_wards_aggregated", {
          p_search: null,
          p_user_id: mockUserId,
          p_favorites_only: true,
        });
        expect(result.data).toEqual(favoritesOnly);
        expect(result.meta.total).toBe(1);
      });

      it("should handle empty results gracefully", async () => {
        const params: WardsQueryParams = {};

        vi.mocked(mockSupabase.rpc).mockImplementation((fnName: string) => {
          if (fnName === "get_wards_aggregated") {
            return Promise.resolve({ data: [], error: null }) as any;
          }
          if (fnName === "is_data_stale") {
            return Promise.resolve({ data: false, error: null }) as any;
          }
          if (fnName === "get_last_scrape_time") {
            return Promise.resolve({ data: "2024-01-15T10:00:00Z", error: null }) as any;
          }
          return Promise.resolve({ data: null, error: null }) as any;
        });

        const result = await wardsService.getWards(params, mockUserId);

        expect(result.data).toEqual([]);
        expect(result.meta.total).toBe(0);
      });

      it("should handle null data from database", async () => {
        const params: WardsQueryParams = {};

        vi.mocked(mockSupabase.rpc).mockImplementation((fnName: string) => {
          if (fnName === "get_wards_aggregated") {
            return Promise.resolve({ data: null, error: null }) as any;
          }
          if (fnName === "is_data_stale") {
            return Promise.resolve({ data: false, error: null }) as any;
          }
          if (fnName === "get_last_scrape_time") {
            return Promise.resolve({ data: "2024-01-15T10:00:00Z", error: null }) as any;
          }
          return Promise.resolve({ data: null, error: null }) as any;
        });

        const result = await wardsService.getWards(params, mockUserId);

        expect(result.data).toEqual([]);
        expect(result.meta.total).toBe(0);
      });
    });

    describe("Pagination", () => {
      it("should apply pagination correctly", async () => {
        const params: WardsQueryParams = {
          limit: 2,
          offset: 1,
        };

        vi.mocked(mockSupabase.rpc).mockImplementation((fnName: string) => {
          if (fnName === "get_wards_aggregated") {
            return Promise.resolve({ data: mockWards, error: null }) as any;
          }
          if (fnName === "is_data_stale") {
            return Promise.resolve({ data: false, error: null }) as any;
          }
          if (fnName === "get_last_scrape_time") {
            return Promise.resolve({ data: "2024-01-15T10:00:00Z", error: null }) as any;
          }
          return Promise.resolve({ data: null, error: null }) as any;
        });

        const result = await wardsService.getWards(params, mockUserId);

        expect(result.data).toEqual([mockWards[1], mockWards[2]]);
        expect(result.meta.total).toBe(3);
        expect(result.meta.limit).toBe(2);
        expect(result.meta.offset).toBe(1);
      });

      it("should use default pagination when not provided", async () => {
        const params: WardsQueryParams = {};

        vi.mocked(mockSupabase.rpc).mockImplementation((fnName: string) => {
          if (fnName === "get_wards_aggregated") {
            return Promise.resolve({ data: mockWards, error: null }) as any;
          }
          if (fnName === "is_data_stale") {
            return Promise.resolve({ data: false, error: null }) as any;
          }
          if (fnName === "get_last_scrape_time") {
            return Promise.resolve({ data: "2024-01-15T10:00:00Z", error: null }) as any;
          }
          return Promise.resolve({ data: null, error: null }) as any;
        });

        const result = await wardsService.getWards(params, mockUserId);

        expect(result.meta.limit).toBe(50);
        expect(result.meta.offset).toBe(0);
      });

      it("should handle offset beyond total records", async () => {
        const params: WardsQueryParams = {
          offset: 100,
        };

        vi.mocked(mockSupabase.rpc).mockImplementation((fnName: string) => {
          if (fnName === "get_wards_aggregated") {
            return Promise.resolve({ data: mockWards, error: null }) as any;
          }
          if (fnName === "is_data_stale") {
            return Promise.resolve({ data: false, error: null }) as any;
          }
          if (fnName === "get_last_scrape_time") {
            return Promise.resolve({ data: "2024-01-15T10:00:00Z", error: null }) as any;
          }
          return Promise.resolve({ data: null, error: null }) as any;
        });

        const result = await wardsService.getWards(params, mockUserId);

        expect(result.data).toEqual([]);
        expect(result.meta.total).toBe(3);
      });
    });

    describe("Polish characters support", () => {
      it("should handle Polish characters in search query", async () => {
        const params: WardsQueryParams = {
          search: "Oddział Okulistyki",
        };

        vi.mocked(mockSupabase.rpc).mockImplementation((fnName: string) => {
          if (fnName === "get_wards_aggregated") {
            return Promise.resolve({ data: mockWards, error: null }) as any;
          }
          if (fnName === "is_data_stale") {
            return Promise.resolve({ data: false, error: null }) as any;
          }
          if (fnName === "get_last_scrape_time") {
            return Promise.resolve({ data: "2024-01-15T10:00:00Z", error: null }) as any;
          }
          return Promise.resolve({ data: null, error: null }) as any;
        });

        await wardsService.getWards(params, mockUserId);

        expect(mockSupabase.rpc).toHaveBeenCalledWith("get_wards_aggregated", {
          p_search: "Oddział Okulistyki",
          p_user_id: mockUserId,
          p_favorites_only: false,
        });
      });

      it("should handle all Polish diacritics (ąćęłńóśźż)", async () => {
        const params: WardsQueryParams = {
          search: "ąćęłńóśźż ĄĆĘŁŃÓŚŹŻ",
        };

        vi.mocked(mockSupabase.rpc).mockImplementation((fnName: string) => {
          if (fnName === "get_wards_aggregated") {
            return Promise.resolve({ data: mockWards, error: null }) as any;
          }
          if (fnName === "is_data_stale") {
            return Promise.resolve({ data: false, error: null }) as any;
          }
          if (fnName === "get_last_scrape_time") {
            return Promise.resolve({ data: "2024-01-15T10:00:00Z", error: null }) as any;
          }
          return Promise.resolve({ data: null, error: null }) as any;
        });

        await wardsService.getWards(params, mockUserId);

        expect(mockSupabase.rpc).toHaveBeenCalledWith("get_wards_aggregated", {
          p_search: "ąćęłńóśźż ĄĆĘŁŃÓŚŹŻ",
          p_user_id: mockUserId,
          p_favorites_only: false,
        });
      });
    });

    describe("Error handling", () => {
      it("should throw ServiceError when database query fails", async () => {
        const params: WardsQueryParams = {};

        vi.mocked(mockSupabase.rpc).mockResolvedValue({
          data: null,
          error: { message: "Database connection error", code: "PGRST301" },
        } as any);

        await expect(wardsService.getWards(params, mockUserId)).rejects.toThrow(ServiceError);
        await expect(wardsService.getWards(params, mockUserId)).rejects.toThrow("Failed to fetch wards from database");
      });

      it("should throw ServiceError with DATABASE_ERROR code", async () => {
        const params: WardsQueryParams = {};

        vi.mocked(mockSupabase.rpc).mockResolvedValue({
          data: null,
          error: { message: "Invalid RPC call", code: "PGRST302" },
        } as any);

        try {
          await wardsService.getWards(params, mockUserId);
          expect.fail("Should have thrown an error");
        } catch (error) {
          expect(error).toBeInstanceOf(ServiceError);
          expect((error as ServiceError).code).toBe("DATABASE_ERROR");
        }
      });

      it("should wrap unexpected errors as ServiceError", async () => {
        const params: WardsQueryParams = {};

        vi.mocked(mockSupabase.rpc).mockRejectedValue(new Error("Unexpected error"));

        try {
          await wardsService.getWards(params, mockUserId);
          expect.fail("Should have thrown an error");
        } catch (error) {
          expect(error).toBeInstanceOf(ServiceError);
          expect((error as ServiceError).code).toBe("INTERNAL_ERROR");
          expect((error as ServiceError).message).toContain("unexpected error");
        }
      });

      it("should preserve ServiceError when thrown", async () => {
        const params: WardsQueryParams = {};

        vi.mocked(mockSupabase.rpc).mockResolvedValue({
          data: null,
          error: { message: "Database error", code: "PGRST301" },
        } as any);

        try {
          await wardsService.getWards(params, mockUserId);
          expect.fail("Should have thrown an error");
        } catch (error) {
          expect(error).toBeInstanceOf(ServiceError);
        }
      });
    });

    describe("Data freshness metadata", () => {
      it("should include isStale=true when data is stale", async () => {
        const params: WardsQueryParams = {};

        vi.mocked(mockSupabase.rpc).mockImplementation((fnName: string) => {
          if (fnName === "get_wards_aggregated") {
            return Promise.resolve({ data: mockWards, error: null }) as any;
          }
          if (fnName === "is_data_stale") {
            return Promise.resolve({ data: true, error: null }) as any;
          }
          if (fnName === "get_last_scrape_time") {
            return Promise.resolve({ data: "2024-01-14T10:00:00Z", error: null }) as any;
          }
          return Promise.resolve({ data: null, error: null }) as any;
        });

        const result = await wardsService.getWards(params, mockUserId);

        expect(result.meta.isStale).toBe(true);
      });

      it("should include lastScrapeTime from database", async () => {
        const params: WardsQueryParams = {};
        const mockTime = "2024-01-15T12:30:45Z";
        const expectedTime = "2024-01-15T12:30:45.000Z"; // ISO string conversion adds milliseconds

        vi.mocked(mockSupabase.rpc).mockImplementation((fnName: string) => {
          if (fnName === "get_wards_aggregated") {
            return Promise.resolve({ data: mockWards, error: null }) as any;
          }
          if (fnName === "is_data_stale") {
            return Promise.resolve({ data: false, error: null }) as any;
          }
          if (fnName === "get_last_scrape_time") {
            return Promise.resolve({ data: mockTime, error: null }) as any;
          }
          return Promise.resolve({ data: null, error: null }) as any;
        });

        const result = await wardsService.getWards(params, mockUserId);

        expect(result.meta.lastScrapeTime).toBe(expectedTime);
      });

      it("should use current time when lastScrapeTime is null", async () => {
        const params: WardsQueryParams = {};

        vi.mocked(mockSupabase.rpc).mockImplementation((fnName: string) => {
          if (fnName === "get_wards_aggregated") {
            return Promise.resolve({ data: mockWards, error: null }) as any;
          }
          if (fnName === "is_data_stale") {
            return Promise.resolve({ data: false, error: null }) as any;
          }
          if (fnName === "get_last_scrape_time") {
            return Promise.resolve({ data: null, error: null }) as any;
          }
          return Promise.resolve({ data: null, error: null }) as any;
        });

        const result = await wardsService.getWards(params, mockUserId);

        expect(result.meta.lastScrapeTime).toBeDefined();
        expect(typeof result.meta.lastScrapeTime).toBe("string");
      });

      it("should handle isDataStale error gracefully", async () => {
        const params: WardsQueryParams = {};

        vi.mocked(mockSupabase.rpc).mockImplementation((fnName: string) => {
          if (fnName === "get_wards_aggregated") {
            return Promise.resolve({ data: mockWards, error: null }) as any;
          }
          if (fnName === "is_data_stale") {
            return Promise.resolve({ data: null, error: { message: "Error" } }) as any;
          }
          if (fnName === "get_last_scrape_time") {
            return Promise.resolve({ data: "2024-01-15T10:00:00Z", error: null }) as any;
          }
          return Promise.resolve({ data: null, error: null }) as any;
        });

        const result = await wardsService.getWards(params, mockUserId);

        expect(result.meta.isStale).toBe(false); // Graceful degradation
      });

      it("should handle getLastScrapeTime error gracefully", async () => {
        const params: WardsQueryParams = {};

        vi.mocked(mockSupabase.rpc).mockImplementation((fnName: string) => {
          if (fnName === "get_wards_aggregated") {
            return Promise.resolve({ data: mockWards, error: null }) as any;
          }
          if (fnName === "is_data_stale") {
            return Promise.resolve({ data: false, error: null }) as any;
          }
          if (fnName === "get_last_scrape_time") {
            return Promise.resolve({ data: null, error: { message: "Error" } }) as any;
          }
          return Promise.resolve({ data: null, error: null }) as any;
        });

        const result = await wardsService.getWards(params, mockUserId);

        expect(result.meta.lastScrapeTime).toBeDefined();
      });
    });
  });

  describe("isDataStale", () => {
    it("should return true when data is stale", async () => {
      vi.mocked(mockSupabase.rpc).mockResolvedValue({
        data: true,
        error: null,
      } as any);

      const result = await wardsService.isDataStale();

      expect(result).toBe(true);
      expect(mockSupabase.rpc).toHaveBeenCalledWith("is_data_stale");
    });

    it("should return false when data is fresh", async () => {
      vi.mocked(mockSupabase.rpc).mockResolvedValue({
        data: false,
        error: null,
      } as any);

      const result = await wardsService.isDataStale();

      expect(result).toBe(false);
    });

    it("should return false on database error (graceful degradation)", async () => {
      vi.mocked(mockSupabase.rpc).mockResolvedValue({
        data: null,
        error: { message: "Database error" },
      } as any);

      const result = await wardsService.isDataStale();

      expect(result).toBe(false);
    });

    it("should return false on unexpected error (graceful degradation)", async () => {
      vi.mocked(mockSupabase.rpc).mockRejectedValue(new Error("Unexpected error"));

      const result = await wardsService.isDataStale();

      expect(result).toBe(false);
    });

    it("should handle null data", async () => {
      vi.mocked(mockSupabase.rpc).mockResolvedValue({
        data: null,
        error: null,
      } as any);

      const result = await wardsService.isDataStale();

      expect(result).toBe(false);
    });
  });

  describe("getLastScrapeTime", () => {
    it("should return ISO string timestamp from database", async () => {
      const mockTime = "2024-01-15T10:00:00.000Z";

      vi.mocked(mockSupabase.rpc).mockResolvedValue({
        data: mockTime,
        error: null,
      } as any);

      const result = await wardsService.getLastScrapeTime();

      expect(result).toBe(mockTime);
      expect(mockSupabase.rpc).toHaveBeenCalledWith("get_last_scrape_time");
    });

    it("should convert timestamp to ISO string", async () => {
      const mockTime = "2024-01-15 10:00:00";

      vi.mocked(mockSupabase.rpc).mockResolvedValue({
        data: mockTime,
        error: null,
      } as any);

      const result = await wardsService.getLastScrapeTime();

      expect(result).toBeDefined();
      expect(typeof result).toBe("string");
      expect(result).toContain("2024-01-15");
    });

    it("should return null when no data exists", async () => {
      vi.mocked(mockSupabase.rpc).mockResolvedValue({
        data: null,
        error: null,
      } as any);

      const result = await wardsService.getLastScrapeTime();

      expect(result).toBeNull();
    });

    it("should return null on database error (graceful degradation)", async () => {
      vi.mocked(mockSupabase.rpc).mockResolvedValue({
        data: null,
        error: { message: "Database error" },
      } as any);

      const result = await wardsService.getLastScrapeTime();

      expect(result).toBeNull();
    });

    it("should return null on unexpected error (graceful degradation)", async () => {
      vi.mocked(mockSupabase.rpc).mockRejectedValue(new Error("Unexpected error"));

      const result = await wardsService.getLastScrapeTime();

      expect(result).toBeNull();
    });
  });
});
