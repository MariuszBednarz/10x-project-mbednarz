import { describe, it, expect } from "vitest";
import {
  parseAvailablePlaces,
  isValidUUID,
  safeParseInt,
  safeParseBoolean,
  validateWardName,
  isValidEmail,
} from "./type-guards";

describe("parseAvailablePlaces", () => {
  describe("Valid integer strings", () => {
    it("should parse positive integer", () => {
      expect(parseAvailablePlaces("12")).toBe(12);
    });

    it("should parse negative integer", () => {
      expect(parseAvailablePlaces("-3")).toBe(-3);
    });

    it("should parse zero", () => {
      expect(parseAvailablePlaces("0")).toBe(0);
    });

    it("should parse large positive number", () => {
      expect(parseAvailablePlaces("999999")).toBe(999999);
    });

    it("should parse large negative number", () => {
      expect(parseAvailablePlaces("-999999")).toBe(-999999);
    });

    it("should parse single digit", () => {
      expect(parseAvailablePlaces("5")).toBe(5);
    });

    it("should parse integer with leading zeros", () => {
      expect(parseAvailablePlaces("007")).toBe(7);
    });

    it("should trim whitespace before parsing", () => {
      expect(parseAvailablePlaces("  12  ")).toBe(12);
    });

    it("should trim tabs before parsing", () => {
      expect(parseAvailablePlaces("\t25\t")).toBe(25);
    });

    it("should trim newlines before parsing", () => {
      expect(parseAvailablePlaces("\n10\n")).toBe(10);
    });
  });

  describe("Non-numeric values", () => {
    it("should return 0 for dash/hyphen character", () => {
      expect(parseAvailablePlaces("-")).toBe(0);
    });

    it("should return 0 for N/A", () => {
      expect(parseAvailablePlaces("N/A")).toBe(0);
    });

    it("should return 0 for empty string", () => {
      expect(parseAvailablePlaces("")).toBe(0);
    });

    it("should return 0 for whitespace only", () => {
      expect(parseAvailablePlaces("   ")).toBe(0);
    });

    it("should return 0 for tab only", () => {
      expect(parseAvailablePlaces("\t")).toBe(0);
    });

    it("should return 0 for newline only", () => {
      expect(parseAvailablePlaces("\n")).toBe(0);
    });

    it("should return 0 for text", () => {
      expect(parseAvailablePlaces("brak danych")).toBe(0);
    });

    it("should return 0 for mixed alphanumeric", () => {
      expect(parseAvailablePlaces("12abc")).toBe(0);
    });

    it("should return 0 for decimal number", () => {
      expect(parseAvailablePlaces("12.5")).toBe(0);
    });

    it("should return 0 for float number", () => {
      expect(parseAvailablePlaces("3.14")).toBe(0);
    });

    it("should return 0 for scientific notation", () => {
      expect(parseAvailablePlaces("1e10")).toBe(0);
    });
  });

  describe("Edge cases", () => {
    it("should return 0 for null (coerced to empty string)", () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(parseAvailablePlaces(null as any)).toBe(0);
    });

    it("should return 0 for undefined (coerced to empty string)", () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(parseAvailablePlaces(undefined as any)).toBe(0);
    });

    it("should return 0 for number with spaces inside", () => {
      expect(parseAvailablePlaces("1 2 3")).toBe(0);
    });

    it("should return 0 for plus sign prefix", () => {
      expect(parseAvailablePlaces("+5")).toBe(0);
    });

    it("should return 0 for comma decimal separator", () => {
      expect(parseAvailablePlaces("12,5")).toBe(0);
    });

    it("should return 0 for multiple dashes", () => {
      expect(parseAvailablePlaces("--")).toBe(0);
    });

    it("should return 0 for dash with spaces", () => {
      expect(parseAvailablePlaces(" - ")).toBe(0);
    });
  });

  describe("Polish language edge cases", () => {
    it("should return 0 for 'brak'", () => {
      expect(parseAvailablePlaces("brak")).toBe(0);
    });

    it("should return 0 for 'niedostępne'", () => {
      expect(parseAvailablePlaces("niedostępne")).toBe(0);
    });

    it("should return 0 for Polish characters", () => {
      expect(parseAvailablePlaces("ąćęłńóśźż")).toBe(0);
    });
  });

  describe("Security - injection attempts", () => {
    it("should return 0 for SQL injection attempt", () => {
      expect(parseAvailablePlaces("'; DROP TABLE--")).toBe(0);
    });

    it("should return 0 for XSS attempt", () => {
      expect(parseAvailablePlaces("<script>alert(1)</script>")).toBe(0);
    });
  });
});

describe("isValidUUID (type-guards version)", () => {
  describe("Valid UUID v4", () => {
    it("should accept valid UUID v4", () => {
      expect(isValidUUID("550e8400-e29b-41d4-a716-446655440000")).toBe(true);
    });

    it("should accept UUID v4 with lowercase", () => {
      expect(isValidUUID("a1b2c3d4-e5f6-4123-8abc-def012345678")).toBe(true);
    });

    it("should accept UUID v4 with uppercase", () => {
      expect(isValidUUID("A1B2C3D4-E5F6-4123-8ABC-DEF012345678")).toBe(true);
    });

    it("should accept UUID v4 with mixed case", () => {
      expect(isValidUUID("AaBbCcDd-EeFf-4123-8AbC-DeF012345678")).toBe(true);
    });

    it("should validate version field (4)", () => {
      expect(isValidUUID("12345678-1234-4567-8901-234567890123")).toBe(true);
    });

    it("should validate variant field (8/9/a/b)", () => {
      expect(isValidUUID("12345678-1234-4567-8901-234567890123")).toBe(true);
      expect(isValidUUID("12345678-1234-4567-9901-234567890123")).toBe(true);
      expect(isValidUUID("12345678-1234-4567-a901-234567890123")).toBe(true);
      expect(isValidUUID("12345678-1234-4567-b901-234567890123")).toBe(true);
    });
  });

  describe("Invalid UUID v4 - version mismatch", () => {
    it("should reject UUID v1 (version 1)", () => {
      expect(isValidUUID("550e8400-e29b-11d4-a716-446655440000")).toBe(false);
    });

    it("should reject UUID v3 (version 3)", () => {
      expect(isValidUUID("550e8400-e29b-31d4-a716-446655440000")).toBe(false);
    });

    it("should reject UUID v5 (version 5)", () => {
      expect(isValidUUID("550e8400-e29b-51d4-a716-446655440000")).toBe(false);
    });

    it("should reject UUID with invalid version (0)", () => {
      expect(isValidUUID("550e8400-e29b-01d4-a716-446655440000")).toBe(false);
    });
  });

  describe("Invalid UUID v4 - variant mismatch", () => {
    it("should reject UUID with invalid variant (0-7)", () => {
      expect(isValidUUID("12345678-1234-4567-0901-234567890123")).toBe(false);
      expect(isValidUUID("12345678-1234-4567-7901-234567890123")).toBe(false);
    });

    it("should reject UUID with invalid variant (c-f)", () => {
      expect(isValidUUID("12345678-1234-4567-c901-234567890123")).toBe(false);
      expect(isValidUUID("12345678-1234-4567-f901-234567890123")).toBe(false);
    });
  });

  describe("Invalid UUID - format", () => {
    it("should reject empty string", () => {
      expect(isValidUUID("")).toBe(false);
    });

    it("should reject UUID without dashes", () => {
      expect(isValidUUID("550e8400e29b41d4a716446655440000")).toBe(false);
    });

    it("should reject UUID with wrong segment lengths", () => {
      expect(isValidUUID("550e840-e29b-41d4-a716-446655440000")).toBe(false);
    });

    it("should reject short UUID", () => {
      expect(isValidUUID("550e8400-e29b-41d4-a716")).toBe(false);
    });

    it("should reject long UUID", () => {
      expect(isValidUUID("550e8400-e29b-41d4-a716-446655440000-extra")).toBe(false);
    });

    it("should reject UUID with invalid hex characters", () => {
      expect(isValidUUID("550e8400-e29b-41d4-a716-44665544000g")).toBe(false);
    });
  });

  describe("Security - injection attempts", () => {
    it("should reject SQL injection", () => {
      expect(isValidUUID("'; DROP TABLE--")).toBe(false);
    });

    it("should reject XSS attempt", () => {
      expect(isValidUUID("<script>alert(1)</script>")).toBe(false);
    });
  });

  describe("Edge cases", () => {
    it("should reject null (coerced to string)", () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(isValidUUID(null as any)).toBe(false);
    });

    it("should reject undefined (coerced to string)", () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(isValidUUID(undefined as any)).toBe(false);
    });

    it("should reject number", () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(isValidUUID(123 as any)).toBe(false);
    });
  });
});

describe("safeParseInt", () => {
  describe("Valid integer strings", () => {
    it("should parse valid integer", () => {
      expect(safeParseInt("50", 10)).toBe(50);
    });

    it("should parse zero", () => {
      expect(safeParseInt("0", 10)).toBe(0);
    });

    it("should parse negative integer", () => {
      expect(safeParseInt("-25", 10)).toBe(-25);
    });

    it("should parse large integer", () => {
      expect(safeParseInt("999999", 0)).toBe(999999);
    });

    it("should parse integer with leading zeros", () => {
      expect(safeParseInt("007", 10)).toBe(7);
    });

    it("should parse integer from decimal string (truncates)", () => {
      expect(safeParseInt("50.99", 10)).toBe(50);
    });
  });

  describe("Invalid inputs - return default", () => {
    it("should return default for invalid string", () => {
      expect(safeParseInt("invalid", 10)).toBe(10);
    });

    it("should return default for empty string", () => {
      expect(safeParseInt("", 10)).toBe(10);
    });

    it("should return default for null", () => {
      expect(safeParseInt(null, 10)).toBe(10);
    });

    it("should return default for undefined", () => {
      expect(safeParseInt(undefined, 10)).toBe(10);
    });

    it("should return default for whitespace only", () => {
      expect(safeParseInt("   ", 10)).toBe(10);
    });

    it("should return default for non-numeric string", () => {
      expect(safeParseInt("abc", 100)).toBe(100);
    });

    it("should parse number from mixed alphanumeric (parseInt behavior)", () => {
      // parseInt stops at first non-numeric character
      expect(safeParseInt("12abc", 10)).toBe(12);
    });
  });

  describe("Default values", () => {
    it("should work with default value 0", () => {
      expect(safeParseInt("invalid", 0)).toBe(0);
    });

    it("should work with negative default value", () => {
      expect(safeParseInt("invalid", -1)).toBe(-1);
    });

    it("should work with large default value", () => {
      expect(safeParseInt("", 999999)).toBe(999999);
    });
  });

  describe("Edge cases", () => {
    it("should handle NaN result", () => {
      expect(safeParseInt("NaN", 10)).toBe(10);
    });

    it("should handle Infinity string", () => {
      expect(safeParseInt("Infinity", 10)).toBe(10);
    });

    it("should handle scientific notation (parses base)", () => {
      expect(safeParseInt("1e10", 10)).toBe(1); // parseInt stops at 'e'
    });

    it("should handle hex string (parses decimal)", () => {
      expect(safeParseInt("0xFF", 10)).toBe(0); // parseInt with base 10
    });
  });
});

describe("safeParseBoolean", () => {
  describe("True values", () => {
    it("should parse 'true' as true", () => {
      expect(safeParseBoolean("true", false)).toBe(true);
    });

    it("should parse 'TRUE' as true (case insensitive)", () => {
      expect(safeParseBoolean("TRUE", false)).toBe(true);
    });

    it("should parse 'True' as true (mixed case)", () => {
      expect(safeParseBoolean("True", false)).toBe(true);
    });

    it("should parse '1' as true", () => {
      expect(safeParseBoolean("1", false)).toBe(true);
    });

    it("should parse 'true' with whitespace as true", () => {
      expect(safeParseBoolean("  true  ", false)).toBe(true);
    });

    it("should parse '1' with whitespace as true", () => {
      expect(safeParseBoolean("  1  ", false)).toBe(true);
    });
  });

  describe("False values", () => {
    it("should parse 'false' as false", () => {
      expect(safeParseBoolean("false", true)).toBe(false);
    });

    it("should parse 'FALSE' as false (case insensitive)", () => {
      expect(safeParseBoolean("FALSE", true)).toBe(false);
    });

    it("should parse 'False' as false (mixed case)", () => {
      expect(safeParseBoolean("False", true)).toBe(false);
    });

    it("should parse '0' as false", () => {
      expect(safeParseBoolean("0", true)).toBe(false);
    });

    it("should parse 'false' with whitespace as false", () => {
      expect(safeParseBoolean("  false  ", true)).toBe(false);
    });

    it("should parse '0' with whitespace as false", () => {
      expect(safeParseBoolean("  0  ", true)).toBe(false);
    });
  });

  describe("Invalid inputs - return default", () => {
    it("should return default for 'yes'", () => {
      expect(safeParseBoolean("yes", false)).toBe(false);
    });

    it("should return default for 'no'", () => {
      expect(safeParseBoolean("no", true)).toBe(true);
    });

    it("should return default for 'on'", () => {
      expect(safeParseBoolean("on", false)).toBe(false);
    });

    it("should return default for 'off'", () => {
      expect(safeParseBoolean("off", true)).toBe(true);
    });

    it("should return default for empty string", () => {
      expect(safeParseBoolean("", true)).toBe(true);
    });

    it("should return default for null", () => {
      expect(safeParseBoolean(null, true)).toBe(true);
    });

    it("should return default for undefined", () => {
      expect(safeParseBoolean(undefined, false)).toBe(false);
    });

    it("should return default for whitespace only", () => {
      expect(safeParseBoolean("   ", true)).toBe(true);
    });

    it("should return default for invalid string", () => {
      expect(safeParseBoolean("invalid", false)).toBe(false);
    });

    it("should return default for number 2", () => {
      expect(safeParseBoolean("2", false)).toBe(false);
    });

    it("should return default for number -1", () => {
      expect(safeParseBoolean("-1", true)).toBe(true);
    });
  });

  describe("Default values", () => {
    it("should work with default true", () => {
      expect(safeParseBoolean("invalid", true)).toBe(true);
    });

    it("should work with default false", () => {
      expect(safeParseBoolean("invalid", false)).toBe(false);
    });
  });

  describe("Edge cases", () => {
    it("should handle tabs and newlines", () => {
      expect(safeParseBoolean("\ttrue\n", false)).toBe(true);
    });

    it("should be case insensitive for all variations", () => {
      expect(safeParseBoolean("TrUe", false)).toBe(true);
      expect(safeParseBoolean("FaLsE", true)).toBe(false);
    });
  });
});

describe("validateWardName", () => {
  describe("Valid ward names", () => {
    it("should accept valid ward name", () => {
      const result = validateWardName("Kardiologia");

      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it("should accept ward name with Polish characters", () => {
      const result = validateWardName("Oddział Ginekologiczno-Położniczy");

      expect(result.isValid).toBe(true);
    });

    it("should accept all Polish diacritics", () => {
      const result = validateWardName("ąćęłńóśźż ĄĆĘŁŃÓŚŹŻ");

      expect(result.isValid).toBe(true);
    });

    it("should accept ward name with numbers", () => {
      const result = validateWardName("Oddział 123");

      expect(result.isValid).toBe(true);
    });

    it("should accept ward name with special characters", () => {
      const result = validateWardName("Oddział A&E - Numer 1");

      expect(result.isValid).toBe(true);
    });

    it("should accept single character name", () => {
      const result = validateWardName("A");

      expect(result.isValid).toBe(true);
    });

    it("should accept name at maximum length (255)", () => {
      const result = validateWardName("A".repeat(255));

      expect(result.isValid).toBe(true);
    });

    it("should accept name with internal spaces", () => {
      const result = validateWardName("Oddział    Kardiologii");

      expect(result.isValid).toBe(true);
    });
  });

  describe("Invalid ward names - empty", () => {
    it("should reject empty string", () => {
      const result = validateWardName("");

      expect(result.isValid).toBe(false);
      expect(result.error).toBe("Ward name cannot be empty");
    });

    it("should reject whitespace only", () => {
      const result = validateWardName("   ");

      expect(result.isValid).toBe(false);
      expect(result.error).toBe("Ward name cannot be empty");
    });

    it("should reject tab only", () => {
      const result = validateWardName("\t");

      expect(result.isValid).toBe(false);
      expect(result.error).toBe("Ward name cannot be empty");
    });

    it("should reject newline only", () => {
      const result = validateWardName("\n");

      expect(result.isValid).toBe(false);
      expect(result.error).toBe("Ward name cannot be empty");
    });

    it("should reject mixed whitespace", () => {
      const result = validateWardName(" \t\n ");

      expect(result.isValid).toBe(false);
      expect(result.error).toBe("Ward name cannot be empty");
    });
  });

  describe("Invalid ward names - too long", () => {
    it("should reject name exceeding 255 characters", () => {
      const result = validateWardName("A".repeat(256));

      expect(result.isValid).toBe(false);
      expect(result.error).toBe("Ward name exceeds 255 characters");
    });

    it("should reject name with 300 characters", () => {
      const result = validateWardName("A".repeat(300));

      expect(result.isValid).toBe(false);
      expect(result.error).toBe("Ward name exceeds 255 characters");
    });

    it("should reject very long name (1000+ characters)", () => {
      const result = validateWardName("A".repeat(1000));

      expect(result.isValid).toBe(false);
      expect(result.error).toBe("Ward name exceeds 255 characters");
    });
  });

  describe("Edge cases", () => {
    it("should accept name with exactly 255 characters", () => {
      const name = "A".repeat(255);
      const result = validateWardName(name);

      expect(result.isValid).toBe(true);
      expect(name.length).toBe(255);
    });

    it("should reject name with 256 characters", () => {
      const name = "A".repeat(256);
      const result = validateWardName(name);

      expect(result.isValid).toBe(false);
      expect(name.length).toBe(256);
    });

    it("should accept name with leading/trailing spaces if total valid", () => {
      // Note: validation checks BEFORE trim
      const result = validateWardName("  Kardiologia  ");

      expect(result.isValid).toBe(true);
    });

    it("should handle null (coerced to 'null' string)", () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = validateWardName(null as any);

      expect(result.isValid).toBe(false);
    });

    it("should handle undefined (coerced to 'undefined' string)", () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = validateWardName(undefined as any);

      expect(result.isValid).toBe(false);
    });
  });

  describe("Medical terminology", () => {
    it("should accept complex medical name", () => {
      const result = validateWardName("Oddział Anestezjologii i Intensywnej Terapii");

      expect(result.isValid).toBe(true);
    });

    it("should accept name with abbreviations", () => {
      const result = validateWardName("Oddział IT/OIOM");

      expect(result.isValid).toBe(true);
    });

    it("should accept name with Roman numerals", () => {
      const result = validateWardName("Oddział Kardiologii I");

      expect(result.isValid).toBe(true);
    });
  });
});

describe("isValidEmail", () => {
  describe("Valid emails", () => {
    it("should accept standard email", () => {
      expect(isValidEmail("user@example.com")).toBe(true);
    });

    it("should accept email with subdomain", () => {
      expect(isValidEmail("user@mail.example.com")).toBe(true);
    });

    it("should accept email with numbers", () => {
      expect(isValidEmail("user123@example123.com")).toBe(true);
    });

    it("should accept email with dots in local part", () => {
      expect(isValidEmail("first.last@example.com")).toBe(true);
    });

    it("should accept email with plus sign", () => {
      expect(isValidEmail("user+tag@example.com")).toBe(true);
    });

    it("should accept email with underscore", () => {
      expect(isValidEmail("user_name@example.com")).toBe(true);
    });

    it("should accept email with hyphen in domain", () => {
      expect(isValidEmail("user@my-domain.com")).toBe(true);
    });

    it("should accept short email", () => {
      expect(isValidEmail("a@b.c")).toBe(true);
    });

    it("should accept email with long TLD", () => {
      expect(isValidEmail("user@example.community")).toBe(true);
    });
  });

  describe("Invalid emails", () => {
    it("should reject email without @", () => {
      expect(isValidEmail("userexample.com")).toBe(false);
    });

    it("should reject email without domain", () => {
      expect(isValidEmail("user@")).toBe(false);
    });

    it("should reject email without local part", () => {
      expect(isValidEmail("@example.com")).toBe(false);
    });

    it("should reject email without TLD", () => {
      expect(isValidEmail("user@example")).toBe(false);
    });

    it("should reject email with spaces", () => {
      expect(isValidEmail("user @example.com")).toBe(false);
    });

    it("should reject empty string", () => {
      expect(isValidEmail("")).toBe(false);
    });

    it("should reject email with multiple @", () => {
      expect(isValidEmail("user@@example.com")).toBe(false);
    });

    it("should reject email with @ at start", () => {
      expect(isValidEmail("@user@example.com")).toBe(false);
    });

    it("should reject plain text", () => {
      expect(isValidEmail("not an email")).toBe(false);
    });
  });

  describe("Edge cases", () => {
    it("should reject whitespace only", () => {
      expect(isValidEmail("   ")).toBe(false);
    });

    it("should reject null (coerced to string)", () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(isValidEmail(null as any)).toBe(false);
    });

    it("should reject undefined (coerced to string)", () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(isValidEmail(undefined as any)).toBe(false);
    });

    it("should accept email with multiple dots in domain", () => {
      expect(isValidEmail("user@mail.example.co.uk")).toBe(true);
    });
  });

  describe("Security - injection attempts", () => {
    it("should reject SQL injection", () => {
      expect(isValidEmail("'; DROP TABLE users--")).toBe(false);
    });

    it("should reject XSS attempt", () => {
      expect(isValidEmail("<script>alert(1)</script>")).toBe(false);
    });

    it("should accept email with angle brackets (basic regex allows)", () => {
      // Basic regex /^[^\s@]+@[^\s@]+\.[^\s@]+$/ allows angle brackets
      // More strict validation would be needed to reject this
      expect(isValidEmail("user<tag>@example.com")).toBe(true);
    });
  });

  describe("Polish characters in email", () => {
    it("should accept email with Polish characters (basic regex allows)", () => {
      // Basic regex /^[^\s@]+@[^\s@]+\.[^\s@]+$/ allows Polish characters
      // It only excludes whitespace and @
      expect(isValidEmail("użytkownik@example.com")).toBe(true);
    });

    it("should accept email from Polish domain", () => {
      expect(isValidEmail("user@example.pl")).toBe(true);
    });
  });
});
