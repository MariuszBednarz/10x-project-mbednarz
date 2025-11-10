import { describe, it, expect } from "vitest";
import { validateHospitalsQuery, hospitalsQuerySchema } from "./hospitals.schema";

describe("hospitalsQuerySchema", () => {
  describe("Valid inputs", () => {
    it("should accept valid search query with Polish characters", () => {
      const input = { search: "Szpital Miejski" };
      const result = hospitalsQuerySchema.parse(input);

      expect(result.search).toBe("Szpital Miejski");
      expect(result.order).toBe("availablePlaces.desc");
      expect(result.limit).toBe(50);
      expect(result.offset).toBe(0);
    });

    it("should accept valid district filter with Polish characters", () => {
      const input = { district: "Śródmieście" };
      const result = hospitalsQuerySchema.parse(input);

      expect(result.district).toBe("Śródmieście");
    });

    it("should accept all Polish diacritics (ąćęłńóśźż)", () => {
      const input = { search: "ąćęłńóśźż ĄĆĘŁŃÓŚŹŻ", district: "Łódź" };
      const result = hospitalsQuerySchema.parse(input);

      expect(result.search).toBe("ąćęłńóśźż ĄĆĘŁŃÓŚŹŻ");
      expect(result.district).toBe("Łódź");
    });

    it("should accept search and district with hyphens", () => {
      const input = { search: "Szpital-Miejski", district: "Wola-Zachód" };
      const result = hospitalsQuerySchema.parse(input);

      expect(result.search).toBe("Szpital-Miejski");
      expect(result.district).toBe("Wola-Zachód");
    });

    it("should accept search with numbers", () => {
      const input = { search: "Szpital 123" };
      const result = hospitalsQuerySchema.parse(input);

      expect(result.search).toBe("Szpital 123");
    });

    it("should accept empty search and district (optional fields)", () => {
      const input = {};
      const result = hospitalsQuerySchema.parse(input);

      expect(result.search).toBeUndefined();
      expect(result.district).toBeUndefined();
    });

    it("should accept order as availablePlaces.desc", () => {
      const input = { order: "availablePlaces.desc" as const };
      const result = hospitalsQuerySchema.parse(input);

      expect(result.order).toBe("availablePlaces.desc");
    });

    it("should accept order as hospitalName.asc", () => {
      const input = { order: "hospitalName.asc" as const };
      const result = hospitalsQuerySchema.parse(input);

      expect(result.order).toBe("hospitalName.asc");
    });

    it("should default to availablePlaces.desc when order not specified", () => {
      const input = {};
      const result = hospitalsQuerySchema.parse(input);

      expect(result.order).toBe("availablePlaces.desc");
    });

    it("should accept custom pagination", () => {
      const input = { limit: 25, offset: 10 };
      const result = hospitalsQuerySchema.parse(input);

      expect(result.limit).toBe(25);
      expect(result.offset).toBe(10);
    });

    it("should accept all fields combined", () => {
      const input = {
        search: "Szpital",
        district: "Mokotów",
        order: "hospitalName.asc" as const,
        limit: 20,
        offset: 5,
      };
      const result = hospitalsQuerySchema.parse(input);

      expect(result.search).toBe("Szpital");
      expect(result.district).toBe("Mokotów");
      expect(result.order).toBe("hospitalName.asc");
      expect(result.limit).toBe(20);
      expect(result.offset).toBe(5);
    });
  });

  describe("XSS protection - search field", () => {
    it("should reject search with script tags", () => {
      const input = { search: "<script>alert(1)</script>" };

      expect(() => hospitalsQuerySchema.parse(input)).toThrow();
    });

    it("should reject search with HTML tags", () => {
      const input = { search: "<div>test</div>" };

      expect(() => hospitalsQuerySchema.parse(input)).toThrow();
    });

    it("should reject search with onclick attribute", () => {
      const input = { search: "test onclick='alert(1)'" };

      expect(() => hospitalsQuerySchema.parse(input)).toThrow();
    });

    it("should reject search with img tag", () => {
      const input = { search: "<img src=x onerror=alert(1)>" };

      expect(() => hospitalsQuerySchema.parse(input)).toThrow();
    });
  });

  describe("XSS protection - district field", () => {
    it("should reject district with script tags", () => {
      const input = { district: "<script>alert(1)</script>" };

      expect(() => hospitalsQuerySchema.parse(input)).toThrow();
    });

    it("should reject district with HTML tags", () => {
      const input = { district: "<div>test</div>" };

      expect(() => hospitalsQuerySchema.parse(input)).toThrow();
    });

    it("should reject district with onclick attribute", () => {
      const input = { district: "test onclick='alert(1)'" };

      expect(() => hospitalsQuerySchema.parse(input)).toThrow();
    });
  });

  describe("SQL injection protection - search field", () => {
    it("should reject search with DROP TABLE", () => {
      const input = { search: "'; DROP TABLE hospitals--" };

      expect(() => hospitalsQuerySchema.parse(input)).toThrow();
    });

    it("should reject search with single quotes", () => {
      const input = { search: "test' OR '1'='1" };

      expect(() => hospitalsQuerySchema.parse(input)).toThrow();
    });

    it("should accept search with double hyphens (hyphens are allowed in regex)", () => {
      // Note: Regex allows hyphens, so "--" is valid
      // SQL injection protection relies on parameterized queries, not regex filtering
      const input = { search: "test--comment" };
      const result = hospitalsQuerySchema.parse(input);

      expect(result.search).toBe("test--comment");
    });

    it("should reject search with semicolons", () => {
      const input = { search: "test; DELETE FROM hospitals;" };

      expect(() => hospitalsQuerySchema.parse(input)).toThrow();
    });
  });

  describe("SQL injection protection - district field", () => {
    it("should reject district with DROP TABLE", () => {
      const input = { district: "'; DROP TABLE hospitals--" };

      expect(() => hospitalsQuerySchema.parse(input)).toThrow();
    });

    it("should reject district with single quotes", () => {
      const input = { district: "test' OR '1'='1" };

      expect(() => hospitalsQuerySchema.parse(input)).toThrow();
    });

    it("should reject district with semicolons", () => {
      const input = { district: "test; DELETE FROM wards;" };

      expect(() => hospitalsQuerySchema.parse(input)).toThrow();
    });
  });

  describe("Length validation - search field", () => {
    it("should reject empty string search (min 1 character)", () => {
      const input = { search: "" };

      expect(() => hospitalsQuerySchema.parse(input)).toThrow();
    });

    it("should accept search at minimum length (1 character)", () => {
      const input = { search: "a" };
      const result = hospitalsQuerySchema.parse(input);

      expect(result.search).toBe("a");
    });

    it("should accept search at maximum length (100 characters)", () => {
      const input = { search: "a".repeat(100) };
      const result = hospitalsQuerySchema.parse(input);

      expect(result.search).toBe("a".repeat(100));
    });

    it("should reject search exceeding 100 characters", () => {
      const input = { search: "a".repeat(101) };

      expect(() => hospitalsQuerySchema.parse(input)).toThrow();
    });
  });

  describe("Length validation - district field", () => {
    it("should accept empty string district", () => {
      const input = { district: "" };
      const result = hospitalsQuerySchema.parse(input);

      expect(result.district).toBe("");
    });

    it("should accept district at maximum length (100 characters)", () => {
      const input = { district: "a".repeat(100) };
      const result = hospitalsQuerySchema.parse(input);

      expect(result.district).toBe("a".repeat(100));
    });

    it("should reject district exceeding 100 characters", () => {
      const input = { district: "a".repeat(101) };

      expect(() => hospitalsQuerySchema.parse(input)).toThrow();
    });
  });

  describe("Order validation", () => {
    it("should reject invalid order value", () => {
      const input = { order: "invalid" };

      expect(() => hospitalsQuerySchema.parse(input)).toThrow();
    });

    it("should reject order with SQL injection attempt", () => {
      const input = { order: "availablePlaces.desc; DROP TABLE--" };

      expect(() => hospitalsQuerySchema.parse(input)).toThrow();
    });
  });

  describe("Pagination validation", () => {
    it("should reject limit less than 1", () => {
      const input = { limit: 0 };

      expect(() => hospitalsQuerySchema.parse(input)).toThrow();
    });

    it("should reject limit greater than 100", () => {
      const input = { limit: 101 };

      expect(() => hospitalsQuerySchema.parse(input)).toThrow();
    });

    it("should reject negative offset", () => {
      const input = { offset: -1 };

      expect(() => hospitalsQuerySchema.parse(input)).toThrow();
    });

    it("should accept offset of 0", () => {
      const input = { offset: 0 };
      const result = hospitalsQuerySchema.parse(input);

      expect(result.offset).toBe(0);
    });

    it("should reject non-integer limit", () => {
      const input = { limit: 25.5 };

      expect(() => hospitalsQuerySchema.parse(input)).toThrow();
    });

    it("should reject non-integer offset", () => {
      const input = { offset: 10.5 };

      expect(() => hospitalsQuerySchema.parse(input)).toThrow();
    });
  });

  describe("Special characters", () => {
    it("should reject search with special characters (!@#$%)", () => {
      const input = { search: "test!@#$%" };

      expect(() => hospitalsQuerySchema.parse(input)).toThrow();
    });

    it("should reject district with special characters", () => {
      const input = { district: "test!@#$%" };

      expect(() => hospitalsQuerySchema.parse(input)).toThrow();
    });

    it("should reject search with parentheses", () => {
      const input = { search: "test()" };

      expect(() => hospitalsQuerySchema.parse(input)).toThrow();
    });

    it("should reject search with brackets", () => {
      const input = { search: "test[123]" };

      expect(() => hospitalsQuerySchema.parse(input)).toThrow();
    });

    it("should reject search with ampersand", () => {
      const input = { search: "test&test" };

      expect(() => hospitalsQuerySchema.parse(input)).toThrow();
    });

    it("should reject search with equals sign", () => {
      const input = { search: "test=123" };

      expect(() => hospitalsQuerySchema.parse(input)).toThrow();
    });
  });
});

describe("validateHospitalsQuery", () => {
  describe("Successful validation", () => {
    it("should return validated data for valid input", () => {
      const input = { search: "Szpital", district: "Mokotów", limit: 25 };
      const result = validateHospitalsQuery(input);

      expect(result.search).toBe("Szpital");
      expect(result.district).toBe("Mokotów");
      expect(result.limit).toBe(25);
    });

    it("should return defaults for empty input", () => {
      const input = {};
      const result = validateHospitalsQuery(input);

      expect(result.order).toBe("availablePlaces.desc");
      expect(result.limit).toBe(50);
      expect(result.offset).toBe(0);
    });

    it("should validate with both order options", () => {
      const input1 = { order: "availablePlaces.desc" as const };
      const result1 = validateHospitalsQuery(input1);
      expect(result1.order).toBe("availablePlaces.desc");

      const input2 = { order: "hospitalName.asc" as const };
      const result2 = validateHospitalsQuery(input2);
      expect(result2.order).toBe("hospitalName.asc");
    });
  });

  describe("Error handling", () => {
    it("should throw VALIDATION_ERROR for invalid search characters", () => {
      const input = { search: "<script>alert(1)</script>" };

      expect(() => validateHospitalsQuery(input)).toThrow();
      try {
        validateHospitalsQuery(input);
      } catch (error: any) {
        expect(error.code).toBe("VALIDATION_ERROR");
        expect(error.message).toContain("invalid characters");
      }
    });

    it("should throw VALIDATION_ERROR for invalid district characters", () => {
      const input = { district: "<script>alert(1)</script>" };

      expect(() => validateHospitalsQuery(input)).toThrow();
      try {
        validateHospitalsQuery(input);
      } catch (error: any) {
        expect(error.code).toBe("VALIDATION_ERROR");
        expect(error.message).toContain("invalid characters");
      }
    });

    it("should throw VALIDATION_ERROR for too long search", () => {
      const input = { search: "a".repeat(101) };

      expect(() => validateHospitalsQuery(input)).toThrow();
      try {
        validateHospitalsQuery(input);
      } catch (error: any) {
        expect(error.code).toBe("VALIDATION_ERROR");
      }
    });

    it("should throw VALIDATION_ERROR for too long district", () => {
      const input = { district: "a".repeat(101) };

      expect(() => validateHospitalsQuery(input)).toThrow();
      try {
        validateHospitalsQuery(input);
      } catch (error: any) {
        expect(error.code).toBe("VALIDATION_ERROR");
      }
    });

    it("should throw VALIDATION_ERROR for invalid order", () => {
      const input = { order: "invalid" };

      expect(() => validateHospitalsQuery(input)).toThrow();
      try {
        validateHospitalsQuery(input);
      } catch (error: any) {
        expect(error.code).toBe("VALIDATION_ERROR");
      }
    });

    it("should throw VALIDATION_ERROR for invalid limit", () => {
      const input = { limit: 101 };

      expect(() => validateHospitalsQuery(input)).toThrow();
      try {
        validateHospitalsQuery(input);
      } catch (error: any) {
        expect(error.code).toBe("VALIDATION_ERROR");
      }
    });

    it("should throw VALIDATION_ERROR for invalid offset", () => {
      const input = { offset: -1 };

      expect(() => validateHospitalsQuery(input)).toThrow();
      try {
        validateHospitalsQuery(input);
      } catch (error: any) {
        expect(error.code).toBe("VALIDATION_ERROR");
      }
    });
  });
});
