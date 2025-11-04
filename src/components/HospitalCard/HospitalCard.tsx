import { memo } from "react";
import { Hospital } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface HospitalCardProps {
  hospitalName: string;
  district: string | null;
  availablePlaces: string;
  wardLink: string | null;
  scrapedAt: string;
}

function getBadgeColor(places: string): string {
  const num = parseInt(places);
  if (isNaN(num)) return "bg-gray-500 text-white";
  if (num > 5) return "bg-green-500 text-white";
  if (num >= 1) return "bg-yellow-500 text-black";
  return "bg-red-500 text-white";
}

const HospitalCardContent = ({ hospitalName, district, availablePlaces, wardLink, scrapedAt }: HospitalCardProps) => {
  const placesNum = parseInt(availablePlaces);
  const showTooltip = !isNaN(placesNum) && placesNum <= 0;

  const formattedDate = new Date(scrapedAt).toLocaleString("pl-PL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const CardContent = (
    <Card className="p-4 space-y-2">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="bg-[#3f7a78] rounded-full p-2 flex-shrink-0">
            <Hospital className="w-6 h-6 text-white" aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-bold text-base break-words" title={hospitalName}>
              {hospitalName}
            </h3>
            <p className="text-sm text-muted-foreground">{district || "Brak danych"}</p>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <span className="text-xs text-muted-foreground">Ostatnia aktualizacja: {formattedDate}</span>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground uppercase">Miejsca</span>
          <Badge
            className={`${getBadgeColor(availablePlaces)} text-lg font-bold px-3 py-1`}
            title={showTooltip ? "Brak wolnych miejsc, oddział przepełniony" : undefined}
          >
            {availablePlaces}
          </Badge>
        </div>
      </div>
    </Card>
  );

  if (wardLink) {
    return (
      <a
        href={wardLink}
        target="_blank"
        rel="noopener noreferrer"
        className="block hover:opacity-80 transition-opacity"
        aria-label={`Otwórz stronę szpitala ${hospitalName} w nowym oknie`}
      >
        {CardContent}
      </a>
    );
  }

  return CardContent;
};

export const HospitalCard = memo(HospitalCardContent);
