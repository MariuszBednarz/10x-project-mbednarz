"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { toast } from "sonner";
import { WardCard } from "@/components/WardCard/WardCard";
import { SearchBar } from "@/components/SearchBar/SearchBar";
import { useFavorites } from "@/components/hooks/useFavorites";
import { useInsights } from "@/components/hooks/useInsights";
import { WarningBanner } from "@/components/WarningBanner/WarningBanner";
import { AIInsightBanner } from "@/components/AIInsightBanner/AIInsightBanner";
import type { WardAggregatedDTO } from "@/types";
import { Switch } from "@/components/ui/switch";
import { AlertCircle } from "lucide-react";
import { authenticatedFetch } from "@/lib/utils/api-client";

const WardCardSkeleton = () => <div className="h-[44px] bg-muted rounded-lg animate-pulse" />;

export const WardsList = () => {
  const [wards, setWards] = useState<WardAggregatedDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);
  const [lastScrapeTime, setLastScrapeTime] = useState<string | null>(null);
  const [showInsight, setShowInsight] = useState(false);

  const {
    favorites,
    toggleFavorite,
    isLoading: isLoadingFavorite,
    addFavorites,
  } = useFavorites({
    onError: (err) => {
      setError(err);
      toast.error(err, {
        description: "Spróbuj ponownie",
        duration: 5000,
      });
    },
    onSuccess: (msg) => {
      toast.success(msg, {
        duration: 3000,
      });
    },
  });

  const { insight } = useInsights();

  useEffect(() => {
    const isDismissed = sessionStorage.getItem("insightDismissed") === "true";
    setShowInsight(!isDismissed && !!insight);
  }, [insight]);

  useEffect(() => {
    const fetchWards = async () => {
      try {
        setLoading(true);
        setError(null);

        const params = new URLSearchParams();
        if (searchQuery && searchQuery.length >= 2) {
          params.append("search", searchQuery);
        }
        if (showOnlyFavorites) {
          params.append("favorites_only", "true");
        }

        const response = await authenticatedFetch(`/api/wards?${params.toString()}`);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const errorMessage = errorData.message || "Nie udało się pobrać listy oddziałów";
          throw new Error(errorMessage);
        }

        const data = await response.json();
        setWards(data.data || []);
        setLastScrapeTime(data.meta?.lastScrapeTime || null);

        const favoritesFromResponse = (data.data || [])
          .filter((w: WardAggregatedDTO) => w.isFavorite)
          .map((w: WardAggregatedDTO) => w.wardName);

        addFavorites(favoritesFromResponse);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Nie udało się pobrać listy oddziałów";
        setError(errorMessage);
        toast.error("Błąd", {
          description: errorMessage,
          duration: 5000,
        });
      } finally {
        setLoading(false);
      }
    };

    const debounceTimer = setTimeout(fetchWards, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery, showOnlyFavorites, addFavorites]);

  // Calculate hours since last scrape
  const hoursSinceLastScrape = useMemo(() => {
    if (!lastScrapeTime) return 0;
    const scrapeDate = new Date(lastScrapeTime);
    const now = new Date();
    return Math.floor((now.getTime() - scrapeDate.getTime()) / (1000 * 60 * 60));
  }, [lastScrapeTime]);

  const handleWardClick = useCallback((wardName: string) => {
    window.location.href = `/wards/${encodeURIComponent(wardName)}`;
  }, []);

  const handleFavoritesToggle = useCallback((checked: boolean) => {
    setShowOnlyFavorites(checked);
  }, []);

  const filteredWards = useMemo(
    () =>
      wards.sort((a, b) => {
        const aIsFav = favorites.has(a.wardName);
        const bIsFav = favorites.has(b.wardName);

        if (aIsFav !== bIsFav) {
          return aIsFav ? -1 : 1;
        }

        return a.wardName.localeCompare(b.wardName);
      }),
    [wards, favorites]
  );

  return (
    <div className="w-full min-h-screen bg-background px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <div className="w-full max-w-7xl mx-auto">
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Lista oddziałów</h1>
            <p className="text-sm text-muted-foreground mt-1">Woj. Lubelskie</p>
          </div>

          {/* Warning Banner - Show if data is stale (>12 hours) */}
          {hoursSinceLastScrape > 12 && (
            <WarningBanner hoursSinceLastScrape={hoursSinceLastScrape} sourceUrl="https://www.csrwl.pl/" />
          )}

          {/* AI Insight Banner - Show if available and not dismissed */}
          {showInsight && insight && (
            <AIInsightBanner insightText={insight.insight_text} onDismiss={() => setShowInsight(false)} />
          )}

          {error && (
            <div
              className="bg-red-50 dark:bg-red-950 border border-red-300 dark:border-red-700 text-red-800 dark:text-red-200 px-4 py-3 rounded-lg flex gap-3 items-start"
              role="alert"
              aria-live="polite"
              aria-atomic="true"
            >
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" aria-hidden="true" />
              <div>
                <p className="font-medium">Błąd</p>
                <p className="text-sm">{error}</p>
              </div>
            </div>
          )}

          <SearchBar placeholder="Szukaj oddziału..." value={searchQuery} onChange={setSearchQuery} />

          <div className="flex items-center gap-3 py-2">
            <Switch
              checked={showOnlyFavorites}
              onCheckedChange={handleFavoritesToggle}
              id="favorites-toggle"
              aria-label="Filtruj tylko do ulubionych oddziałów"
            />
            <label
              htmlFor="favorites-toggle"
              className="text-sm cursor-pointer select-none hover:underline focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary rounded px-2"
            >
              Tylko ulubione
            </label>
          </div>

          {loading && (
            <div className="space-y-2" role="status" aria-live="polite" aria-label="Ładowanie listy oddziałów">
              {Array.from({ length: 5 }).map((_, i) => (
                <WardCardSkeleton key={`skeleton-${i}`} />
              ))}
            </div>
          )}

          {!loading && filteredWards.length === 0 && (
            <div className="text-center py-12 text-muted-foreground" role="status" aria-live="polite">
              {searchQuery ? (
                <div>
                  <p className="font-medium mb-1">Brak wyników</p>
                  <p className="text-sm">Nie znaleziono oddziałów pasujących do &quot;{searchQuery}&quot;</p>
                </div>
              ) : showOnlyFavorites ? (
                <div>
                  <p className="font-medium mb-1">Brak ulubionych</p>
                  <p className="text-sm">Dodaj ulubione oddziały, aby je zobaczyć tutaj</p>
                </div>
              ) : (
                <p className="text-sm">Brak dostępnych oddziałów</p>
              )}
            </div>
          )}

          {!loading && filteredWards.length > 0 && (
            <div
              className="space-y-2 sm:space-y-3"
              role="list"
              aria-label={`Lista ${filteredWards.length} ${showOnlyFavorites ? "ulubionych" : ""} oddziałów`}
            >
              {filteredWards.map((ward) => (
                <div key={ward.wardName} role="listitem">
                  <WardCard
                    wardName={ward.wardName}
                    isFavorite={favorites.has(ward.wardName)}
                    onFavoriteToggle={toggleFavorite}
                    onClick={() => handleWardClick(ward.wardName)}
                    isLoading={isLoadingFavorite(ward.wardName)}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
