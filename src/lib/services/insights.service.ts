/**
 * Insights Service
 *
 * Business logic for fetching current AI-generated insights
 *
 * @see .ai/api-implementation-plan.md Section 3.4
 */

import type { SupabaseClient } from "@/db/supabase.client";
import type { CurrentInsightResponseDTO } from "@/types";

export class InsightsService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Get current active insight (non-expired)
   *
   * Queries ai_insights table with RLS filter
   * Returns the most recent non-expired insight
   *
   * @returns Current insight or null if no active insight
   *
   * Note: Graceful degradation - returns null instead of throwing error
   */
  async getCurrentInsight(): Promise<CurrentInsightResponseDTO | null> {
    try {
      const { data, error } = await this.supabase
        .from("ai_insights")
        .select("insight_text, generated_at, expires_at")
        .gt("expires_at", new Date().toISOString())
        .order("generated_at", { ascending: false })
        .limit(1)
        .single();

      if (error) {
        // Handle "no rows" error gracefully (not an actual error)
        if (error.code === "PGRST116") {
          return null;
        }

        return null; // Graceful degradation
      }

      if (!data) {
        return null;
      }

      return {
        insight_text: data.insight_text,
        generated_at: data.generated_at,
        expires_at: data.expires_at,
      };
    } catch {
      return null; // Graceful degradation
    }
  }
}
