import { Search, X } from "lucide-react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { useState, useEffect } from "react";

export interface SearchBarProps {
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  minChars?: number;
  debounceMs?: number;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  placeholder,
  value,
  onChange,
  minChars = 2,
  debounceMs = 300,
}) => {
  const [localValue, setLocalValue] = useState(value);

  // Debounce logic: trigger onChange after delay or on clear
  useEffect(() => {
    const timer = setTimeout(() => {
      // Always trigger on clear (0 chars)
      if (localValue.length === 0) {
        onChange(localValue);
        return;
      }

      // Trigger only if meets minimum characters
      if (localValue.length >= minChars) {
        onChange(localValue);
      }
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [localValue, minChars, debounceMs, onChange]);

  // Update local value when external value changes
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleClear = () => {
    setLocalValue("");
    onChange("");
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalValue(e.target.value);
  };

  return (
    <div className="relative w-full">
      {/* Search icon - left side */}
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />

      {/* Input field */}
      <Input
        type="text"
        placeholder={placeholder}
        value={localValue}
        onChange={handleInputChange}
        className="pl-10 pr-10 h-[44px] text-base transition-colors duration-200"
        aria-label={placeholder}
      />

      {/* Clear button - right side */}
      {localValue && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 hover:bg-gray-100 transition-colors duration-200"
          onClick={handleClear}
          aria-label="Wyczyść wyszukiwanie"
          type="button"
        >
          <X className="w-4 h-4 text-muted-foreground" />
        </Button>
      )}
    </div>
  );
};
