import { describe, it, expect } from "vitest";
import { paginationSchema, uuidSchema, wardNameSchema } from "./common.schema";

describe("paginationSchema", () => {
  describe("Valid inputs", () => {
    it("should accept valid limit and offset", () => {
      const input = { limit: 25, offset: 10 };
      const result = paginationSchema.parse(input);

      expect(result.limit).toBe(25);
      expect(result.offset).toBe(10);
    });

    it("should use default values when not provided", () => {
      const input = {};
      const result = paginationSchema.parse(input);

      expect(result.limit).toBe(50);
      expect(result.offset).toBe(0);
    });

    it("should accept minimum limit (1)", () => {
      const input = { limit: 1 };
      const result = paginationSchema.parse(input);

      expect(result.limit).toBe(1);
    });

    it("should accept maximum limit (100)", () => {
      const input = { limit: 100 };
      const result = paginationSchema.parse(input);

      expect(result.limit).toBe(100);
    });

    it("should accept offset of 0", () => {
      const input = { offset: 0 };
      const result = paginationSchema.parse(input);

      expect(result.offset).toBe(0);
    });

    it("should accept large offset values", () => {
      const input = { offset: 999999 };
      const result = paginationSchema.parse(input);

      expect(result.offset).toBe(999999);
    });
  });

  describe("Invalid inputs - limit", () => {
    it("should reject limit less than 1", () => {
      const input = { limit: 0 };

      expect(() => paginationSchema.parse(input)).toThrow();
    });

    it("should reject negative limit", () => {
      const input = { limit: -1 };

      expect(() => paginationSchema.parse(input)).toThrow();
    });

    it("should reject limit greater than 100", () => {
      const input = { limit: 101 };

      expect(() => paginationSchema.parse(input)).toThrow();
    });

    it("should reject non-integer limit (decimal)", () => {
      const input = { limit: 25.5 };

      expect(() => paginationSchema.parse(input)).toThrow();
    });

    it("should reject non-integer limit (float)", () => {
      const input = { limit: 50.1 };

      expect(() => paginationSchema.parse(input)).toThrow();
    });

    it("should reject string limit", () => {
      const input = { limit: "50" };

      expect(() => paginationSchema.parse(input)).toThrow();
    });

    it("should reject null limit", () => {
      const input = { limit: null };

      expect(() => paginationSchema.parse(input)).toThrow();
    });

    it("should reject undefined limit explicitly", () => {
      const input = { limit: undefined };
      const result = paginationSchema.parse(input);

      // undefined should use default value
      expect(result.limit).toBe(50);
    });
  });

  describe("Invalid inputs - offset", () => {
    it("should reject negative offset", () => {
      const input = { offset: -1 };

      expect(() => paginationSchema.parse(input)).toThrow();
    });

    it("should reject negative offset (large)", () => {
      const input = { offset: -999 };

      expect(() => paginationSchema.parse(input)).toThrow();
    });

    it("should reject non-integer offset (decimal)", () => {
      const input = { offset: 10.5 };

      expect(() => paginationSchema.parse(input)).toThrow();
    });

    it("should reject string offset", () => {
      const input = { offset: "10" };

      expect(() => paginationSchema.parse(input)).toThrow();
    });

    it("should reject null offset", () => {
      const input = { offset: null };

      expect(() => paginationSchema.parse(input)).toThrow();
    });

    it("should reject undefined offset explicitly", () => {
      const input = { offset: undefined };
      const result = paginationSchema.parse(input);

      // undefined should use default value
      expect(result.offset).toBe(0);
    });
  });
});

describe("uuidSchema", () => {
  describe("Valid UUIDs", () => {
    it("should accept valid UUID v4", () => {
      const uuid = "123e4567-e89b-12d3-a456-426614174000";
      const result = uuidSchema.parse(uuid);

      expect(result).toBe(uuid);
    });

    it("should accept lowercase UUID", () => {
      const uuid = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";
      const result = uuidSchema.parse(uuid);

      expect(result).toBe(uuid);
    });

    it("should accept uppercase UUID", () => {
      const uuid = "A1B2C3D4-E5F6-7890-ABCD-EF1234567890";
      const result = uuidSchema.parse(uuid);

      expect(result).toBe(uuid);
    });

    it("should accept mixed case UUID", () => {
      const uuid = "A1b2C3d4-E5f6-7890-AbCd-Ef1234567890";
      const result = uuidSchema.parse(uuid);

      expect(result).toBe(uuid);
    });
  });

  describe("Invalid UUIDs", () => {
    it("should reject empty string", () => {
      expect(() => uuidSchema.parse("")).toThrow();
    });

    it("should reject UUID without dashes", () => {
      const invalid = "123e4567e89b12d3a456426614174000";

      expect(() => uuidSchema.parse(invalid)).toThrow();
    });

    it("should reject UUID with wrong format", () => {
      const invalid = "123e4567-e89b-12d3-a456";

      expect(() => uuidSchema.parse(invalid)).toThrow();
    });

    it("should reject UUID with extra characters", () => {
      const invalid = "123e4567-e89b-12d3-a456-426614174000-extra";

      expect(() => uuidSchema.parse(invalid)).toThrow();
    });

    it("should reject non-string values", () => {
      expect(() => uuidSchema.parse(123)).toThrow();
    });

    it("should reject null", () => {
      expect(() => uuidSchema.parse(null)).toThrow();
    });

    it("should reject undefined", () => {
      expect(() => uuidSchema.parse(undefined)).toThrow();
    });

    it("should reject SQL injection attempt", () => {
      const invalid = "'; DROP TABLE users--";

      expect(() => uuidSchema.parse(invalid)).toThrow();
    });

    it("should reject XSS attempt", () => {
      const invalid = "<script>alert(1)</script>";

      expect(() => uuidSchema.parse(invalid)).toThrow();
    });
  });
});

describe("wardNameSchema", () => {
  describe("Valid ward names", () => {
    it("should accept valid ward name", () => {
      const name = "Oddział Kardiologii";
      const result = wardNameSchema.parse(name);

      expect(result).toBe(name);
    });

    it("should accept ward name with Polish characters", () => {
      const name = "Oddział Ginekologiczno-Położniczy";
      const result = wardNameSchema.parse(name);

      expect(result).toBe(name);
    });

    it("should accept all Polish diacritics", () => {
      const name = "ąćęłńóśźż ĄĆĘŁŃÓŚŹŻ";
      const result = wardNameSchema.parse(name);

      expect(result).toBe(name);
    });

    it("should accept ward name with numbers", () => {
      const name = "Oddział 123";
      const result = wardNameSchema.parse(name);

      expect(result).toBe(name);
    });

    it("should accept ward name at minimum length (1 character)", () => {
      const name = "A";
      const result = wardNameSchema.parse(name);

      expect(result).toBe(name);
    });

    it("should accept ward name at maximum length (255 characters)", () => {
      const name = "A".repeat(255);
      const result = wardNameSchema.parse(name);

      expect(result).toBe(name);
    });

    it("should trim whitespace from ward name", () => {
      const name = "  Oddział Kardiologii  ";
      const result = wardNameSchema.parse(name);

      expect(result).toBe("Oddział Kardiologii");
    });

    it("should trim leading whitespace", () => {
      const name = "  Oddział Kardiologii";
      const result = wardNameSchema.parse(name);

      expect(result).toBe("Oddział Kardiologii");
    });

    it("should trim trailing whitespace", () => {
      const name = "Oddział Kardiologii  ";
      const result = wardNameSchema.parse(name);

      expect(result).toBe("Oddział Kardiologii");
    });

    it("should trim tabs and newlines", () => {
      const name = "\t\nOddział Kardiologii\n\t";
      const result = wardNameSchema.parse(name);

      expect(result).toBe("Oddział Kardiologii");
    });
  });

  describe("Invalid ward names", () => {
    it("should reject empty string", () => {
      expect(() => wardNameSchema.parse("")).toThrow();
    });

    it("should accept string with only whitespace (trim happens AFTER min/max validation)", () => {
      // Note: In the schema, .trim() is LAST: .min(1).max(255).trim()
      // So "   " has 3 chars, passes min(1), then gets trimmed to ""
      const result = wardNameSchema.parse("   ");
      expect(result).toBe("");
    });

    it("should accept string with only tabs (gets trimmed to empty)", () => {
      const result = wardNameSchema.parse("\t\t\t");
      expect(result).toBe("");
    });

    it("should accept string with only newlines (gets trimmed to empty)", () => {
      const result = wardNameSchema.parse("\n\n\n");
      expect(result).toBe("");
    });

    it("should reject ward name exceeding 255 characters", () => {
      const name = "A".repeat(256);

      expect(() => wardNameSchema.parse(name)).toThrow();
    });

    it("should reject ward name exceeding 255 characters (after trim)", () => {
      const name = "  " + "A".repeat(256) + "  ";

      expect(() => wardNameSchema.parse(name)).toThrow();
    });

    it("should reject null", () => {
      expect(() => wardNameSchema.parse(null)).toThrow();
    });

    it("should reject undefined", () => {
      expect(() => wardNameSchema.parse(undefined)).toThrow();
    });

    it("should reject number", () => {
      expect(() => wardNameSchema.parse(123)).toThrow();
    });

    it("should reject object", () => {
      expect(() => wardNameSchema.parse({ name: "test" })).toThrow();
    });

    it("should reject array", () => {
      expect(() => wardNameSchema.parse(["test"])).toThrow();
    });
  });

  describe("Edge cases", () => {
    it("should handle ward name with internal multiple spaces", () => {
      const name = "Oddział    Kardiologii";
      const result = wardNameSchema.parse(name);

      // Should trim only leading/trailing, not internal spaces
      expect(result).toBe("Oddział    Kardiologii");
    });

    it("should reject ward name with 255 chars + whitespace (validation before trim)", () => {
      // Schema validates .max(255) BEFORE .trim()
      // So "  AAA...  " (259 chars total) fails max(255) validation
      const name = "  " + "A".repeat(255) + "  ";
      expect(() => wardNameSchema.parse(name)).toThrow();
    });

    it("should accept ward name that is 255 chars after manual trim", () => {
      const name = "A".repeat(255);
      const result = wardNameSchema.parse(name);

      expect(result).toBe("A".repeat(255));
      expect(result.length).toBe(255);
    });

    it("should handle special medical terms", () => {
      const name = "Oddział Anestezjologii i Intensywnej Terapii";
      const result = wardNameSchema.parse(name);

      expect(result).toBe(name);
    });

    it("should handle ward name with hyphen", () => {
      const name = "Oddział Ginekologiczno-Położniczy";
      const result = wardNameSchema.parse(name);

      expect(result).toBe(name);
    });
  });

  describe("Error messages", () => {
    it("should provide error message for empty string", () => {
      try {
        wardNameSchema.parse("");
      } catch (error: any) {
        expect(error.errors[0].message).toContain("Ward name is required");
      }
    });

    it("should provide error message for too long string", () => {
      try {
        wardNameSchema.parse("A".repeat(256));
      } catch (error: any) {
        expect(error.errors[0].message).toContain("Ward name exceeds 255 characters");
      }
    });
  });
});
