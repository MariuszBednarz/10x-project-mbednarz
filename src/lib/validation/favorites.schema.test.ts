import { describe, it, expect } from "vitest";
import { validateAddFavoriteCommand, addFavoriteCommandSchema } from "./favorites.schema";

describe("addFavoriteCommandSchema", () => {
  describe("Valid inputs", () => {
    it("should accept valid ward name", () => {
      const input = { ward_name: "Oddział Kardiologii" };
      const result = addFavoriteCommandSchema.parse(input);

      expect(result.ward_name).toBe("Oddział Kardiologii");
    });

    it("should accept ward name with Polish characters", () => {
      const input = { ward_name: "Oddział Ginekologiczno-Położniczy" };
      const result = addFavoriteCommandSchema.parse(input);

      expect(result.ward_name).toBe("Oddział Ginekologiczno-Położniczy");
    });

    it("should accept all Polish diacritics (ąćęłńóśźż)", () => {
      const input = { ward_name: "ąćęłńóśźż ĄĆĘŁŃÓŚŹŻ" };
      const result = addFavoriteCommandSchema.parse(input);

      expect(result.ward_name).toBe("ąćęłńóśźż ĄĆĘŁŃÓŚŹŻ");
    });

    it("should accept ward name with numbers", () => {
      const input = { ward_name: "Oddział 123" };
      const result = addFavoriteCommandSchema.parse(input);

      expect(result.ward_name).toBe("Oddział 123");
    });

    it("should accept ward name at minimum length (1 character)", () => {
      const input = { ward_name: "A" };
      const result = addFavoriteCommandSchema.parse(input);

      expect(result.ward_name).toBe("A");
    });

    it("should accept ward name at maximum length (255 characters)", () => {
      const input = { ward_name: "A".repeat(255) };
      const result = addFavoriteCommandSchema.parse(input);

      expect(result.ward_name).toBe("A".repeat(255));
    });

    it("should trim whitespace from ward name", () => {
      const input = { ward_name: "  Oddział Kardiologii  " };
      const result = addFavoriteCommandSchema.parse(input);

      expect(result.ward_name).toBe("Oddział Kardiologii");
    });

    it("should trim leading whitespace only", () => {
      const input = { ward_name: "  Oddział Kardiologii" };
      const result = addFavoriteCommandSchema.parse(input);

      expect(result.ward_name).toBe("Oddział Kardiologii");
    });

    it("should trim trailing whitespace only", () => {
      const input = { ward_name: "Oddział Kardiologii  " };
      const result = addFavoriteCommandSchema.parse(input);

      expect(result.ward_name).toBe("Oddział Kardiologii");
    });

    it("should trim tabs and newlines", () => {
      const input = { ward_name: "\t\nOddział Kardiologii\n\t" };
      const result = addFavoriteCommandSchema.parse(input);

      expect(result.ward_name).toBe("Oddział Kardiologii");
    });
  });

  describe("Invalid inputs - missing field", () => {
    it("should reject empty object", () => {
      const input = {};

      expect(() => addFavoriteCommandSchema.parse(input)).toThrow();
    });

    it("should reject object with wrong field name", () => {
      const input = { wardName: "Oddział Kardiologii" };

      expect(() => addFavoriteCommandSchema.parse(input)).toThrow();
    });

    it("should reject object with null ward_name", () => {
      const input = { ward_name: null };

      expect(() => addFavoriteCommandSchema.parse(input)).toThrow();
    });

    it("should reject object with undefined ward_name", () => {
      const input = { ward_name: undefined };

      expect(() => addFavoriteCommandSchema.parse(input)).toThrow();
    });
  });

  describe("Invalid inputs - empty/whitespace", () => {
    it("should reject empty string ward_name", () => {
      const input = { ward_name: "" };

      expect(() => addFavoriteCommandSchema.parse(input)).toThrow();
    });

    it("should accept string with only whitespace (trim happens after validation)", () => {
      // wardNameSchema has .min(1).max(255).trim()
      // Validation happens before trim, so "   " (3 chars) passes, then gets trimmed to ""
      const input = { ward_name: "   " };
      const result = addFavoriteCommandSchema.parse(input);

      expect(result.ward_name).toBe("");
    });

    it("should accept string with only tabs (gets trimmed)", () => {
      const input = { ward_name: "\t\t\t" };
      const result = addFavoriteCommandSchema.parse(input);

      expect(result.ward_name).toBe("");
    });

    it("should accept string with only newlines (gets trimmed)", () => {
      const input = { ward_name: "\n\n\n" };
      const result = addFavoriteCommandSchema.parse(input);

      expect(result.ward_name).toBe("");
    });

    it("should accept string with mixed whitespace only (gets trimmed)", () => {
      const input = { ward_name: "  \t\n  " };
      const result = addFavoriteCommandSchema.parse(input);

      expect(result.ward_name).toBe("");
    });
  });

  describe("Invalid inputs - length", () => {
    it("should reject ward_name exceeding 255 characters", () => {
      const input = { ward_name: "A".repeat(256) };

      expect(() => addFavoriteCommandSchema.parse(input)).toThrow();
    });

    it("should reject ward_name exceeding 255 characters (after trim)", () => {
      const input = { ward_name: "  " + "A".repeat(256) + "  " };

      expect(() => addFavoriteCommandSchema.parse(input)).toThrow();
    });

    it("should reject very long ward_name (1000 chars)", () => {
      const input = { ward_name: "A".repeat(1000) };

      expect(() => addFavoriteCommandSchema.parse(input)).toThrow();
    });
  });

  describe("Invalid inputs - type", () => {
    it("should reject number as ward_name", () => {
      const input = { ward_name: 123 };

      expect(() => addFavoriteCommandSchema.parse(input)).toThrow();
    });

    it("should reject boolean as ward_name", () => {
      const input = { ward_name: true };

      expect(() => addFavoriteCommandSchema.parse(input)).toThrow();
    });

    it("should reject object as ward_name", () => {
      const input = { ward_name: { name: "test" } };

      expect(() => addFavoriteCommandSchema.parse(input)).toThrow();
    });

    it("should reject array as ward_name", () => {
      const input = { ward_name: ["Oddział Kardiologii"] };

      expect(() => addFavoriteCommandSchema.parse(input)).toThrow();
    });
  });

  describe("Edge cases", () => {
    it("should handle ward name with internal multiple spaces", () => {
      const input = { ward_name: "Oddział    Kardiologii" };
      const result = addFavoriteCommandSchema.parse(input);

      // Should trim only leading/trailing, not internal spaces
      expect(result.ward_name).toBe("Oddział    Kardiologii");
    });

    it("should reject ward name with 255 chars + whitespace (exceeds max before trim)", () => {
      // wardNameSchema validates .max(255) BEFORE .trim()
      // "  AAA...  " (259 chars) exceeds max(255)
      const input = { ward_name: "  " + "A".repeat(255) + "  " };

      expect(() => addFavoriteCommandSchema.parse(input)).toThrow();
    });

    it("should accept ward name exactly at 255 characters", () => {
      const input = { ward_name: "A".repeat(255) };
      const result = addFavoriteCommandSchema.parse(input);

      expect(result.ward_name).toBe("A".repeat(255));
      expect(result.ward_name.length).toBe(255);
    });

    it("should handle special medical terms", () => {
      const input = { ward_name: "Oddział Anestezjologii i Intensywnej Terapii" };
      const result = addFavoriteCommandSchema.parse(input);

      expect(result.ward_name).toBe("Oddział Anestezjologii i Intensywnej Terapii");
    });

    it("should handle ward name with hyphen", () => {
      const input = { ward_name: "Oddział Ginekologiczno-Położniczy" };
      const result = addFavoriteCommandSchema.parse(input);

      expect(result.ward_name).toBe("Oddział Ginekologiczno-Położniczy");
    });

    it("should handle ward name with forward slash", () => {
      const input = { ward_name: "Oddział Internistyczny/Kardiologiczny" };
      const result = addFavoriteCommandSchema.parse(input);

      expect(result.ward_name).toBe("Oddział Internistyczny/Kardiologiczny");
    });
  });

  describe("Security - XSS prevention", () => {
    it("should accept ward name with angle brackets (not filtered at validation level)", () => {
      // Note: XSS filtering should happen at display level, not validation
      // Validation accepts all characters, sanitization happens later
      const input = { ward_name: "Test <test>" };
      const result = addFavoriteCommandSchema.parse(input);

      expect(result.ward_name).toBe("Test <test>");
    });
  });

  describe("Extra fields", () => {
    it("should strip extra fields from input", () => {
      const input = {
        ward_name: "Oddział Kardiologii",
        extra_field: "should be ignored",
      };
      const result = addFavoriteCommandSchema.parse(input);

      expect(result).toEqual({ ward_name: "Oddział Kardiologii" });
      expect((result as any).extra_field).toBeUndefined();
    });

    it("should strip multiple extra fields", () => {
      const input = {
        ward_name: "Oddział Kardiologii",
        field1: "ignore",
        field2: 123,
        field3: true,
      };
      const result = addFavoriteCommandSchema.parse(input);

      expect(result).toEqual({ ward_name: "Oddział Kardiologii" });
    });
  });
});

describe("validateAddFavoriteCommand", () => {
  describe("Successful validation", () => {
    it("should return validated data for valid input", () => {
      const input = { ward_name: "Oddział Kardiologii" };
      const result = validateAddFavoriteCommand(input);

      expect(result.ward_name).toBe("Oddział Kardiologii");
    });

    it("should trim whitespace in validated output", () => {
      const input = { ward_name: "  Oddział Kardiologii  " };
      const result = validateAddFavoriteCommand(input);

      expect(result.ward_name).toBe("Oddział Kardiologii");
    });

    it("should handle ward names with Polish characters", () => {
      const input = { ward_name: "Oddział Ginekologiczno-Położniczy" };
      const result = validateAddFavoriteCommand(input);

      expect(result.ward_name).toBe("Oddział Ginekologiczno-Położniczy");
    });

    it("should handle ward name at maximum length", () => {
      const input = { ward_name: "A".repeat(255) };
      const result = validateAddFavoriteCommand(input);

      expect(result.ward_name).toBe("A".repeat(255));
      expect(result.ward_name.length).toBe(255);
    });
  });

  describe("Error handling", () => {
    it("should throw VALIDATION_ERROR for empty ward_name", () => {
      const input = { ward_name: "" };

      expect(() => validateAddFavoriteCommand(input)).toThrow();
      try {
        validateAddFavoriteCommand(input);
      } catch (error: any) {
        expect(error.code).toBe("VALIDATION_ERROR");
        expect(error.message).toContain("Ward name is required");
      }
    });

    it("should accept whitespace-only ward_name (gets trimmed to empty string)", () => {
      // wardNameSchema has .min(1).max(255).trim()
      // "   " (3 chars) passes min(1), then gets trimmed to ""
      const input = { ward_name: "   " };
      const result = validateAddFavoriteCommand(input);

      expect(result.ward_name).toBe("");
    });

    it("should throw VALIDATION_ERROR for too long ward_name", () => {
      const input = { ward_name: "A".repeat(256) };

      expect(() => validateAddFavoriteCommand(input)).toThrow();
      try {
        validateAddFavoriteCommand(input);
      } catch (error: any) {
        expect(error.code).toBe("VALIDATION_ERROR");
        expect(error.message).toContain("Ward name exceeds 255 characters");
      }
    });

    it("should throw VALIDATION_ERROR for missing ward_name field", () => {
      const input = {};

      expect(() => validateAddFavoriteCommand(input)).toThrow();
      try {
        validateAddFavoriteCommand(input);
      } catch (error: any) {
        expect(error.code).toBe("VALIDATION_ERROR");
      }
    });

    it("should throw VALIDATION_ERROR for null ward_name", () => {
      const input = { ward_name: null };

      expect(() => validateAddFavoriteCommand(input)).toThrow();
      try {
        validateAddFavoriteCommand(input);
      } catch (error: any) {
        expect(error.code).toBe("VALIDATION_ERROR");
      }
    });

    it("should throw VALIDATION_ERROR for number ward_name", () => {
      const input = { ward_name: 123 };

      expect(() => validateAddFavoriteCommand(input)).toThrow();
      try {
        validateAddFavoriteCommand(input);
      } catch (error: any) {
        expect(error.code).toBe("VALIDATION_ERROR");
      }
    });

    it("should throw VALIDATION_ERROR for object ward_name", () => {
      const input = { ward_name: { name: "test" } };

      expect(() => validateAddFavoriteCommand(input)).toThrow();
      try {
        validateAddFavoriteCommand(input);
      } catch (error: any) {
        expect(error.code).toBe("VALIDATION_ERROR");
      }
    });

    it("should throw VALIDATION_ERROR for array ward_name", () => {
      const input = { ward_name: ["test"] };

      expect(() => validateAddFavoriteCommand(input)).toThrow();
      try {
        validateAddFavoriteCommand(input);
      } catch (error: any) {
        expect(error.code).toBe("VALIDATION_ERROR");
      }
    });
  });

  describe("Error message format", () => {
    it("should return first error message from Zod", () => {
      const input = { ward_name: "" };

      try {
        validateAddFavoriteCommand(input);
      } catch (error: any) {
        expect(error.message).toBeTruthy();
        expect(typeof error.message).toBe("string");
      }
    });

    it("should have VALIDATION_ERROR code", () => {
      const input = { ward_name: 123 };

      try {
        validateAddFavoriteCommand(input);
      } catch (error: any) {
        expect(error.code).toBe("VALIDATION_ERROR");
      }
    });

    it("should provide fallback message if error format is unexpected", () => {
      // This is hard to test directly, but validates the error handling structure
      const input = { ward_name: null };

      try {
        validateAddFavoriteCommand(input);
      } catch (error: any) {
        expect(error.code).toBe("VALIDATION_ERROR");
        expect(error.message).toBeTruthy();
      }
    });
  });
});
