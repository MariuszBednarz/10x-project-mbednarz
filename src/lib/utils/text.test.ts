import { describe, it, expect } from "vitest";
import {
  truncateText,
  normalizeWardName,
  sanitizeWardName,
  decodeWardName,
  isEmptyOrWhitespace,
  getInitials,
  formatSearchQuery,
} from "./text";

describe("truncateText", () => {
  describe("Valid truncation", () => {
    it("should return original text when shorter than max length", () => {
      expect(truncateText("Short text", 30)).toBe("Short text");
    });

    it("should return original text when equal to max length", () => {
      const text = "A".repeat(30);
      expect(truncateText(text, 30)).toBe(text);
    });

    it("should truncate text longer than max length", () => {
      const text = "This is a very long text that needs truncation";
      expect(truncateText(text, 20)).toBe("This is a very long ...");
    });

    it("should use default max length of 30", () => {
      const text = "A".repeat(50);
      expect(truncateText(text)).toBe("A".repeat(30) + "...");
    });

    it("should handle Polish characters in truncation", () => {
      const text = "Oddział Ginekologiczno-Położniczy";
      expect(truncateText(text, 15)).toBe("Oddział Ginekol...");
    });
  });

  describe("Edge cases", () => {
    it("should return empty string for empty input", () => {
      expect(truncateText("", 30)).toBe("");
    });

    it("should return empty string for null input", () => {
      expect(truncateText(null as any, 30)).toBe("");
    });

    it("should return empty string for undefined input", () => {
      expect(truncateText(undefined as any, 30)).toBe("");
    });

    it("should handle max length of 0", () => {
      expect(truncateText("text", 0)).toBe("...");
    });

    it("should handle max length of 1", () => {
      expect(truncateText("text", 1)).toBe("t...");
    });

    it("should handle single character text", () => {
      expect(truncateText("A", 30)).toBe("A");
    });
  });
});

describe("normalizeWardName", () => {
  describe("Valid normalization", () => {
    it("should return trimmed ward name", () => {
      expect(normalizeWardName("  Oddział Kardiologii  ")).toBe("Oddział Kardiologii");
    });

    it("should handle Polish characters", () => {
      expect(normalizeWardName("Oddział Ginekologiczno-Położniczy")).toBe("Oddział Ginekologiczno-Położniczy");
    });

    it("should return original text if no whitespace", () => {
      expect(normalizeWardName("Oddział Kardiologii")).toBe("Oddział Kardiologii");
    });

    it("should trim leading whitespace", () => {
      expect(normalizeWardName("  Oddział Kardiologii")).toBe("Oddział Kardiologii");
    });

    it("should trim trailing whitespace", () => {
      expect(normalizeWardName("Oddział Kardiologii  ")).toBe("Oddział Kardiologii");
    });

    it("should trim tabs and newlines", () => {
      expect(normalizeWardName("\t\nOddział Kardiologii\n\t")).toBe("Oddział Kardiologii");
    });
  });

  describe("Edge cases", () => {
    it("should return empty string for empty input", () => {
      expect(normalizeWardName("")).toBe("");
    });

    it("should return empty string for null input", () => {
      expect(normalizeWardName(null as any)).toBe("");
    });

    it("should return empty string for undefined input", () => {
      expect(normalizeWardName(undefined as any)).toBe("");
    });

    it("should return empty string for whitespace only", () => {
      expect(normalizeWardName("   ")).toBe("");
    });

    it("should preserve internal spaces", () => {
      expect(normalizeWardName("Oddział    Kardiologii")).toBe("Oddział    Kardiologii");
    });
  });
});

describe("sanitizeWardName", () => {
  describe("Valid sanitization", () => {
    it("should encode basic ward name", () => {
      const result = sanitizeWardName("Oddział Kardiologii");
      expect(result).toBe("Oddzia%C5%82%20Kardiologii");
    });

    it("should encode Polish characters", () => {
      const result = sanitizeWardName("Ginekologiczno-Położniczy");
      expect(result).toContain("%C5%82"); // ł encoded
    });

    it("should encode spaces", () => {
      const result = sanitizeWardName("Oddział Test");
      expect(result).toContain("%20");
    });

    it("should encode special characters", () => {
      const result = sanitizeWardName("Oddział A&E - #1");
      expect(result).toContain("%26"); // &
      expect(result).toContain("%23"); // #
    });

    it("should trim before encoding", () => {
      const result = sanitizeWardName("  Oddział Kardiologii  ");
      expect(result).toBe("Oddzia%C5%82%20Kardiologii");
    });

    it("should encode forward slash", () => {
      const result = sanitizeWardName("Oddział/Ward");
      expect(result).toContain("%2F");
    });
  });

  describe("Edge cases", () => {
    it("should return empty string for empty input", () => {
      expect(sanitizeWardName("")).toBe("");
    });

    it("should return empty string for null input", () => {
      expect(sanitizeWardName(null as any)).toBe("");
    });

    it("should return empty string for undefined input", () => {
      expect(sanitizeWardName(undefined as any)).toBe("");
    });

    it("should handle whitespace only", () => {
      expect(sanitizeWardName("   ")).toBe("");
    });
  });
});

describe("decodeWardName", () => {
  describe("Valid decoding", () => {
    it("should decode basic URL-encoded ward name", () => {
      const result = decodeWardName("Oddzia%C5%82%20Kardiologii");
      expect(result).toBe("Oddział Kardiologii");
    });

    it("should decode Polish characters", () => {
      const result = decodeWardName("Ginekologiczno-Po%C5%82o%C5%BCniczy");
      expect(result).toBe("Ginekologiczno-Położniczy");
    });

    it("should decode spaces", () => {
      const result = decodeWardName("Oddzia%C5%82%20Test");
      expect(result).toBe("Oddział Test");
    });

    it("should decode special characters", () => {
      const result = decodeWardName("Oddzia%C5%82%20A%26E%20-%20%231");
      expect(result).toBe("Oddział A&E - #1");
    });

    it("should return original if already decoded", () => {
      const result = decodeWardName("Oddział Kardiologii");
      expect(result).toBe("Oddział Kardiologii");
    });
  });

  describe("Error handling", () => {
    it("should return empty string for empty input", () => {
      expect(decodeWardName("")).toBe("");
    });

    it("should return empty string for null input", () => {
      expect(decodeWardName(null as any)).toBe("");
    });

    it("should return empty string for undefined input", () => {
      expect(decodeWardName(undefined as any)).toBe("");
    });

    it("should return original for malformed encoding", () => {
      const malformed = "test%";
      const result = decodeWardName(malformed);
      expect(result).toBe(malformed);
    });

    it("should return original for invalid percent encoding", () => {
      const invalid = "test%GG";
      const result = decodeWardName(invalid);
      expect(result).toBe(invalid);
    });
  });

  describe("Round-trip encoding/decoding", () => {
    it("should preserve text through encode/decode cycle", () => {
      const original = "Oddział Ginekologiczno-Położniczy";
      const encoded = sanitizeWardName(original);
      const decoded = decodeWardName(encoded);
      expect(decoded).toBe(original);
    });

    it("should handle complex Polish text", () => {
      const original = "Łódzki Oddział Okulistyki";
      const encoded = sanitizeWardName(original);
      const decoded = decodeWardName(encoded);
      expect(decoded).toBe(original);
    });

    it("should handle special characters", () => {
      const original = "Oddział A&E - #1";
      const encoded = sanitizeWardName(original);
      const decoded = decodeWardName(encoded);
      expect(decoded).toBe(original);
    });
  });
});

describe("isEmptyOrWhitespace", () => {
  describe("Empty/whitespace detection", () => {
    it("should return true for empty string", () => {
      expect(isEmptyOrWhitespace("")).toBe(true);
    });

    it("should return true for whitespace only", () => {
      expect(isEmptyOrWhitespace("   ")).toBe(true);
    });

    it("should return true for tabs only", () => {
      expect(isEmptyOrWhitespace("\t\t\t")).toBe(true);
    });

    it("should return true for newlines only", () => {
      expect(isEmptyOrWhitespace("\n\n\n")).toBe(true);
    });

    it("should return true for mixed whitespace", () => {
      expect(isEmptyOrWhitespace("  \t\n  ")).toBe(true);
    });

    it("should return false for non-empty text", () => {
      expect(isEmptyOrWhitespace("Oddział Kardiologii")).toBe(false);
    });

    it("should return false for text with surrounding whitespace", () => {
      expect(isEmptyOrWhitespace("  text  ")).toBe(false);
    });

    it("should return false for single character", () => {
      expect(isEmptyOrWhitespace("A")).toBe(false);
    });
  });

  describe("Edge cases", () => {
    it("should return true for null input", () => {
      expect(isEmptyOrWhitespace(null as any)).toBe(true);
    });

    it("should return true for undefined input", () => {
      expect(isEmptyOrWhitespace(undefined as any)).toBe(true);
    });
  });
});

describe("getInitials", () => {
  describe("Valid initials extraction", () => {
    it("should get initials from two-word name", () => {
      expect(getInitials("Oddział Kardiologii")).toBe("OK");
    });

    it("should get first two characters for single word", () => {
      expect(getInitials("Kardiologia")).toBe("KA");
    });

    it("should handle Polish characters", () => {
      expect(getInitials("Łódzki Oddział")).toBe("ŁO");
    });

    it("should convert to uppercase", () => {
      expect(getInitials("oddział kardiologii")).toBe("OK");
    });

    it("should handle three-word names", () => {
      expect(getInitials("Oddział Intensywnej Terapii")).toBe("OI");
    });

    it("should handle hyphenated words", () => {
      expect(getInitials("Ginekologiczno-Położniczy")).toBe("GI");
    });

    it("should handle single character words", () => {
      expect(getInitials("A B")).toBe("AB");
    });
  });

  describe("Edge cases", () => {
    it("should return ? for empty string", () => {
      expect(getInitials("")).toBe("?");
    });

    it("should return ? for null input", () => {
      expect(getInitials(null as any)).toBe("?");
    });

    it("should return ? for undefined input", () => {
      expect(getInitials(undefined as any)).toBe("?");
    });

    it("should handle single character name", () => {
      expect(getInitials("A")).toBe("A");
    });

    it("should handle whitespace only", () => {
      expect(getInitials("   ")).toBe("?");
    });

    it("should handle leading/trailing whitespace", () => {
      expect(getInitials("  Oddział Kardiologii  ")).toBe("OK");
    });
  });
});

describe("formatSearchQuery", () => {
  describe("Valid query formatting", () => {
    it("should return trimmed query", () => {
      expect(formatSearchQuery("  Kardiologia  ")).toBe("Kardiologia");
    });

    it("should accept query at minimum length (2 chars)", () => {
      expect(formatSearchQuery("Ka")).toBe("Ka");
    });

    it("should accept query at maximum length (100 chars)", () => {
      const query = "A".repeat(100);
      expect(formatSearchQuery(query)).toBe(query);
    });

    it("should handle Polish characters", () => {
      expect(formatSearchQuery("Łódzki")).toBe("Łódzki");
    });

    it("should preserve internal spaces", () => {
      expect(formatSearchQuery("Oddział Kardiologii")).toBe("Oddział Kardiologii");
    });
  });

  describe("Invalid queries - return undefined", () => {
    it("should return undefined for empty string", () => {
      expect(formatSearchQuery("")).toBeUndefined();
    });

    it("should return undefined for null input", () => {
      expect(formatSearchQuery(null as any)).toBeUndefined();
    });

    it("should return undefined for undefined input", () => {
      expect(formatSearchQuery(undefined as any)).toBeUndefined();
    });

    it("should return undefined for whitespace only", () => {
      expect(formatSearchQuery("   ")).toBeUndefined();
    });

    it("should return undefined for single character", () => {
      expect(formatSearchQuery("A")).toBeUndefined();
    });

    it("should return undefined for single character after trim", () => {
      expect(formatSearchQuery("  A  ")).toBeUndefined();
    });
  });

  describe("Length constraints", () => {
    it("should truncate query longer than 100 characters", () => {
      const query = "A".repeat(150);
      const result = formatSearchQuery(query);
      expect(result).toBe("A".repeat(100));
      expect(result?.length).toBe(100);
    });

    it("should truncate query at exactly 101 characters", () => {
      const query = "A".repeat(101);
      const result = formatSearchQuery(query);
      expect(result?.length).toBe(100);
    });

    it("should not truncate query at exactly 100 characters", () => {
      const query = "A".repeat(100);
      const result = formatSearchQuery(query);
      expect(result?.length).toBe(100);
    });
  });

  describe("Edge cases", () => {
    it("should handle query with tabs and newlines", () => {
      expect(formatSearchQuery("\t\nKardiologia\n\t")).toBe("Kardiologia");
    });

    it("should handle mixed case", () => {
      expect(formatSearchQuery("KaRdIoLoGiA")).toBe("KaRdIoLoGiA");
    });

    it("should handle special characters", () => {
      expect(formatSearchQuery("A&E - #1")).toBe("A&E - #1");
    });

    it("should handle numbers", () => {
      expect(formatSearchQuery("Oddział 123")).toBe("Oddział 123");
    });
  });
});
