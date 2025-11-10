import { describe, it, expect, vi, beforeEach } from "vitest";
import { HospitalsService } from "./hospitals.service";
import type { SupabaseClient } from "@/db/supabase.client";
import type { HospitalsQueryParams, HospitalWardDTO } from "@/types";
import { ServiceError } from "@/lib/utils/error-handler";

describe("HospitalsService", () => {
  let mockSupabase: SupabaseClient;
  let hospitalsService: HospitalsService;

  beforeEach(() => {
    // Reset mock before each test
    mockSupabase = {
      from: vi.fn(),
    } as any;

    hospitalsService = new HospitalsService(mockSupabase);
  });

  describe("getHospitalsByWard", () => {
    const mockHospitals: HospitalWardDTO[] = [
      {
        id: "1",
        wardName: "Oddział Kardiologii",
        hospitalName: "Szpital Miejski",
        district: "Śródmieście",
        address: "ul. Główna 1",
        availablePlaces: "15",
        comment: "",
        lastScrapedAt: "2024-01-15T10:00:00Z",
      },
      {
        id: "2",
        wardName: "Oddział Kardiologii",
        hospitalName: "Szpital Wojewódzki",
        district: "Wola",
        address: "ul. Kolejowa 5",
        availablePlaces: "8",
        comment: "",
        lastScrapedAt: "2024-01-15T10:00:00Z",
      },
      {
        id: "3",
        wardName: "Oddział Kardiologii",
        hospitalName: "Centrum Medyczne",
        district: "Śródmieście",
        address: "ul. Centralna 10",
        availablePlaces: "20",
        comment: "",
        lastScrapedAt: "2024-01-15T10:00:00Z",
      },
    ];

    describe("Successful hospital retrieval", () => {
      it("should query hospitals by ward name", async () => {
        const mockQuery = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          range: vi.fn().mockResolvedValue({
            data: mockHospitals,
            error: null,
            count: 3,
          }),
        };

        vi.mocked(mockSupabase.from).mockReturnValue(mockQuery as any);

        const params: HospitalsQueryParams = {};
        const result = await hospitalsService.getHospitalsByWard("Oddział Kardiologii", params);

        expect(mockSupabase.from).toHaveBeenCalledWith("hospital_wards");
        expect(mockQuery.select).toHaveBeenCalledWith("*", { count: "exact" });
        expect(mockQuery.eq).toHaveBeenCalledWith("wardName", "Oddział Kardiologii");
        expect(result.data).toEqual(mockHospitals);
        expect(result.meta.total).toBe(3);
      });

      it("should handle empty results gracefully", async () => {
        const mockQuery = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          range: vi.fn().mockResolvedValue({
            data: [],
            error: null,
            count: 0,
          }),
        };

        vi.mocked(mockSupabase.from).mockReturnValue(mockQuery as any);

        const params: HospitalsQueryParams = {};
        const result = await hospitalsService.getHospitalsByWard("Nonexistent Ward", params);

        expect(result.data).toEqual([]);
        expect(result.meta.total).toBe(0);
      });

      it("should handle null data from database", async () => {
        const mockQuery = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          range: vi.fn().mockResolvedValue({
            data: null,
            error: null,
            count: 0,
          }),
        };

        vi.mocked(mockSupabase.from).mockReturnValue(mockQuery as any);

        const params: HospitalsQueryParams = {};
        const result = await hospitalsService.getHospitalsByWard("Oddział Kardiologii", params);

        expect(result.data).toEqual([]);
        expect(result.meta.total).toBe(0);
      });
    });

    describe("District filtering", () => {
      it("should filter by district when provided", async () => {
        const mockQuery = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          range: vi.fn().mockResolvedValue({
            data: [mockHospitals[0], mockHospitals[2]],
            error: null,
            count: 2,
          }),
        };

        vi.mocked(mockSupabase.from).mockReturnValue(mockQuery as any);

        const params: HospitalsQueryParams = { district: "Śródmieście" };
        const result = await hospitalsService.getHospitalsByWard("Oddział Kardiologii", params);

        expect(mockQuery.eq).toHaveBeenCalledWith("district", "Śródmieście");
        expect(result.meta.total).toBe(2);
      });

      it("should handle Polish characters in district name", async () => {
        const mockQuery = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          range: vi.fn().mockResolvedValue({
            data: [],
            error: null,
            count: 0,
          }),
        };

        vi.mocked(mockSupabase.from).mockReturnValue(mockQuery as any);

        const params: HospitalsQueryParams = { district: "Śródmieście" };
        await hospitalsService.getHospitalsByWard("Oddział Kardiologii", params);

        expect(mockQuery.eq).toHaveBeenCalledWith("district", "Śródmieście");
      });

      it("should not filter by district when not provided", async () => {
        const mockQuery = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          range: vi.fn().mockResolvedValue({
            data: mockHospitals,
            error: null,
            count: 3,
          }),
        };

        vi.mocked(mockSupabase.from).mockReturnValue(mockQuery as any);

        const params: HospitalsQueryParams = {};
        await hospitalsService.getHospitalsByWard("Oddział Kardiologii", params);

        // eq should only be called once for wardName, not for district
        expect(mockQuery.eq).toHaveBeenCalledTimes(1);
        expect(mockQuery.eq).toHaveBeenCalledWith("wardName", "Oddział Kardiologii");
      });
    });

    describe("Search filtering", () => {
      it("should filter by search query when provided", async () => {
        const mockQuery = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          ilike: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          range: vi.fn().mockResolvedValue({
            data: [mockHospitals[0]],
            error: null,
            count: 1,
          }),
        };

        vi.mocked(mockSupabase.from).mockReturnValue(mockQuery as any);

        const params: HospitalsQueryParams = { search: "Miejski" };
        const result = await hospitalsService.getHospitalsByWard("Oddział Kardiologii", params);

        expect(mockQuery.ilike).toHaveBeenCalledWith("hospitalName", "%Miejski%");
        expect(result.meta.total).toBe(1);
      });

      it("should handle Polish characters in search query", async () => {
        const mockQuery = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          ilike: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          range: vi.fn().mockResolvedValue({
            data: [],
            error: null,
            count: 0,
          }),
        };

        vi.mocked(mockSupabase.from).mockReturnValue(mockQuery as any);

        const params: HospitalsQueryParams = { search: "Łódzki" };
        await hospitalsService.getHospitalsByWard("Oddział Kardiologii", params);

        expect(mockQuery.ilike).toHaveBeenCalledWith("hospitalName", "%Łódzki%");
      });

      it("should not filter by search when not provided", async () => {
        const mockQuery = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          ilike: vi.fn(),
          order: vi.fn().mockReturnThis(),
          range: vi.fn().mockResolvedValue({
            data: mockHospitals,
            error: null,
            count: 3,
          }),
        };

        vi.mocked(mockSupabase.from).mockReturnValue(mockQuery as any);

        const params: HospitalsQueryParams = {};
        await hospitalsService.getHospitalsByWard("Oddział Kardiologii", params);

        expect(mockQuery.ilike).not.toHaveBeenCalled();
      });
    });

    describe("Sorting", () => {
      it("should sort by availablePlaces descending by default", async () => {
        const mockQuery = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          range: vi.fn().mockResolvedValue({
            data: mockHospitals,
            error: null,
            count: 3,
          }),
        };

        vi.mocked(mockSupabase.from).mockReturnValue(mockQuery as any);

        const params: HospitalsQueryParams = {};
        await hospitalsService.getHospitalsByWard("Oddział Kardiologii", params);

        expect(mockQuery.order).toHaveBeenCalledWith("availablePlaces", { ascending: false, nullsFirst: false });
      });

      it("should sort by availablePlaces when order is availablePlaces.desc", async () => {
        const mockQuery = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          range: vi.fn().mockResolvedValue({
            data: mockHospitals,
            error: null,
            count: 3,
          }),
        };

        vi.mocked(mockSupabase.from).mockReturnValue(mockQuery as any);

        const params: HospitalsQueryParams = { order: "availablePlaces.desc" };
        await hospitalsService.getHospitalsByWard("Oddział Kardiologii", params);

        expect(mockQuery.order).toHaveBeenCalledWith("availablePlaces", { ascending: false, nullsFirst: false });
      });

      it("should sort by hospitalName ascending when order is hospitalName.asc", async () => {
        const mockQuery = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          range: vi.fn().mockResolvedValue({
            data: mockHospitals,
            error: null,
            count: 3,
          }),
        };

        vi.mocked(mockSupabase.from).mockReturnValue(mockQuery as any);

        const params: HospitalsQueryParams = { order: "hospitalName.asc" };
        await hospitalsService.getHospitalsByWard("Oddział Kardiologii", params);

        expect(mockQuery.order).toHaveBeenCalledWith("hospitalName", { ascending: true });
      });
    });

    describe("Pagination", () => {
      it("should apply pagination correctly", async () => {
        const mockQuery = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          range: vi.fn().mockResolvedValue({
            data: [mockHospitals[1], mockHospitals[2]],
            error: null,
            count: 3,
          }),
        };

        vi.mocked(mockSupabase.from).mockReturnValue(mockQuery as any);

        const params: HospitalsQueryParams = { limit: 2, offset: 1 };
        const result = await hospitalsService.getHospitalsByWard("Oddział Kardiologii", params);

        expect(mockQuery.range).toHaveBeenCalledWith(1, 2); // offset, offset + limit - 1
        expect(result.meta.limit).toBe(2);
        expect(result.meta.offset).toBe(1);
      });

      it("should use default pagination when not provided", async () => {
        const mockQuery = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          range: vi.fn().mockResolvedValue({
            data: mockHospitals,
            error: null,
            count: 3,
          }),
        };

        vi.mocked(mockSupabase.from).mockReturnValue(mockQuery as any);

        const params: HospitalsQueryParams = {};
        const result = await hospitalsService.getHospitalsByWard("Oddział Kardiologii", params);

        expect(mockQuery.range).toHaveBeenCalledWith(0, 49); // 0, 0 + 50 - 1
        expect(result.meta.limit).toBe(50);
        expect(result.meta.offset).toBe(0);
      });

      it("should handle custom limit", async () => {
        const mockQuery = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          range: vi.fn().mockResolvedValue({
            data: mockHospitals,
            error: null,
            count: 3,
          }),
        };

        vi.mocked(mockSupabase.from).mockReturnValue(mockQuery as any);

        const params: HospitalsQueryParams = { limit: 10 };
        await hospitalsService.getHospitalsByWard("Oddział Kardiologii", params);

        expect(mockQuery.range).toHaveBeenCalledWith(0, 9);
      });
    });

    describe("Combined filters", () => {
      it("should apply district, search, order, and pagination together", async () => {
        const mockQuery = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          ilike: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          range: vi.fn().mockResolvedValue({
            data: [mockHospitals[0]],
            error: null,
            count: 1,
          }),
        };

        vi.mocked(mockSupabase.from).mockReturnValue(mockQuery as any);

        const params: HospitalsQueryParams = {
          district: "Śródmieście",
          search: "Miejski",
          order: "hospitalName.asc",
          limit: 10,
          offset: 0,
        };

        await hospitalsService.getHospitalsByWard("Oddział Kardiologii", params);

        expect(mockQuery.eq).toHaveBeenCalledWith("wardName", "Oddział Kardiologii");
        expect(mockQuery.eq).toHaveBeenCalledWith("district", "Śródmieście");
        expect(mockQuery.ilike).toHaveBeenCalledWith("hospitalName", "%Miejski%");
        expect(mockQuery.order).toHaveBeenCalledWith("hospitalName", { ascending: true });
        expect(mockQuery.range).toHaveBeenCalledWith(0, 9);
      });
    });

    describe("Polish characters support", () => {
      it("should handle Polish characters in ward name", async () => {
        const mockQuery = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          range: vi.fn().mockResolvedValue({
            data: [],
            error: null,
            count: 0,
          }),
        };

        vi.mocked(mockSupabase.from).mockReturnValue(mockQuery as any);

        const params: HospitalsQueryParams = {};
        await hospitalsService.getHospitalsByWard("Oddział Ginekologiczno-Położniczy", params);

        expect(mockQuery.eq).toHaveBeenCalledWith("wardName", "Oddział Ginekologiczno-Położniczy");
      });
    });

    describe("Error handling", () => {
      it("should throw ServiceError when database query fails", async () => {
        const mockQuery = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          range: vi.fn().mockResolvedValue({
            data: null,
            error: { message: "Database connection error", code: "PGRST301" },
            count: null,
          }),
        };

        vi.mocked(mockSupabase.from).mockReturnValue(mockQuery as any);

        const params: HospitalsQueryParams = {};

        await expect(hospitalsService.getHospitalsByWard("Oddział Kardiologii", params)).rejects.toThrow(ServiceError);
        await expect(hospitalsService.getHospitalsByWard("Oddział Kardiologii", params)).rejects.toThrow(
          "Failed to fetch hospitals from database"
        );
      });

      it("should throw ServiceError with DATABASE_ERROR code", async () => {
        const mockQuery = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          range: vi.fn().mockResolvedValue({
            data: null,
            error: { message: "Invalid query", code: "PGRST302" },
            count: null,
          }),
        };

        vi.mocked(mockSupabase.from).mockReturnValue(mockQuery as any);

        const params: HospitalsQueryParams = {};

        try {
          await hospitalsService.getHospitalsByWard("Oddział Kardiologii", params);
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

        const params: HospitalsQueryParams = {};

        try {
          await hospitalsService.getHospitalsByWard("Oddział Kardiologii", params);
          expect.fail("Should have thrown an error");
        } catch (error) {
          expect(error).toBeInstanceOf(ServiceError);
          expect((error as ServiceError).code).toBe("INTERNAL_ERROR");
          expect((error as ServiceError).message).toContain("unexpected error");
        }
      });
    });
  });

  describe("wardExists", () => {
    describe("Ward existence check", () => {
      it("should return true when ward exists", async () => {
        const mockQuery = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue({
            data: [{ wardName: "Oddział Kardiologii" }],
            error: null,
            count: 1,
          }),
        };

        vi.mocked(mockSupabase.from).mockReturnValue(mockQuery as any);

        const result = await hospitalsService.wardExists("Oddział Kardiologii");

        expect(mockSupabase.from).toHaveBeenCalledWith("hospital_wards");
        expect(mockQuery.select).toHaveBeenCalledWith("wardName", { count: "exact" });
        expect(mockQuery.eq).toHaveBeenCalledWith("wardName", "Oddział Kardiologii");
        expect(mockQuery.limit).toHaveBeenCalledWith(1);
        expect(result).toBe(true);
      });

      it("should return false when ward does not exist", async () => {
        const mockQuery = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue({
            data: [],
            error: null,
            count: 0,
          }),
        };

        vi.mocked(mockSupabase.from).mockReturnValue(mockQuery as any);

        const result = await hospitalsService.wardExists("Nonexistent Ward");

        expect(result).toBe(false);
      });

      it("should return false when count is null", async () => {
        const mockQuery = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue({
            data: [],
            error: null,
            count: null,
          }),
        };

        vi.mocked(mockSupabase.from).mockReturnValue(mockQuery as any);

        const result = await hospitalsService.wardExists("Oddział Kardiologii");

        expect(result).toBe(false);
      });

      it("should handle Polish characters in ward name", async () => {
        const mockQuery = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue({
            data: [{ wardName: "Oddział Ginekologiczno-Położniczy" }],
            error: null,
            count: 1,
          }),
        };

        vi.mocked(mockSupabase.from).mockReturnValue(mockQuery as any);

        const result = await hospitalsService.wardExists("Oddział Ginekologiczno-Położniczy");

        expect(mockQuery.eq).toHaveBeenCalledWith("wardName", "Oddział Ginekologiczno-Położniczy");
        expect(result).toBe(true);
      });
    });

    describe("Error handling - graceful degradation", () => {
      it("should return false when database query fails", async () => {
        const mockQuery = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue({
            data: null,
            error: { message: "Database error", code: "PGRST301" },
            count: null,
          }),
        };

        vi.mocked(mockSupabase.from).mockReturnValue(mockQuery as any);

        const result = await hospitalsService.wardExists("Oddział Kardiologii");

        expect(result).toBe(false);
      });

      it("should return false on unexpected error", async () => {
        vi.mocked(mockSupabase.from).mockImplementation(() => {
          throw new Error("Unexpected error");
        });

        const result = await hospitalsService.wardExists("Oddział Kardiologii");

        expect(result).toBe(false);
      });
    });

    describe("Edge cases", () => {
      it("should handle empty ward name", async () => {
        const mockQuery = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue({
            data: [],
            error: null,
            count: 0,
          }),
        };

        vi.mocked(mockSupabase.from).mockReturnValue(mockQuery as any);

        const result = await hospitalsService.wardExists("");

        expect(mockQuery.eq).toHaveBeenCalledWith("wardName", "");
        expect(result).toBe(false);
      });

      it("should handle ward name with special characters", async () => {
        const mockQuery = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue({
            data: [{ wardName: "Oddział A&E - Numer 1" }],
            error: null,
            count: 1,
          }),
        };

        vi.mocked(mockSupabase.from).mockReturnValue(mockQuery as any);

        const result = await hospitalsService.wardExists("Oddział A&E - Numer 1");

        expect(result).toBe(true);
      });
    });
  });
});
