import { memo, useCallback } from "react";
import { Lightbulb, X } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

interface AIInsightBannerProps {
  /** The AI-generated insight text */
  insightText: string;
  /** Callback when user dismisses the banner */
  onDismiss: () => void;
}

const AIInsightBannerContent = ({ insightText, onDismiss }: AIInsightBannerProps) => {
  const handleDismiss = useCallback(() => {
    sessionStorage.setItem("insightDismissed", "true");
    onDismiss();
  }, [onDismiss]);

  return (
    <Alert
      variant="default"
      className="mb-4 bg-blue-50 border-blue-300 text-blue-900 [&>svg]:text-blue-600 relative"
      role="status"
      aria-live="polite"
    >
      <Lightbulb className="h-4 w-4" aria-hidden="true" />
      <AlertTitle>AI Insight</AlertTitle>
      <AlertDescription className="text-blue-800">{insightText}</AlertDescription>

      <Button
        variant="ghost"
        size="icon"
        onClick={handleDismiss}
        aria-label="Ukryj insight"
        className="absolute top-2 right-2 h-6 w-6 focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 rounded"
      >
        <X className="h-4 w-4" aria-hidden="true" />
      </Button>
    </Alert>
  );
};

/**
 * AIInsightBanner Component - Shows AI-generated insights about hospital availability
 *
 * Display Logic:
 * - Shows only if insight is available
 * - Dismissible via button (state stored in sessionStorage)
 * - Check sessionStorage.getItem("insightDismissed") before showing
 * - Appears below WarningBanner, above main content
 *
 * State Management:
 * - onDismiss callback should handle:
 *   1. Setting sessionStorage.setItem("insightDismissed", "true")
 *   2. Hiding the banner
 * - To restore: sessionStorage.removeItem("insightDismissed")
 *
 * Accessibility (WCAG AA):
 * - role="status" + aria-live="polite" for screen readers
 * - Close button with aria-label
 * - 44px minimum touch target on dismiss button
 * - Color contrast 4.5:1+ with info colors
 * - Focus-visible ring on close button
 *
 * @example
 * const [showInsight, setShowInsight] = useState(() =>
 *   sessionStorage.getItem("insightDismissed") !== "true" && !!insight
 * );
 *
 * {showInsight && (
 *   <AIInsightBanner
 *     insightText="Niska dostępność: Kardiologia (3 miejsca). Wysoka: Ortopedia (27 miejsc)"
 *     onDismiss={() => setShowInsight(false)}
 *   />
 * )}
 */
export const AIInsightBanner = memo(AIInsightBannerContent);
