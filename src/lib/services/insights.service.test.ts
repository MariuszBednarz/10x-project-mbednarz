import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { InsightsService } from "./insights.service";
import type { SupabaseClient } from "@/db/supabase.client";
import type { CurrentInsightResponseDTO } from "@/types";

describe("InsightsService", () => {
  let mockSupabase: SupabaseClient;
  let insightsService: InsightsService;

  beforeEach(() => {
    // Reset mock before each test
    mockSupabase = {
      from: vi.fn(),
    } as any;

    insightsService = new InsightsService(mockSupabase);

    // Reset Date.now mock
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-01-15T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("getCurrentInsight", () => {
    const mockInsight: CurrentInsightResponseDTO = {
      insight_text: "Największe obłożenie w oddziałach kardiologicznych",
      generated_at: "2024-01-15T06:00:00Z",
      expires_at: "2024-01-16T06:00:00Z",
    };

    describe("Successful insight retrieval", () => {
      it("should return active insight", async () => {
        const mockQuery = {
          select: vi.fn().mockReturnThis(),
          gt: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          limit: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: mockInsight,
            error: null,
          }),
        };

        vi.mocked(mockSupabase.from).mockReturnValue(mockQuery as any);

        const result = await insightsService.getCurrentInsight();

        expect(mockSupabase.from).toHaveBeenCalledWith("ai_insights");
        expect(mockQuery.select).toHaveBeenCalledWith("insight_text, generated_at, expires_at");
        expect(mockQuery.gt).toHaveBeenCalledWith("expires_at", "2024-01-15T12:00:00.000Z");
        expect(mockQuery.order).toHaveBeenCalledWith("generated_at", { ascending: false });
        expect(mockQuery.limit).toHaveBeenCalledWith(1);
        expect(result).toEqual(mockInsight);
      });

      it("should filter by expires_at greater than current time", async () => {
        const mockQuery = {
          select: vi.fn().mockReturnThis(),
          gt: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          limit: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: mockInsight,
            error: null,
          }),
        };

        vi.mocked(mockSupabase.from).mockReturnValue(mockQuery as any);

        await insightsService.getCurrentInsight();

        const expectedIsoTime = new Date("2024-01-15T12:00:00Z").toISOString();
        expect(mockQuery.gt).toHaveBeenCalledWith("expires_at", expectedIsoTime);
      });

      it("should order by generated_at descending", async () => {
        const mockQuery = {
          select: vi.fn().mockReturnThis(),
          gt: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          limit: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: mockInsight,
            error: null,
          }),
        };

        vi.mocked(mockSupabase.from).mockReturnValue(mockQuery as any);

        await insightsService.getCurrentInsight();

        expect(mockQuery.order).toHaveBeenCalledWith("generated_at", { ascending: false });
      });

      it("should limit to 1 result", async () => {
        const mockQuery = {
          select: vi.fn().mockReturnThis(),
          gt: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          limit: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: mockInsight,
            error: null,
          }),
        };

        vi.mocked(mockSupabase.from).mockReturnValue(mockQuery as any);

        await insightsService.getCurrentInsight();

        expect(mockQuery.limit).toHaveBeenCalledWith(1);
      });

      it("should handle Polish characters in insight text", async () => {
        const polishInsight: CurrentInsightResponseDTO = {
          insight_text: "Największe obłożenie w oddziałach: Kardiologia, Neurologia, Ortopedia",
          generated_at: "2024-01-15T06:00:00Z",
          expires_at: "2024-01-16T06:00:00Z",
        };

        const mockQuery = {
          select: vi.fn().mockReturnThis(),
          gt: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          limit: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: polishInsight,
            error: null,
          }),
        };

        vi.mocked(mockSupabase.from).mockReturnValue(mockQuery as any);

        const result = await insightsService.getCurrentInsight();

        expect(result?.insight_text).toBe("Największe obłożenie w oddziałach: Kardiologia, Neurologia, Ortopedia");
      });
    });

    describe("No active insight - graceful degradation", () => {
      it("should return null when no rows found (PGRST116)", async () => {
        const mockQuery = {
          select: vi.fn().mockReturnThis(),
          gt: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          limit: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: null,
            error: { code: "PGRST116", message: "No rows found" },
          }),
        };

        vi.mocked(mockSupabase.from).mockReturnValue(mockQuery as any);

        const result = await insightsService.getCurrentInsight();

        expect(result).toBeNull();
      });

      it("should return null when data is null", async () => {
        const mockQuery = {
          select: vi.fn().mockReturnThis(),
          gt: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          limit: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: null,
            error: null,
          }),
        };

        vi.mocked(mockSupabase.from).mockReturnValue(mockQuery as any);

        const result = await insightsService.getCurrentInsight();

        expect(result).toBeNull();
      });

      it("should return null when data is undefined", async () => {
        const mockQuery = {
          select: vi.fn().mockReturnThis(),
          gt: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          limit: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: undefined,
            error: null,
          }),
        };

        vi.mocked(mockSupabase.from).mockReturnValue(mockQuery as any);

        const result = await insightsService.getCurrentInsight();

        expect(result).toBeNull();
      });
    });

    describe("Error handling - graceful degradation", () => {
      it("should return null on database error", async () => {
        const mockQuery = {
          select: vi.fn().mockReturnThis(),
          gt: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          limit: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: null,
            error: { code: "PGRST301", message: "Database error" },
          }),
        };

        vi.mocked(mockSupabase.from).mockReturnValue(mockQuery as any);

        const result = await insightsService.getCurrentInsight();

        expect(result).toBeNull();
      });

      it("should return null on unexpected error", async () => {
        vi.mocked(mockSupabase.from).mockImplementation(() => {
          throw new Error("Unexpected error");
        });

        const result = await insightsService.getCurrentInsight();

        expect(result).toBeNull();
      });

      it("should not throw error on query failure", async () => {
        const mockQuery = {
          select: vi.fn().mockReturnThis(),
          gt: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          limit: vi.fn().mockReturnThis(),
          single: vi.fn().mockRejectedValue(new Error("Query failed")),
        };

        vi.mocked(mockSupabase.from).mockReturnValue(mockQuery as any);

        await expect(insightsService.getCurrentInsight()).resolves.toBeNull();
      });
    });

    describe("Timestamp handling", () => {
      it("should use current timestamp for filtering", async () => {
        const mockQuery = {
          select: vi.fn().mockReturnThis(),
          gt: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          limit: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: mockInsight,
            error: null,
          }),
        };

        vi.mocked(mockSupabase.from).mockReturnValue(mockQuery as any);

        // Set system time to specific moment
        vi.setSystemTime(new Date("2024-01-15T18:30:45Z"));

        await insightsService.getCurrentInsight();

        expect(mockQuery.gt).toHaveBeenCalledWith("expires_at", "2024-01-15T18:30:45.000Z");
      });

      it("should handle different timezones correctly", async () => {
        const mockQuery = {
          select: vi.fn().mockReturnThis(),
          gt: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          limit: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: mockInsight,
            error: null,
          }),
        };

        vi.mocked(mockSupabase.from).mockReturnValue(mockQuery as any);

        // Test with different time
        vi.setSystemTime(new Date("2024-01-16T00:00:00Z"));

        await insightsService.getCurrentInsight();

        // Should always convert to ISO string
        expect(mockQuery.gt).toHaveBeenCalledWith("expires_at", "2024-01-16T00:00:00.000Z");
      });
    });

    describe("Response structure", () => {
      it("should return all three required fields", async () => {
        const mockQuery = {
          select: vi.fn().mockReturnThis(),
          gt: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          limit: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: mockInsight,
            error: null,
          }),
        };

        vi.mocked(mockSupabase.from).mockReturnValue(mockQuery as any);

        const result = await insightsService.getCurrentInsight();

        expect(result).toHaveProperty("insight_text");
        expect(result).toHaveProperty("generated_at");
        expect(result).toHaveProperty("expires_at");
      });

      it("should preserve exact field values", async () => {
        const mockQuery = {
          select: vi.fn().mockReturnThis(),
          gt: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          limit: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: mockInsight,
            error: null,
          }),
        };

        vi.mocked(mockSupabase.from).mockReturnValue(mockQuery as any);

        const result = await insightsService.getCurrentInsight();

        expect(result?.insight_text).toBe(mockInsight.insight_text);
        expect(result?.generated_at).toBe(mockInsight.generated_at);
        expect(result?.expires_at).toBe(mockInsight.expires_at);
      });
    });

    describe("Edge cases", () => {
      it("should handle empty insight text", async () => {
        const emptyInsight: CurrentInsightResponseDTO = {
          insight_text: "",
          generated_at: "2024-01-15T06:00:00Z",
          expires_at: "2024-01-16T06:00:00Z",
        };

        const mockQuery = {
          select: vi.fn().mockReturnThis(),
          gt: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          limit: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: emptyInsight,
            error: null,
          }),
        };

        vi.mocked(mockSupabase.from).mockReturnValue(mockQuery as any);

        const result = await insightsService.getCurrentInsight();

        expect(result?.insight_text).toBe("");
      });

      it("should handle very long insight text", async () => {
        const longInsight: CurrentInsightResponseDTO = {
          insight_text: "A".repeat(1000),
          generated_at: "2024-01-15T06:00:00Z",
          expires_at: "2024-01-16T06:00:00Z",
        };

        const mockQuery = {
          select: vi.fn().mockReturnThis(),
          gt: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          limit: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: longInsight,
            error: null,
          }),
        };

        vi.mocked(mockSupabase.from).mockReturnValue(mockQuery as any);

        const result = await insightsService.getCurrentInsight();

        expect(result?.insight_text.length).toBe(1000);
      });

      it("should handle insight expiring soon", async () => {
        // Set time to 5 minutes before expiry
        vi.setSystemTime(new Date("2024-01-16T05:55:00Z"));

        const mockQuery = {
          select: vi.fn().mockReturnThis(),
          gt: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          limit: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: mockInsight,
            error: null,
          }),
        };

        vi.mocked(mockSupabase.from).mockReturnValue(mockQuery as any);

        const result = await insightsService.getCurrentInsight();

        // Should still return insight as it hasn't expired yet
        expect(result).toEqual(mockInsight);
      });

      it("should not return expired insight", async () => {
        // Set time to after expiry
        vi.setSystemTime(new Date("2024-01-16T06:01:00Z"));

        const mockQuery = {
          select: vi.fn().mockReturnThis(),
          gt: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          limit: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: null,
            error: { code: "PGRST116", message: "No rows found" },
          }),
        };

        vi.mocked(mockSupabase.from).mockReturnValue(mockQuery as any);

        const result = await insightsService.getCurrentInsight();

        expect(result).toBeNull();
      });
    });

    describe("Multiple insights scenario", () => {
      it("should return most recent insight when multiple active", async () => {
        const newerInsight: CurrentInsightResponseDTO = {
          insight_text: "Najnowszy insight",
          generated_at: "2024-01-15T10:00:00Z",
          expires_at: "2024-01-16T10:00:00Z",
        };

        const mockQuery = {
          select: vi.fn().mockReturnThis(),
          gt: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          limit: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: newerInsight,
            error: null,
          }),
        };

        vi.mocked(mockSupabase.from).mockReturnValue(mockQuery as any);

        const result = await insightsService.getCurrentInsight();

        // Should return the newer one due to order by generated_at desc
        expect(result?.insight_text).toBe("Najnowszy insight");
        expect(result?.generated_at).toBe("2024-01-15T10:00:00Z");
      });
    });
  });
});
