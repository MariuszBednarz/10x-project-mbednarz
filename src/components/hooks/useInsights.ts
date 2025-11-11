import { useState, useEffect } from "react";
import { authenticatedFetch } from "@/lib/utils/api-client";

interface Insight {
  id: string;
  insight_text: string;
  generated_at: string;
  expires_at: string;
}

export const useInsights = () => {
  const [insight, setInsight] = useState<Insight | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInsights = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await authenticatedFetch("/api/insights/current");

        // 204 No Content = no insight available (graceful degradation)
        if (response.status === 204) {
          setInsight(null);
          return;
        }

        if (!response.ok) {
          // If insights fail, gracefully degrade (don't show error)
          setInsight(null);
          return;
        }

        const data = await response.json();
        setInsight(data.data || null);
      } catch {
        // Graceful degradation: insights are nice-to-have, not critical
        setInsight(null);
      } finally {
        setLoading(false);
      }
    };

    fetchInsights();

    // Cache insights for 24 hours (1440 minutes)
    const cacheInterval = setInterval(fetchInsights, 1000 * 60 * 60 * 24);

    return () => clearInterval(cacheInterval);
  }, []);

  return { insight, loading, error };
};
