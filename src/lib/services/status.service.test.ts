import { describe, it, expect, vi, beforeEach } from "vitest";
import { StatusService } from "./status.service";
import type { SupabaseClient } from "@/db/supabase.client";
import type { SystemStatusDTO } from "@/types";
import { ServiceError } from "@/lib/utils/error-handler";

describe("StatusService", () => {
  let mockSupabase: SupabaseClient;
  let statusService: StatusService;

  beforeEach(() => {
    // Reset mock before each test
    mockSupabase = {
      rpc: vi.fn(),
    } as any;

    statusService = new StatusService(mockSupabase);
  });

  describe("getSystemStatus", () => {
    const mockStatusResponse = {
      isStale: false,
      lastScrapeTime: "2024-01-15T10:00:00Z",
      hoursSinceLastScrape: 2,
      totalWards: 45,
      totalHospitals: 120,
      scrapingSuccessRate30d: 98.5,
    };

    describe("Successful status retrieval", () => {
      it("should call get_system_status RPC", async () => {
        vi.mocked(mockSupabase.rpc).mockResolvedValue({
          data: mockStatusResponse,
          error: null,
        } as any);

        await statusService.getSystemStatus();

        expect(mockSupabase.rpc).toHaveBeenCalledWith("get_system_status");
      });

      it("should return parsed system status", async () => {
        vi.mocked(mockSupabase.rpc).mockResolvedValue({
          data: mockStatusResponse,
          error: null,
        } as any);

        const result = await statusService.getSystemStatus();

        expect(result).toEqual(mockStatusResponse);
      });

      it("should parse all status fields correctly", async () => {
        vi.mocked(mockSupabase.rpc).mockResolvedValue({
          data: mockStatusResponse,
          error: null,
        } as any);

        const result = await statusService.getSystemStatus();

        expect(result.isStale).toBe(false);
        expect(result.lastScrapeTime).toBe("2024-01-15T10:00:00Z");
        expect(result.hoursSinceLastScrape).toBe(2);
        expect(result.totalWards).toBe(45);
        expect(result.totalHospitals).toBe(120);
        expect(result.scrapingSuccessRate30d).toBe(98.5);
      });

      it("should handle stale data indicator", async () => {
        const staleResponse = {
          ...mockStatusResponse,
          isStale: true,
          hoursSinceLastScrape: 15,
        };

        vi.mocked(mockSupabase.rpc).mockResolvedValue({
          data: staleResponse,
          error: null,
        } as any);

        const result = await statusService.getSystemStatus();

        expect(result.isStale).toBe(true);
        expect(result.hoursSinceLastScrape).toBe(15);
      });

      it("should handle zero values", async () => {
        const zeroResponse = {
          isStale: false,
          lastScrapeTime: "2024-01-15T10:00:00Z",
          hoursSinceLastScrape: 0,
          totalWards: 0,
          totalHospitals: 0,
          scrapingSuccessRate30d: 0,
        };

        vi.mocked(mockSupabase.rpc).mockResolvedValue({
          data: zeroResponse,
          error: null,
        } as any);

        const result = await statusService.getSystemStatus();

        expect(result.totalWards).toBe(0);
        expect(result.totalHospitals).toBe(0);
        expect(result.scrapingSuccessRate30d).toBe(0);
      });
    });

    describe("Data parsing", () => {
      it("should parse boolean field correctly", async () => {
        vi.mocked(mockSupabase.rpc).mockResolvedValue({
          data: { ...mockStatusResponse, isStale: true },
          error: null,
        } as any);

        const result = await statusService.getSystemStatus();

        expect(typeof result.isStale).toBe("boolean");
        expect(result.isStale).toBe(true);
      });

      it("should parse string field correctly", async () => {
        vi.mocked(mockSupabase.rpc).mockResolvedValue({
          data: mockStatusResponse,
          error: null,
        } as any);

        const result = await statusService.getSystemStatus();

        expect(typeof result.lastScrapeTime).toBe("string");
        expect(result.lastScrapeTime).toBe("2024-01-15T10:00:00Z");
      });

      it("should parse integer fields correctly", async () => {
        vi.mocked(mockSupabase.rpc).mockResolvedValue({
          data: mockStatusResponse,
          error: null,
        } as any);

        const result = await statusService.getSystemStatus();

        expect(typeof result.hoursSinceLastScrape).toBe("number");
        expect(typeof result.totalWards).toBe("number");
        expect(typeof result.totalHospitals).toBe("number");
        expect(Number.isInteger(result.hoursSinceLastScrape)).toBe(true);
      });

      it("should parse float field correctly", async () => {
        vi.mocked(mockSupabase.rpc).mockResolvedValue({
          data: mockStatusResponse,
          error: null,
        } as any);

        const result = await statusService.getSystemStatus();

        expect(typeof result.scrapingSuccessRate30d).toBe("number");
        expect(result.scrapingSuccessRate30d).toBe(98.5);
      });

      it("should handle missing optional fields with defaults", async () => {
        const partialResponse = {
          isStale: false,
          lastScrapeTime: "",
          hoursSinceLastScrape: 0,
          totalWards: 0,
          totalHospitals: 0,
          scrapingSuccessRate30d: 0,
        };

        vi.mocked(mockSupabase.rpc).mockResolvedValue({
          data: partialResponse,
          error: null,
        } as any);

        const result = await statusService.getSystemStatus();

        expect(result.lastScrapeTime).toBe("");
        expect(result.hoursSinceLastScrape).toBe(0);
        expect(result.totalWards).toBe(0);
        expect(result.totalHospitals).toBe(0);
        expect(result.scrapingSuccessRate30d).toBe(0);
      });

      it("should convert non-boolean to boolean", async () => {
        const response = {
          ...mockStatusResponse,
          isStale: 1 as any, // Simulate database returning number
        };

        vi.mocked(mockSupabase.rpc).mockResolvedValue({
          data: response,
          error: null,
        } as any);

        const result = await statusService.getSystemStatus();

        expect(typeof result.isStale).toBe("boolean");
        expect(result.isStale).toBe(true);
      });

      it("should convert string numbers to numbers", async () => {
        const response = {
          ...mockStatusResponse,
          totalWards: "45" as any, // Simulate database returning string
          totalHospitals: "120" as any,
        };

        vi.mocked(mockSupabase.rpc).mockResolvedValue({
          data: response,
          error: null,
        } as any);

        const result = await statusService.getSystemStatus();

        expect(typeof result.totalWards).toBe("number");
        expect(typeof result.totalHospitals).toBe("number");
        expect(result.totalWards).toBe(45);
        expect(result.totalHospitals).toBe(120);
      });
    });

    describe("Error handling", () => {
      it("should throw ServiceError when database query fails", async () => {
        vi.mocked(mockSupabase.rpc).mockResolvedValue({
          data: null,
          error: { message: "Database connection error", code: "PGRST301" },
        } as any);

        await expect(statusService.getSystemStatus()).rejects.toThrow(ServiceError);
        await expect(statusService.getSystemStatus()).rejects.toThrow("Failed to fetch system status from database");
      });

      it("should throw ServiceError with DATABASE_ERROR code", async () => {
        vi.mocked(mockSupabase.rpc).mockResolvedValue({
          data: null,
          error: { message: "Invalid RPC call", code: "PGRST302" },
        } as any);

        try {
          await statusService.getSystemStatus();
          expect.fail("Should have thrown an error");
        } catch (error) {
          expect(error).toBeInstanceOf(ServiceError);
          expect((error as ServiceError).code).toBe("DATABASE_ERROR");
        }
      });

      it("should throw ServiceError when no data returned", async () => {
        vi.mocked(mockSupabase.rpc).mockResolvedValue({
          data: null,
          error: null,
        } as any);

        try {
          await statusService.getSystemStatus();
          expect.fail("Should have thrown an error");
        } catch (error) {
          expect(error).toBeInstanceOf(ServiceError);
          expect((error as ServiceError).code).toBe("INTERNAL_ERROR");
          expect((error as ServiceError).message).toContain("no data");
        }
      });

      it("should throw ServiceError when data is undefined", async () => {
        vi.mocked(mockSupabase.rpc).mockResolvedValue({
          data: undefined,
          error: null,
        } as any);

        try {
          await statusService.getSystemStatus();
          expect.fail("Should have thrown an error");
        } catch (error) {
          expect(error).toBeInstanceOf(ServiceError);
          expect((error as ServiceError).code).toBe("INTERNAL_ERROR");
        }
      });

      it("should wrap unexpected errors as ServiceError", async () => {
        vi.mocked(mockSupabase.rpc).mockRejectedValue(new Error("Unexpected error"));

        try {
          await statusService.getSystemStatus();
          expect.fail("Should have thrown an error");
        } catch (error) {
          expect(error).toBeInstanceOf(ServiceError);
          expect((error as ServiceError).code).toBe("INTERNAL_ERROR");
          expect((error as ServiceError).message).toContain("unexpected error");
        }
      });

      it("should preserve ServiceError when thrown", async () => {
        vi.mocked(mockSupabase.rpc).mockResolvedValue({
          data: null,
          error: { message: "Database error", code: "PGRST301" },
        } as any);

        try {
          await statusService.getSystemStatus();
          expect.fail("Should have thrown an error");
        } catch (error) {
          expect(error).toBeInstanceOf(ServiceError);
          expect((error as ServiceError).code).toBe("DATABASE_ERROR");
        }
      });
    });

    describe("Edge cases", () => {
      it("should handle very large numbers", async () => {
        const largeResponse = {
          ...mockStatusResponse,
          totalWards: 999999,
          totalHospitals: 999999,
          hoursSinceLastScrape: 72000,
        };

        vi.mocked(mockSupabase.rpc).mockResolvedValue({
          data: largeResponse,
          error: null,
        } as any);

        const result = await statusService.getSystemStatus();

        expect(result.totalWards).toBe(999999);
        expect(result.totalHospitals).toBe(999999);
        expect(result.hoursSinceLastScrape).toBe(72000);
      });

      it("should handle 100% success rate", async () => {
        const perfectResponse = {
          ...mockStatusResponse,
          scrapingSuccessRate30d: 100.0,
        };

        vi.mocked(mockSupabase.rpc).mockResolvedValue({
          data: perfectResponse,
          error: null,
        } as any);

        const result = await statusService.getSystemStatus();

        expect(result.scrapingSuccessRate30d).toBe(100.0);
      });

      it("should handle 0% success rate", async () => {
        const failedResponse = {
          ...mockStatusResponse,
          scrapingSuccessRate30d: 0.0,
        };

        vi.mocked(mockSupabase.rpc).mockResolvedValue({
          data: failedResponse,
          error: null,
        } as any);

        const result = await statusService.getSystemStatus();

        expect(result.scrapingSuccessRate30d).toBe(0.0);
      });

      it("should handle fractional hours", async () => {
        const fractionalResponse = {
          ...mockStatusResponse,
          hoursSinceLastScrape: 2.5,
        };

        vi.mocked(mockSupabase.rpc).mockResolvedValue({
          data: fractionalResponse,
          error: null,
        } as any);

        const result = await statusService.getSystemStatus();

        expect(result.hoursSinceLastScrape).toBe(2.5);
      });

      it("should handle empty string timestamp", async () => {
        const emptyTimeResponse = {
          ...mockStatusResponse,
          lastScrapeTime: "",
        };

        vi.mocked(mockSupabase.rpc).mockResolvedValue({
          data: emptyTimeResponse,
          error: null,
        } as any);

        const result = await statusService.getSystemStatus();

        expect(result.lastScrapeTime).toBe("");
      });
    });

    describe("Type consistency", () => {
      it("should return object matching SystemStatusDTO interface", async () => {
        vi.mocked(mockSupabase.rpc).mockResolvedValue({
          data: mockStatusResponse,
          error: null,
        } as any);

        const result = await statusService.getSystemStatus();

        expect(result).toHaveProperty("isStale");
        expect(result).toHaveProperty("lastScrapeTime");
        expect(result).toHaveProperty("hoursSinceLastScrape");
        expect(result).toHaveProperty("totalWards");
        expect(result).toHaveProperty("totalHospitals");
        expect(result).toHaveProperty("scrapingSuccessRate30d");

        expect(typeof result.isStale).toBe("boolean");
        expect(typeof result.lastScrapeTime).toBe("string");
        expect(typeof result.hoursSinceLastScrape).toBe("number");
        expect(typeof result.totalWards).toBe("number");
        expect(typeof result.totalHospitals).toBe("number");
        expect(typeof result.scrapingSuccessRate30d).toBe("number");
      });

      it("should have exactly 6 properties", async () => {
        vi.mocked(mockSupabase.rpc).mockResolvedValue({
          data: mockStatusResponse,
          error: null,
        } as any);

        const result = await statusService.getSystemStatus();
        const keys = Object.keys(result);

        expect(keys.length).toBe(6);
      });
    });

    describe("Realistic scenarios", () => {
      it("should handle fresh data scenario", async () => {
        const freshData = {
          isStale: false,
          lastScrapeTime: new Date().toISOString(),
          hoursSinceLastScrape: 0.5,
          totalWards: 45,
          totalHospitals: 120,
          scrapingSuccessRate30d: 99.2,
        };

        vi.mocked(mockSupabase.rpc).mockResolvedValue({
          data: freshData,
          error: null,
        } as any);

        const result = await statusService.getSystemStatus();

        expect(result.isStale).toBe(false);
        expect(result.hoursSinceLastScrape).toBeLessThan(1);
        expect(result.scrapingSuccessRate30d).toBeGreaterThan(99);
      });

      it("should handle stale data scenario (>12 hours)", async () => {
        const staleData = {
          isStale: true,
          lastScrapeTime: "2024-01-14T10:00:00Z",
          hoursSinceLastScrape: 18,
          totalWards: 45,
          totalHospitals: 120,
          scrapingSuccessRate30d: 95.0,
        };

        vi.mocked(mockSupabase.rpc).mockResolvedValue({
          data: staleData,
          error: null,
        } as any);

        const result = await statusService.getSystemStatus();

        expect(result.isStale).toBe(true);
        expect(result.hoursSinceLastScrape).toBeGreaterThan(12);
      });

      it("should handle low success rate scenario", async () => {
        const lowSuccessData = {
          isStale: true,
          lastScrapeTime: "2024-01-14T10:00:00Z",
          hoursSinceLastScrape: 24,
          totalWards: 45,
          totalHospitals: 120,
          scrapingSuccessRate30d: 75.5,
        };

        vi.mocked(mockSupabase.rpc).mockResolvedValue({
          data: lowSuccessData,
          error: null,
        } as any);

        const result = await statusService.getSystemStatus();

        expect(result.scrapingSuccessRate30d).toBeLessThan(80);
      });

      it("should handle initial system state (no data yet)", async () => {
        const initialState = {
          isStale: true,
          lastScrapeTime: "",
          hoursSinceLastScrape: 0,
          totalWards: 0,
          totalHospitals: 0,
          scrapingSuccessRate30d: 0,
        };

        vi.mocked(mockSupabase.rpc).mockResolvedValue({
          data: initialState,
          error: null,
        } as any);

        const result = await statusService.getSystemStatus();

        expect(result.totalWards).toBe(0);
        expect(result.totalHospitals).toBe(0);
        expect(result.scrapingSuccessRate30d).toBe(0);
      });
    });
  });
});
