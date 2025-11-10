import { describe, it, expect } from "vitest";
import { validateWardsQuery, wardsQuerySchema } from "./wards.schema";

describe("wardsQuerySchema", () => {
  describe("Valid inputs", () => {
    it("should accept valid search query with Polish characters", () => {
      const input = { search: "Oddział Kardiologii" };
      const result = wardsQuerySchema.parse(input);

      expect(result.search).toBe("Oddział Kardiologii");
      expect(result.favorites_only).toBe(false);
      expect(result.limit).toBe(50);
      expect(result.offset).toBe(0);
    });

    it("should accept all Polish diacritics (ąćęłńóśźż)", () => {
      const input = { search: "ąćęłńóśźż ĄĆĘŁŃÓŚŹŻ" };
      const result = wardsQuerySchema.parse(input);

      expect(result.search).toBe("ąćęłńóśźż ĄĆĘŁŃÓŚŹŻ");
    });

    it("should accept search with hyphens", () => {
      const input = { search: "Oddział-Kardiologii" };
      const result = wardsQuerySchema.parse(input);

      expect(result.search).toBe("Oddział-Kardiologii");
    });

    it("should accept search with numbers", () => {
      const input = { search: "Oddział 123" };
      const result = wardsQuerySchema.parse(input);

      expect(result.search).toBe("Oddział 123");
    });

    it("should accept empty search (optional field)", () => {
      const input = {};
      const result = wardsQuerySchema.parse(input);

      expect(result.search).toBeUndefined();
    });

    it("should accept favorites_only as true", () => {
      const input = { favorites_only: true };
      const result = wardsQuerySchema.parse(input);

      expect(result.favorites_only).toBe(true);
    });

    it("should accept custom pagination", () => {
      const input = { limit: 25, offset: 10 };
      const result = wardsQuerySchema.parse(input);

      expect(result.limit).toBe(25);
      expect(result.offset).toBe(10);
    });

    it("should accept all fields combined", () => {
      const input = {
        search: "Kardiologia",
        favorites_only: true,
        limit: 20,
        offset: 5,
      };
      const result = wardsQuerySchema.parse(input);

      expect(result.search).toBe("Kardiologia");
      expect(result.favorites_only).toBe(true);
      expect(result.limit).toBe(20);
      expect(result.offset).toBe(5);
    });
  });

  describe("XSS protection", () => {
    it("should reject search with script tags", () => {
      const input = { search: "<script>alert(1)</script>" };

      expect(() => wardsQuerySchema.parse(input)).toThrow();
    });

    it("should reject search with HTML tags", () => {
      const input = { search: "<div>test</div>" };

      expect(() => wardsQuerySchema.parse(input)).toThrow();
    });

    it("should reject search with onclick attribute", () => {
      const input = { search: "test onclick='alert(1)'" };

      expect(() => wardsQuerySchema.parse(input)).toThrow();
    });

    it("should reject search with img tag", () => {
      const input = { search: "<img src=x onerror=alert(1)>" };

      expect(() => wardsQuerySchema.parse(input)).toThrow();
    });
  });

  describe("SQL injection protection", () => {
    it("should reject search with DROP TABLE", () => {
      const input = { search: "'; DROP TABLE users--" };

      expect(() => wardsQuerySchema.parse(input)).toThrow();
    });

    it("should reject search with single quotes", () => {
      const input = { search: "test' OR '1'='1" };

      expect(() => wardsQuerySchema.parse(input)).toThrow();
    });

    it("should accept search with double hyphens (hyphens are allowed in regex)", () => {
      // Note: Regex allows hyphens, so "--" is valid
      // SQL injection protection relies on parameterized queries, not regex filtering
      const input = { search: "test--comment" };
      const result = wardsQuerySchema.parse(input);

      expect(result.search).toBe("test--comment");
    });

    it("should reject search with semicolons", () => {
      const input = { search: "test; DELETE FROM wards;" };

      expect(() => wardsQuerySchema.parse(input)).toThrow();
    });
  });

  describe("Length validation", () => {
    it("should reject empty string search (min 1 character)", () => {
      const input = { search: "" };

      expect(() => wardsQuerySchema.parse(input)).toThrow();
    });

    it("should accept search at minimum length (1 character)", () => {
      const input = { search: "a" };
      const result = wardsQuerySchema.parse(input);

      expect(result.search).toBe("a");
    });

    it("should accept search at maximum length (100 characters)", () => {
      const input = { search: "a".repeat(100) };
      const result = wardsQuerySchema.parse(input);

      expect(result.search).toBe("a".repeat(100));
    });

    it("should reject search exceeding 100 characters", () => {
      const input = { search: "a".repeat(101) };

      expect(() => wardsQuerySchema.parse(input)).toThrow();
    });
  });

  describe("Pagination validation", () => {
    it("should reject limit less than 1", () => {
      const input = { limit: 0 };

      expect(() => wardsQuerySchema.parse(input)).toThrow();
    });

    it("should reject limit greater than 100", () => {
      const input = { limit: 101 };

      expect(() => wardsQuerySchema.parse(input)).toThrow();
    });

    it("should reject negative offset", () => {
      const input = { offset: -1 };

      expect(() => wardsQuerySchema.parse(input)).toThrow();
    });

    it("should accept offset of 0", () => {
      const input = { offset: 0 };
      const result = wardsQuerySchema.parse(input);

      expect(result.offset).toBe(0);
    });

    it("should reject non-integer limit", () => {
      const input = { limit: 25.5 };

      expect(() => wardsQuerySchema.parse(input)).toThrow();
    });

    it("should reject non-integer offset", () => {
      const input = { offset: 10.5 };

      expect(() => wardsQuerySchema.parse(input)).toThrow();
    });
  });

  describe("Special characters", () => {
    it("should reject search with special characters (!@#$%)", () => {
      const input = { search: "test!@#$%" };

      expect(() => wardsQuerySchema.parse(input)).toThrow();
    });

    it("should reject search with parentheses", () => {
      const input = { search: "test()" };

      expect(() => wardsQuerySchema.parse(input)).toThrow();
    });

    it("should reject search with brackets", () => {
      const input = { search: "test[123]" };

      expect(() => wardsQuerySchema.parse(input)).toThrow();
    });

    it("should reject search with ampersand", () => {
      const input = { search: "test&test" };

      expect(() => wardsQuerySchema.parse(input)).toThrow();
    });

    it("should reject search with equals sign", () => {
      const input = { search: "test=123" };

      expect(() => wardsQuerySchema.parse(input)).toThrow();
    });
  });
});

describe("validateWardsQuery", () => {
  describe("Successful validation", () => {
    it("should return validated data for valid input", () => {
      const input = { search: "Kardiologia", limit: 25 };
      const result = validateWardsQuery(input);

      expect(result.search).toBe("Kardiologia");
      expect(result.limit).toBe(25);
    });

    it("should return defaults for empty input", () => {
      const input = {};
      const result = validateWardsQuery(input);

      expect(result.favorites_only).toBe(false);
      expect(result.limit).toBe(50);
      expect(result.offset).toBe(0);
    });
  });

  describe("Error handling", () => {
    it("should throw VALIDATION_ERROR for invalid search characters", () => {
      const input = { search: "<script>alert(1)</script>" };

      expect(() => validateWardsQuery(input)).toThrow();
      try {
        validateWardsQuery(input);
      } catch (error: any) {
        expect(error.code).toBe("VALIDATION_ERROR");
        expect(error.message).toContain("invalid characters");
      }
    });

    it("should throw VALIDATION_ERROR for too long search", () => {
      const input = { search: "a".repeat(101) };

      expect(() => validateWardsQuery(input)).toThrow();
      try {
        validateWardsQuery(input);
      } catch (error: any) {
        expect(error.code).toBe("VALIDATION_ERROR");
      }
    });

    it("should throw VALIDATION_ERROR for invalid limit", () => {
      const input = { limit: 101 };

      expect(() => validateWardsQuery(input)).toThrow();
      try {
        validateWardsQuery(input);
      } catch (error: any) {
        expect(error.code).toBe("VALIDATION_ERROR");
      }
    });

    it("should throw VALIDATION_ERROR for invalid offset", () => {
      const input = { offset: -1 };

      expect(() => validateWardsQuery(input)).toThrow();
      try {
        validateWardsQuery(input);
      } catch (error: any) {
        expect(error.code).toBe("VALIDATION_ERROR");
      }
    });
  });
});
