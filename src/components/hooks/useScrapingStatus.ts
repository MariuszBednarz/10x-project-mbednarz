import { useState, useEffect } from "react";

interface ScrapingLog {
  id: string;
  status: "success" | "failure";
  started_at: string;
  completed_at: string;
  error_message?: string;
}

export const useScrapingStatus = () => {
  const [lastLog, setLastLog] = useState<ScrapingLog | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchScrapingStatus = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch latest scraping log (limit=1)
        const response = await fetch("/api/logs/scraping?limit=1&status=failure");

        // 204 No Content = no failed logs (good!)
        if (response.status === 204) {
          setLastLog(null);
          return;
        }

        if (!response.ok) {
          // If scraping logs endpoint fails, gracefully degrade
          console.warn("[useScrapingStatus] Failed to fetch scraping logs:", response.status);
          setLastLog(null);
          return;
        }

        const data = await response.json();
        const failedLogs = data.data || [];

        // If we have a failed log, set it; otherwise null
        if (failedLogs.length > 0) {
          setLastLog(failedLogs[0]);
        } else {
          setLastLog(null);
        }
      } catch (err) {
        // Graceful degradation: scraping status is nice-to-have
        console.warn("[useScrapingStatus] Error fetching scraping status:", err);
        setLastLog(null);
      } finally {
        setLoading(false);
      }
    };

    fetchScrapingStatus();

    // Cache scraping status for 30 minutes
    const cacheInterval = setInterval(fetchScrapingStatus, 1000 * 60 * 30);

    return () => clearInterval(cacheInterval);
  }, []);

  return {
    lastLog,
    hasFailed: !!lastLog && lastLog.status === "failure",
    loading,
    error,
  };
};

