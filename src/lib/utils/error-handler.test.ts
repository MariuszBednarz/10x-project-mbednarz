import { describe, it, expect } from "vitest";
import {
  ServiceError,
  ValidationError,
  isDuplicateKeyError,
  isValidationError,
  isEmailNotVerifiedError,
  getErrorMessage,
} from "./error-handler";

describe("ServiceError", () => {
  describe("Constructor", () => {
    it("should create error with code and message", () => {
      const error = new ServiceError("USER_NOT_FOUND", "User does not exist");

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(ServiceError);
      expect(error.code).toBe("USER_NOT_FOUND");
      expect(error.message).toBe("User does not exist");
      expect(error.name).toBe("ServiceError");
      expect(error.details).toBeUndefined();
    });

    it("should create error with optional details", () => {
      const error = new ServiceError("DATABASE_ERROR", "Query failed", "Connection timeout after 5s");

      expect(error.code).toBe("DATABASE_ERROR");
      expect(error.message).toBe("Query failed");
      expect(error.details).toBe("Connection timeout after 5s");
    });

    it("should create error with empty details", () => {
      const error = new ServiceError("UNKNOWN_ERROR", "Something went wrong", "");

      expect(error.details).toBe("");
    });

    it("should preserve error stack trace", () => {
      const error = new ServiceError("TEST_ERROR", "Test message");

      expect(error.stack).toBeDefined();
      expect(typeof error.stack).toBe("string");
    });
  });

  describe("Error properties", () => {
    it("should be throwable and catchable", () => {
      expect(() => {
        throw new ServiceError("TEST", "Test error");
      }).toThrow(ServiceError);
    });

    it("should maintain prototype chain", () => {
      const error = new ServiceError("TEST", "Test error");

      expect(error instanceof Error).toBe(true);
      expect(error instanceof ServiceError).toBe(true);
    });

    it("should have correct name property", () => {
      const error = new ServiceError("TEST", "Test error");

      expect(error.name).toBe("ServiceError");
    });
  });
});

describe("ValidationError", () => {
  describe("Constructor", () => {
    it("should create error with message", () => {
      const error = new ValidationError("Invalid input data");

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(ValidationError);
      expect(error.message).toBe("Invalid input data");
      expect(error.name).toBe("ValidationError");
      expect(error.code).toBe("VALIDATION_ERROR");
      expect(error.details).toBeUndefined();
    });

    it("should create error with optional details", () => {
      const error = new ValidationError("Invalid email format", "Email must contain @");

      expect(error.message).toBe("Invalid email format");
      expect(error.details).toBe("Email must contain @");
      expect(error.code).toBe("VALIDATION_ERROR");
    });

    it("should always have VALIDATION_ERROR code", () => {
      const error1 = new ValidationError("Error 1");
      const error2 = new ValidationError("Error 2", "Details");

      expect(error1.code).toBe("VALIDATION_ERROR");
      expect(error2.code).toBe("VALIDATION_ERROR");
    });

    it("should preserve error stack trace", () => {
      const error = new ValidationError("Test validation error");

      expect(error.stack).toBeDefined();
      expect(typeof error.stack).toBe("string");
    });
  });

  describe("Error properties", () => {
    it("should be throwable and catchable", () => {
      expect(() => {
        throw new ValidationError("Invalid data");
      }).toThrow(ValidationError);
    });

    it("should maintain prototype chain", () => {
      const error = new ValidationError("Test error");

      expect(error instanceof Error).toBe(true);
      expect(error instanceof ValidationError).toBe(true);
    });

    it("should have correct name property", () => {
      const error = new ValidationError("Test error");

      expect(error.name).toBe("ValidationError");
    });
  });
});

describe("isDuplicateKeyError", () => {
  describe("Valid duplicate key errors", () => {
    it("should return true for error with code 23505", () => {
      const error = { code: "23505", message: "Duplicate key violation" };

      expect(isDuplicateKeyError(error)).toBe(true);
    });

    it("should return true for Supabase duplicate key error", () => {
      const error = {
        code: "23505",
        message: 'duplicate key value violates unique constraint "user_favorites_pkey"',
        details: "Key (user_id, ward_id)=(123, 456) already exists.",
      };

      expect(isDuplicateKeyError(error)).toBe(true);
    });

    it("should return true for error with only code property", () => {
      const error = { code: "23505" };

      expect(isDuplicateKeyError(error)).toBe(true);
    });
  });

  describe("Invalid duplicate key errors", () => {
    it("should return false for error with different code", () => {
      const error = { code: "23503", message: "Foreign key violation" };

      expect(isDuplicateKeyError(error)).toBe(false);
    });

    it("should return false for error without code property", () => {
      const error = { message: "Some error" };

      expect(isDuplicateKeyError(error)).toBe(false);
    });

    it("should return false for null", () => {
      expect(isDuplicateKeyError(null)).toBe(false);
    });

    it("should return false for undefined", () => {
      expect(isDuplicateKeyError(undefined)).toBe(false);
    });

    it("should return false for string error", () => {
      expect(isDuplicateKeyError("23505")).toBe(false);
    });

    it("should return false for number error", () => {
      expect(isDuplicateKeyError(23505)).toBe(false);
    });

    it("should return false for Error instance without code", () => {
      const error = new Error("Duplicate key");

      expect(isDuplicateKeyError(error)).toBe(false);
    });

    it("should return false for empty object", () => {
      expect(isDuplicateKeyError({})).toBe(false);
    });
  });
});

describe("isValidationError", () => {
  describe("Valid validation errors", () => {
    it("should return true for ValidationError instance", () => {
      const error = new ValidationError("Invalid input");

      expect(isValidationError(error)).toBe(true);
    });

    it("should return true for object with VALIDATION_ERROR code", () => {
      const error = { code: "VALIDATION_ERROR", message: "Invalid data" };

      expect(isValidationError(error)).toBe(true);
    });

    it("should return true for ValidationError with details", () => {
      const error = new ValidationError("Invalid email", "Must contain @");

      expect(isValidationError(error)).toBe(true);
    });

    it("should return true for custom validation error object", () => {
      const error = {
        code: "VALIDATION_ERROR",
        message: "Invalid ward name",
        details: "Name exceeds 255 characters",
      };

      expect(isValidationError(error)).toBe(true);
    });
  });

  describe("Invalid validation errors", () => {
    it("should return false for error with different code", () => {
      const error = { code: "DATABASE_ERROR", message: "Query failed" };

      expect(isValidationError(error)).toBe(false);
    });

    it("should return false for error without code property", () => {
      const error = { message: "Some error" };

      expect(isValidationError(error)).toBe(false);
    });

    it("should return false for ServiceError", () => {
      const error = new ServiceError("TEST_ERROR", "Test message");

      expect(isValidationError(error)).toBe(false);
    });

    it("should return false for generic Error", () => {
      const error = new Error("Generic error");

      expect(isValidationError(error)).toBe(false);
    });

    it("should return false for null", () => {
      expect(isValidationError(null)).toBe(false);
    });

    it("should return false for undefined", () => {
      expect(isValidationError(undefined)).toBe(false);
    });

    it("should return false for string error", () => {
      expect(isValidationError("VALIDATION_ERROR")).toBe(false);
    });

    it("should return false for empty object", () => {
      expect(isValidationError({})).toBe(false);
    });
  });
});

describe("isEmailNotVerifiedError", () => {
  describe("Valid email not verified errors", () => {
    it("should return true for error with EMAIL_NOT_VERIFIED code", () => {
      const error = { code: "EMAIL_NOT_VERIFIED", message: "Email not verified" };

      expect(isEmailNotVerifiedError(error)).toBe(true);
    });

    it("should return true for auth error object", () => {
      const error = {
        code: "EMAIL_NOT_VERIFIED",
        message: "Email address not verified",
      };

      expect(isEmailNotVerifiedError(error)).toBe(true);
    });

    it("should return true for error with only code property", () => {
      const error = { code: "EMAIL_NOT_VERIFIED" };

      expect(isEmailNotVerifiedError(error)).toBe(true);
    });
  });

  describe("Invalid email not verified errors", () => {
    it("should return false for error with different code", () => {
      const error = { code: "UNAUTHORIZED", message: "Not authenticated" };

      expect(isEmailNotVerifiedError(error)).toBe(false);
    });

    it("should return false for error without code property", () => {
      const error = { message: "Email not verified" };

      expect(isEmailNotVerifiedError(error)).toBe(false);
    });

    it("should return false for null", () => {
      expect(isEmailNotVerifiedError(null)).toBe(false);
    });

    it("should return false for undefined", () => {
      expect(isEmailNotVerifiedError(undefined)).toBe(false);
    });

    it("should return false for string error", () => {
      expect(isEmailNotVerifiedError("EMAIL_NOT_VERIFIED")).toBe(false);
    });

    it("should return false for empty object", () => {
      expect(isEmailNotVerifiedError({})).toBe(false);
    });

    it("should return false for generic Error", () => {
      const error = new Error("Email not verified");

      expect(isEmailNotVerifiedError(error)).toBe(false);
    });
  });
});

describe("getErrorMessage", () => {
  describe("Error instances", () => {
    it("should extract message from Error instance", () => {
      const error = new Error("Something went wrong");

      expect(getErrorMessage(error)).toBe("Something went wrong");
    });

    it("should extract message from ServiceError", () => {
      const error = new ServiceError("TEST_ERROR", "Service failed");

      expect(getErrorMessage(error)).toBe("Service failed");
    });

    it("should extract message from ValidationError", () => {
      const error = new ValidationError("Invalid input data");

      expect(getErrorMessage(error)).toBe("Invalid input data");
    });

    it("should handle Error with empty message", () => {
      const error = new Error("");

      expect(getErrorMessage(error)).toBe("");
    });
  });

  describe("String errors", () => {
    it("should return string error as-is", () => {
      expect(getErrorMessage("Something went wrong")).toBe("Something went wrong");
    });

    it("should handle empty string", () => {
      expect(getErrorMessage("")).toBe("");
    });

    it("should handle string with special characters", () => {
      expect(getErrorMessage("Error: <script>alert(1)</script>")).toBe("Error: <script>alert(1)</script>");
    });

    it("should handle string with Polish characters", () => {
      expect(getErrorMessage("Błąd połączenia z bazą danych")).toBe("Błąd połączenia z bazą danych");
    });
  });

  describe("Object errors", () => {
    it("should extract message from object with message property", () => {
      const error = { message: "Database connection failed" };

      expect(getErrorMessage(error)).toBe("Database connection failed");
    });

    it("should extract message from Supabase error", () => {
      const error = {
        code: "23505",
        message: "Duplicate key violation",
        details: "Key already exists",
      };

      expect(getErrorMessage(error)).toBe("Duplicate key violation");
    });

    it("should convert non-string message to string", () => {
      const error = { message: 12345 };

      expect(getErrorMessage(error)).toBe("12345");
    });

    it("should handle null message property", () => {
      const error = { message: null };

      expect(getErrorMessage(error)).toBe("null");
    });

    it("should handle undefined message property", () => {
      const error = { message: undefined };

      expect(getErrorMessage(error)).toBe("undefined");
    });
  });

  describe("Edge cases", () => {
    it("should return default message for null", () => {
      expect(getErrorMessage(null)).toBe("An unknown error occurred");
    });

    it("should return default message for undefined", () => {
      expect(getErrorMessage(undefined)).toBe("An unknown error occurred");
    });

    it("should return default message for number", () => {
      expect(getErrorMessage(123)).toBe("An unknown error occurred");
    });

    it("should return default message for boolean", () => {
      expect(getErrorMessage(true)).toBe("An unknown error occurred");
    });

    it("should return default message for empty object", () => {
      expect(getErrorMessage({})).toBe("An unknown error occurred");
    });

    it("should return default message for array", () => {
      expect(getErrorMessage([])).toBe("An unknown error occurred");
    });

    it("should return default message for array with values", () => {
      expect(getErrorMessage(["error1", "error2"])).toBe("An unknown error occurred");
    });

    it("should handle object with non-message properties", () => {
      const error = { code: "ERROR", details: "Some details" };

      expect(getErrorMessage(error)).toBe("An unknown error occurred");
    });
  });

  describe("Security - potential injection attempts", () => {
    it("should handle XSS attempt in message", () => {
      const error = new Error("<script>alert('XSS')</script>");

      expect(getErrorMessage(error)).toBe("<script>alert('XSS')</script>");
    });

    it("should handle SQL injection attempt in message", () => {
      const error = { message: "'; DROP TABLE users--" };

      expect(getErrorMessage(error)).toBe("'; DROP TABLE users--");
    });

    it("should handle newlines and special characters", () => {
      const error = new Error("Error\nwith\nnewlines\tand\ttabs");

      expect(getErrorMessage(error)).toBe("Error\nwith\nnewlines\tand\ttabs");
    });
  });
});
