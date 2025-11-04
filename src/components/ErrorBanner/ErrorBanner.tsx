import { memo } from "react";
import { AlertCircle } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

interface ErrorBannerProps {
  /** Error message from the failed scraping operation */
  errorMessage?: string;
}

const ErrorBannerContent = ({ errorMessage }: ErrorBannerProps) => {
  return (
    <Alert
      variant="default"
      className="mb-4 bg-red-50 border-red-300 text-red-900 [&>svg]:text-red-600"
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
    >
      <AlertCircle className="h-4 w-4" aria-hidden="true" />
      <AlertTitle>Błąd podczas pobierania danych</AlertTitle>
      <AlertDescription className="text-red-800">
        Nie udało się pobrać najnowszych danych. Pokazujemy ostatnie dostępne dane.
        {errorMessage && (
          <>
            {" "}
            <span className="block mt-1 text-sm opacity-90">Powód: {errorMessage}</span>
          </>
        )}
      </AlertDescription>
    </Alert>
  );
};

/**
 * ErrorBanner Component - Shows when scraping failed
 *
 * Display Logic:
 * - Shows when latest scraping operation failed
 * - NOT dismissible (always visible while scraping is failing)
 * - Appears at the TOP of content (highest priority), above WarningBanner
 *
 * Accessibility (WCAG AA):
 * - role="alert" for immediate announcement
 * - aria-live="assertive" for critical errors
 * - aria-atomic="true" to read entire message
 * - aria-hidden on decorative icon
 * - Color contrast 4.5:1+ with error colors
 *
 * Usage Pattern:
 * 1. Use useScrapingStatus() hook to detect failed scraping
 * 2. Show ErrorBanner FIRST (before WarningBanner, AIInsightBanner)
 * 3. Still show data but with error context
 *
 * @example
 * const { hasFailed, lastLog } = useScrapingStatus();
 *
 * {hasFailed && (
 *   <ErrorBanner errorMessage={lastLog?.error_message} />
 * )}
 */
export const ErrorBanner = memo(ErrorBannerContent);
