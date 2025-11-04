import { memo } from "react";
import { AlertTriangle } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

interface WarningBannerProps {
  hoursSinceLastScrape: number;
  sourceUrl: string;
  lastScrapeTime?: string;
}

const WarningBannerContent = ({ hoursSinceLastScrape, sourceUrl }: WarningBannerProps) => {
  return (
    <Alert
      variant="default"
      className="mb-4 bg-yellow-50 border-yellow-300 text-yellow-900 [&>svg]:text-yellow-600"
      role="status"
      aria-live="polite"
    >
      <AlertTriangle className="h-4 w-4" aria-hidden="true" />
      <AlertTitle>Dane mogą być nieaktualne</AlertTitle>
      <AlertDescription className="text-yellow-800">
        Ostatnia aktualizacja <span className="font-semibold">{hoursSinceLastScrape}h temu</span>. Sprawdź{" "}
        <a
          href={sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:no-underline font-semibold focus-visible:ring-2 focus-visible:ring-yellow-600 focus-visible:ring-offset-2 rounded px-1"
        >
          źródło
        </a>{" "}
        dla pewności.
      </AlertDescription>
    </Alert>
  );
};

/**
 * WarningBanner Component - Shows when data is stale (>12 hours old)
 *
 * Display Logic:
 * - Shows when hoursSinceLastScrape > 12
 * - NOT dismissible (always visible while stale)
 * - Appears at the top of content, below navbar
 *
 * Accessibility (WCAG AA):
 * - role="status" + aria-live="polite" for screen readers
 * - Semantic link with proper focus indicators
 * - Color contrast 4.5:1+ with warning colors
 * - aria-hidden on decorative icon
 *
 * @example
 * {hoursSinceLastScrape > 12 && (
 *   <WarningBanner
 *     hoursSinceLastScrape={14}
 *     sourceUrl="https://example.com/hospitals"
 *   />
 * )}
 */
export const WarningBanner = memo(WarningBannerContent);
