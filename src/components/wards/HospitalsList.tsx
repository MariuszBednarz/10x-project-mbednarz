import { useEffect, useState, useMemo } from "react";
import { toast } from "sonner";
import { HospitalCard } from "@/components/HospitalCard/HospitalCard";
import { SearchBar } from "@/components/SearchBar/SearchBar";
import { WarningBanner } from "@/components/WarningBanner/WarningBanner";
import { AlertCircle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { HospitalWardDTO } from "@/types";
import { authenticatedFetch } from "@/lib/utils/api-client";

interface HospitalsListProps {
  wardName: string;
}

const HospitalCardSkeleton = () => <div className="h-[80px] bg-muted rounded-lg animate-pulse" />;

export const HospitalsList = ({ wardName }: HospitalsListProps) => {
  const [hospitals, setHospitals] = useState<HospitalWardDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [lastScrapeTime, setLastScrapeTime] = useState<string | null>(null);

  // Fetch hospitals by ward
  useEffect(() => {
    const fetchHospitals = async () => {
      try {
        setLoading(true);
        setError(null);

        const params = new URLSearchParams();
        params.append("limit", "100");
        params.append("offset", "0");
        params.append("order", "availablePlaces.desc");

        if (searchQuery && searchQuery.length >= 2) {
          params.append("search", searchQuery);
        }

        const response = await authenticatedFetch(
          `/api/wards/${encodeURIComponent(wardName)}/hospitals?${params.toString()}`
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const errorMessage = errorData.message || "Nie udało się pobrać listy szpitali";
          throw new Error(errorMessage);
        }

        const data = await response.json();
        setHospitals(data.data || []);
        setLastScrapeTime(data.meta?.lastScrapeTime || null);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Nie udało się pobrać listy szpitali";
        setError(errorMessage);
        toast.error("Błąd", {
          description: errorMessage,
          duration: 5000,
        });
      } finally {
        setLoading(false);
      }
    };

    const debounceTimer = setTimeout(fetchHospitals, 300);
    return () => clearTimeout(debounceTimer);
  }, [wardName, searchQuery]);

  // Calculate hours since last scrape
  const hoursSinceLastScrape = useMemo(() => {
    if (!lastScrapeTime) return 0;
    const scrapeDate = new Date(lastScrapeTime);
    const now = new Date();
    return Math.floor((now.getTime() - scrapeDate.getTime()) / (1000 * 60 * 60));
  }, [lastScrapeTime]);

  // Filter and sort hospitals by available places
  const filteredHospitals = useMemo(
    () =>
      hospitals.sort((a, b) => {
        const aPlaces = parseInt(a.availablePlaces, 10) || 0;
        const bPlaces = parseInt(b.availablePlaces, 10) || 0;
        return bPlaces - aPlaces; // Descending
      }),
    [hospitals]
  );

  const handleBackClick = () => {
    // Clear sessionStorage filters before navigating back
    sessionStorage.removeItem("wardSearchQuery");
    window.location.href = "/wards";
  };

  return (
    <div className="w-full">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="space-y-6">
          {/* Warning Banner - Show if data is stale (>12 hours) */}
          {hoursSinceLastScrape > 12 && (
            <WarningBanner hoursSinceLastScrape={hoursSinceLastScrape} sourceUrl="https://www.csrwl.pl/" />
          )}

          {/* Back Button */}
          <div>
            <Button variant="ghost" size="sm" onClick={handleBackClick} className="text-sm -ml-2">
              <ArrowLeft className="w-4 h-4 mr-1" aria-hidden="true" />
              Powrót
            </Button>
          </div>

          {/* Header */}
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Szpitale</h1>
            <p className="text-sm text-muted-foreground mt-1">{wardName}</p>
          </div>

          {/* Error Alert */}
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

          {/* Search */}
          <SearchBar placeholder="Szukaj szpitala..." value={searchQuery} onChange={setSearchQuery} />

          {/* Loading State */}
          {loading && (
            <div className="space-y-3" role="status" aria-live="polite" aria-label="Ładowanie listy szpitali">
              {Array.from({ length: 5 }).map((_, i) => (
                <HospitalCardSkeleton key={`skeleton-${i}`} />
              ))}
            </div>
          )}

          {/* Empty State */}
          {!loading && filteredHospitals.length === 0 && (
            <div className="text-center py-12 text-muted-foreground" role="status" aria-live="polite">
              {searchQuery ? (
                <div>
                  <p className="font-medium mb-1">Brak wyników</p>
                  <p className="text-sm">Nie znaleziono szpitali pasujących do &quot;{searchQuery}&quot;</p>
                </div>
              ) : (
                <div>
                  <p className="font-medium mb-1">Brak dostępnych szpitali</p>
                  <p className="text-sm">W tym oddziale nie ma dostępnych szpitali</p>
                </div>
              )}
            </div>
          )}

          {/* Hospitals List */}
          {!loading && filteredHospitals.length > 0 && (
            <div
              className="space-y-2 sm:space-y-3"
              role="list"
              aria-label={`Lista ${filteredHospitals.length} szpitali w oddziale ${wardName}`}
            >
              {filteredHospitals.map((hospital) => (
                <div key={hospital.id} role="listitem">
                  <HospitalCard
                    hospitalName={hospital.hospitalName}
                    availablePlaces={hospital.availablePlaces}
                    district={hospital.district}
                    wardLink={hospital.wardLink}
                    scrapedAt={hospital.scrapedAt}
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
