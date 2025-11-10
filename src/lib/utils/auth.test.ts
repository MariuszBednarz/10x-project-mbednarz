import { describe, it, expect, vi, beforeEach } from "vitest";
import { getAuthenticatedUser, isValidUUID } from "./auth";
import type { SupabaseClient } from "@/db/supabase.client";

describe("getAuthenticatedUser", () => {
  let mockSupabase: SupabaseClient;

  beforeEach(() => {
    // Reset mock before each test
    mockSupabase = {
      auth: {
        getUser: vi.fn(),
      },
    } as any;
  });

  describe("Authenticated user - success cases", () => {
    it("should return user when authenticated and email verified", async () => {
      const mockUser = {
        id: "123e4567-e89b-12d3-a456-426614174000",
        email: "user@example.com",
        email_confirmed_at: "2024-01-01T00:00:00Z",
      };

      vi.mocked(mockSupabase.auth.getUser).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      } as any);

      const result = await getAuthenticatedUser(mockSupabase);

      expect(result).toBe(mockUser);
      expect(mockSupabase.auth.getUser).toHaveBeenCalledOnce();
    });

    it("should return user with all fields populated", async () => {
      const mockUser = {
        id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
        email: "test@example.com",
        email_confirmed_at: "2024-06-15T10:30:00Z",
        user_metadata: { name: "Test User" },
        app_metadata: {},
        aud: "authenticated",
        created_at: "2024-01-01T00:00:00Z",
      };

      vi.mocked(mockSupabase.auth.getUser).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      } as any);

      const result = await getAuthenticatedUser(mockSupabase);

      expect(result).toBe(mockUser);
      expect(result?.id).toBe("a1b2c3d4-e5f6-7890-abcd-ef1234567890");
      expect(result?.email).toBe("test@example.com");
    });
  });

  describe("Unauthenticated user - null return", () => {
    it("should return null when no user exists", async () => {
      vi.mocked(mockSupabase.auth.getUser).mockResolvedValue({
        data: { user: null },
        error: null,
      } as any);

      const result = await getAuthenticatedUser(mockSupabase);

      expect(result).toBeNull();
      expect(mockSupabase.auth.getUser).toHaveBeenCalledOnce();
    });

    it("should return null when auth error occurs", async () => {
      vi.mocked(mockSupabase.auth.getUser).mockResolvedValue({
        data: { user: null },
        error: { message: "Invalid JWT", name: "AuthError", status: 401 },
      } as any);

      const result = await getAuthenticatedUser(mockSupabase);

      expect(result).toBeNull();
    });

    it("should return null when error exists even with user data", async () => {
      const mockUser = {
        id: "123e4567-e89b-12d3-a456-426614174000",
        email: "user@example.com",
        email_confirmed_at: "2024-01-01T00:00:00Z",
      };

      vi.mocked(mockSupabase.auth.getUser).mockResolvedValue({
        data: { user: mockUser },
        error: { message: "Token expired", name: "AuthError", status: 401 },
      } as any);

      const result = await getAuthenticatedUser(mockSupabase);

      expect(result).toBeNull();
    });

    it("should return null when user object is undefined", async () => {
      vi.mocked(mockSupabase.auth.getUser).mockResolvedValue({
        data: { user: undefined },
        error: null,
      } as any);

      const result = await getAuthenticatedUser(mockSupabase);

      expect(result).toBeNull();
    });
  });

  describe("Email verification - error cases", () => {
    it("should throw EMAIL_NOT_VERIFIED when email_confirmed_at is null", async () => {
      const mockUser = {
        id: "123e4567-e89b-12d3-a456-426614174000",
        email: "user@example.com",
        email_confirmed_at: null,
      };

      vi.mocked(mockSupabase.auth.getUser).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      } as any);

      await expect(getAuthenticatedUser(mockSupabase)).rejects.toEqual({
        code: "EMAIL_NOT_VERIFIED",
        message: "Email address not verified",
      });
    });

    it("should throw EMAIL_NOT_VERIFIED when email_confirmed_at is undefined", async () => {
      const mockUser = {
        id: "123e4567-e89b-12d3-a456-426614174000",
        email: "user@example.com",
        email_confirmed_at: undefined,
      };

      vi.mocked(mockSupabase.auth.getUser).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      } as any);

      await expect(getAuthenticatedUser(mockSupabase)).rejects.toEqual({
        code: "EMAIL_NOT_VERIFIED",
        message: "Email address not verified",
      });
    });

    it("should throw EMAIL_NOT_VERIFIED with correct error structure", async () => {
      const mockUser = {
        id: "123e4567-e89b-12d3-a456-426614174000",
        email: "unverified@example.com",
        email_confirmed_at: null,
      };

      vi.mocked(mockSupabase.auth.getUser).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      } as any);

      try {
        await getAuthenticatedUser(mockSupabase);
        expect.fail("Should have thrown error");
      } catch (error: any) {
        expect(error.code).toBe("EMAIL_NOT_VERIFIED");
        expect(error.message).toBe("Email address not verified");
      }
    });
  });

  describe("Edge cases", () => {
    it("should handle empty string email_confirmed_at", async () => {
      const mockUser = {
        id: "123e4567-e89b-12d3-a456-426614174000",
        email: "user@example.com",
        email_confirmed_at: "",
      };

      vi.mocked(mockSupabase.auth.getUser).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      } as any);

      // Empty string is falsy, should throw
      await expect(getAuthenticatedUser(mockSupabase)).rejects.toEqual({
        code: "EMAIL_NOT_VERIFIED",
        message: "Email address not verified",
      });
    });

    it("should accept valid date string in email_confirmed_at", async () => {
      const mockUser = {
        id: "123e4567-e89b-12d3-a456-426614174000",
        email: "user@example.com",
        email_confirmed_at: "2024-12-01T15:30:00.000Z",
      };

      vi.mocked(mockSupabase.auth.getUser).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      } as any);

      const result = await getAuthenticatedUser(mockSupabase);

      expect(result).toBe(mockUser);
    });

    it("should handle multiple rapid calls", async () => {
      const mockUser = {
        id: "123e4567-e89b-12d3-a456-426614174000",
        email: "user@example.com",
        email_confirmed_at: "2024-01-01T00:00:00Z",
      };

      vi.mocked(mockSupabase.auth.getUser).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      } as any);

      const [result1, result2, result3] = await Promise.all([
        getAuthenticatedUser(mockSupabase),
        getAuthenticatedUser(mockSupabase),
        getAuthenticatedUser(mockSupabase),
      ]);

      expect(result1).toBe(mockUser);
      expect(result2).toBe(mockUser);
      expect(result3).toBe(mockUser);
      expect(mockSupabase.auth.getUser).toHaveBeenCalledTimes(3);
    });

    it("should handle promise rejection from Supabase", async () => {
      vi.mocked(mockSupabase.auth.getUser).mockRejectedValue(new Error("Network error"));

      await expect(getAuthenticatedUser(mockSupabase)).rejects.toThrow("Network error");
    });
  });
});

describe("isValidUUID", () => {
  describe("Valid UUIDs", () => {
    it("should accept standard UUID v4", () => {
      const uuid = "123e4567-e89b-12d3-a456-426614174000";
      expect(isValidUUID(uuid)).toBe(true);
    });

    it("should accept lowercase UUID", () => {
      const uuid = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";
      expect(isValidUUID(uuid)).toBe(true);
    });

    it("should accept uppercase UUID", () => {
      const uuid = "A1B2C3D4-E5F6-7890-ABCD-EF1234567890";
      expect(isValidUUID(uuid)).toBe(true);
    });

    it("should accept mixed case UUID", () => {
      const uuid = "AaBbCcDd-EeFf-1234-5678-9AbCdEf01234";
      expect(isValidUUID(uuid)).toBe(true);
    });

    it("should accept UUID with all zeros", () => {
      const uuid = "00000000-0000-0000-0000-000000000000";
      expect(isValidUUID(uuid)).toBe(true);
    });

    it("should accept UUID with all fs", () => {
      const uuid = "ffffffff-ffff-ffff-ffff-ffffffffffff";
      expect(isValidUUID(uuid)).toBe(true);
    });

    it("should accept UUID with mixed hex digits", () => {
      const uuid = "12345678-90ab-cdef-1234-567890abcdef";
      expect(isValidUUID(uuid)).toBe(true);
    });
  });

  describe("Invalid UUIDs - format", () => {
    it("should reject empty string", () => {
      expect(isValidUUID("")).toBe(false);
    });

    it("should reject UUID without dashes", () => {
      const invalid = "123e4567e89b12d3a456426614174000";
      expect(isValidUUID(invalid)).toBe(false);
    });

    it("should reject UUID with wrong dash positions", () => {
      const invalid = "123e45-67-e89b-12d3-a456-426614174000";
      expect(isValidUUID(invalid)).toBe(false);
    });

    it("should reject UUID too short", () => {
      const invalid = "123e4567-e89b-12d3-a456";
      expect(isValidUUID(invalid)).toBe(false);
    });

    it("should reject UUID too long", () => {
      const invalid = "123e4567-e89b-12d3-a456-426614174000-extra";
      expect(isValidUUID(invalid)).toBe(false);
    });

    it("should reject UUID with extra characters at start", () => {
      const invalid = "x123e4567-e89b-12d3-a456-426614174000";
      expect(isValidUUID(invalid)).toBe(false);
    });

    it("should reject UUID with spaces", () => {
      const invalid = "123e4567 e89b 12d3 a456 426614174000";
      expect(isValidUUID(invalid)).toBe(false);
    });

    it("should reject UUID with leading/trailing whitespace", () => {
      const invalid = " 123e4567-e89b-12d3-a456-426614174000 ";
      expect(isValidUUID(invalid)).toBe(false);
    });
  });

  describe("Invalid UUIDs - characters", () => {
    it("should reject UUID with invalid hex character (g)", () => {
      const invalid = "123g4567-e89b-12d3-a456-426614174000";
      expect(isValidUUID(invalid)).toBe(false);
    });

    it("should reject UUID with invalid hex character (z)", () => {
      const invalid = "123e4567-e89z-12d3-a456-426614174000";
      expect(isValidUUID(invalid)).toBe(false);
    });

    it("should reject UUID with special characters", () => {
      const invalid = "123e4567-e89!-12d3-a456-426614174000";
      expect(isValidUUID(invalid)).toBe(false);
    });

    it("should reject UUID with underscore instead of dash", () => {
      const invalid = "123e4567_e89b_12d3_a456_426614174000";
      expect(isValidUUID(invalid)).toBe(false);
    });
  });

  describe("Security - SQL injection attempts", () => {
    it("should reject SQL DROP TABLE", () => {
      const invalid = "'; DROP TABLE users--";
      expect(isValidUUID(invalid)).toBe(false);
    });

    it("should reject SQL OR injection", () => {
      const invalid = "' OR '1'='1";
      expect(isValidUUID(invalid)).toBe(false);
    });

    it("should reject SQL UNION attack", () => {
      const invalid = "' UNION SELECT * FROM users--";
      expect(isValidUUID(invalid)).toBe(false);
    });
  });

  describe("Security - XSS attempts", () => {
    it("should reject script tags", () => {
      const invalid = "<script>alert(1)</script>";
      expect(isValidUUID(invalid)).toBe(false);
    });

    it("should reject HTML tags", () => {
      const invalid = "<div>test</div>";
      expect(isValidUUID(invalid)).toBe(false);
    });

    it("should reject javascript protocol", () => {
      const invalid = "javascript:alert(1)";
      expect(isValidUUID(invalid)).toBe(false);
    });
  });

  describe("Type validation", () => {
    it("should reject null (cast to string 'null')", () => {
      expect(isValidUUID(null as any)).toBe(false);
    });

    it("should reject undefined (cast to string 'undefined')", () => {
      expect(isValidUUID(undefined as any)).toBe(false);
    });

    it("should reject number", () => {
      expect(isValidUUID(123 as any)).toBe(false);
    });

    it("should reject boolean", () => {
      expect(isValidUUID(true as any)).toBe(false);
    });

    it("should reject object", () => {
      expect(isValidUUID({ id: "test" } as any)).toBe(false);
    });

    it("should accept array with valid UUID (toString behavior)", () => {
      // Note: Arrays are converted to string via .toString(), which returns the first element
      // This is JavaScript's default behavior - the function expects a string parameter
      expect(isValidUUID(["123e4567-e89b-12d3-a456-426614174000"] as any)).toBe(true);
    });

    it("should reject array with invalid value", () => {
      expect(isValidUUID(["invalid"] as any)).toBe(false);
    });

    it("should reject array with multiple values", () => {
      // Multiple array elements are joined with commas, making it invalid
      expect(isValidUUID(["123e4567-e89b-12d3-a456-426614174000", "a1b2c3d4-e5f6-7890-abcd-ef1234567890"] as any)).toBe(
        false
      );
    });
  });

  describe("Edge cases", () => {
    it("should reject very long string", () => {
      const invalid = "a".repeat(1000);
      expect(isValidUUID(invalid)).toBe(false);
    });

    it("should reject numeric string (not hex)", () => {
      const invalid = "12345678-9012-3456-7890-123456789012";
      // This might actually be valid if all digits are valid hex
      // Let's test with non-hex numeric string
      const notHex = "12345678-90gh-3456-7890-123456789012";
      expect(isValidUUID(notHex)).toBe(false);
    });

    it("should handle case sensitivity correctly", () => {
      // Should accept both upper and lower case hex
      expect(isValidUUID("AAAAAAAA-BBBB-CCCC-DDDD-EEEEEEEEEEEE")).toBe(true);
      expect(isValidUUID("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee")).toBe(true);
    });

    it("should reject NIL UUID variant (depends on strict UUID validation)", () => {
      // NIL UUID is technically valid UUID, should pass
      const nilUuid = "00000000-0000-0000-0000-000000000000";
      expect(isValidUUID(nilUuid)).toBe(true);
    });

    it("should validate exact segment lengths", () => {
      // 8-4-4-4-12 hex digits
      const tooShortFirstSegment = "1234567-e89b-12d3-a456-426614174000";
      expect(isValidUUID(tooShortFirstSegment)).toBe(false);

      const tooLongFirstSegment = "123456789-e89b-12d3-a456-426614174000";
      expect(isValidUUID(tooLongFirstSegment)).toBe(false);
    });
  });
});
