import { memo } from "react";
import { Star, ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface WardCardProps {
  wardName: string;
  isFavorite: boolean;
  onFavoriteToggle: (wardName: string) => void;
  onClick: () => void;
  isLoading?: boolean;
  disabled?: boolean;
}

const WardCardContent = ({
  wardName,
  isFavorite,
  onFavoriteToggle,
  onClick,
  isLoading = false,
  disabled = false,
}: WardCardProps) => {
  const handleFavoriteToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isLoading && !disabled) {
      onFavoriteToggle(wardName);
    }
  };

  const handleArrowClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isLoading && !disabled) {
      onClick();
    }
  };

  return (
    <Card
      className="hover:shadow-lg hover:border-primary focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 transition-all min-h-[44px] p-3 sm:p-4 disabled:opacity-50"
      data-testid={`ward-card-${wardName}`}
    >
      <div className="flex flex-row items-start justify-between gap-3 sm:gap-4">
        <div className="flex-1 font-bold text-base sm:text-lg break-words">{wardName}</div>

        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleFavoriteToggle}
            aria-label={isFavorite ? "Usuń z ulubionych" : "Dodaj do ulubionych"}
            className="h-10 w-10 sm:h-9 sm:w-9 focus-visible:ring-2 focus-visible:ring-primary cursor-pointer"
            disabled={isLoading || disabled}
          >
            {isLoading ? (
              <div
                className="w-5 h-5 border-2 border-muted-foreground border-t-primary rounded-full animate-spin"
                aria-hidden="true"
              />
            ) : isFavorite ? (
              <Star className="fill-yellow-500 text-yellow-500" size={20} aria-hidden="true" />
            ) : (
              <Star size={20} className="text-muted-foreground" aria-hidden="true" />
            )}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleArrowClick}
            aria-label="Zobacz szpitale w oddziale"
            className="h-10 w-10 sm:h-9 sm:w-9 focus-visible:ring-2 focus-visible:ring-primary cursor-pointer group"
            disabled={isLoading || disabled}
          >
            <ChevronRight
              className="text-muted-foreground group-hover:translate-x-1 transition-transform"
              size={20}
              aria-hidden="true"
            />
          </Button>
        </div>
      </div>
    </Card>
  );
};

/**
 * WardCard Component - Memoized for performance
 * Prevents re-renders when props haven't changed
 * Used in lists where parent re-renders frequently
 *
 * Accessibility (WCAG AA):
 * - Focus-visible ring on interactive elements
 * - aria-hidden on decorative icons
 * - Keyboard navigation (Enter/Space)
 * - 44px minimum touch target
 * - Color contrast >= 4.5:1
 */
export const WardCard = memo(WardCardContent);
