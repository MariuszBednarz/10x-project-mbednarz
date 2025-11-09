/**
 * Type guards and utility functions for type-safe operations
 * Provides runtime type checking and data conversions
 */

import type { AvailablePlacesRaw, AvailablePlacesParsed } from "@/types";

/**
 * Parse availablePlaces from raw database string to integer
 * Handles non-numeric values gracefully by returning 0
 *
 * @param raw - Raw string value from database (VARCHAR)
 * @returns Parsed integer (may be negative for overbooked wards)
 *
 * @example
 * parseAvailablePlaces("12") // 12
 * parseAvailablePlaces("-3") // -3
 * parseAvailablePlaces("N/A") // 0
 * parseAvailablePlaces("") // 0
 */
export function parseAvailablePlaces(raw: AvailablePlacesRaw): AvailablePlacesParsed {
  // Handle empty or null values
  if (!raw || raw.trim() === "") {
    return 0;
  }

  // Check if string is a valid integer (positive or negative)
  const integerRegex = /^-?\d+$/;
  if (!integerRegex.test(raw.trim())) {
    return 0;
  }

  const parsed = parseInt(raw, 10);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Type guard to check if a string is a valid UUID v4
 * Used for validating path parameters (favorite IDs, etc.)
 *
 * @param value - String to check
 * @returns true if value matches UUID v4 format
 *
 * @example
 * isValidUUID("550e8400-e29b-41d4-a716-446655440000") // true
 * isValidUUID("not-a-uuid") // false
 * isValidUUID("") // false
 */
export function isValidUUID(value: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value);
}

/**
 * Safely parse a string to integer with default value
 * Used for parsing query parameters (limit, offset)
 *
 * @param value - String to parse
 * @param defaultValue - Default value if parsing fails
 * @returns Parsed integer or default value
 *
 * @example
 * safeParseInt("50", 10) // 50
 * safeParseInt("invalid", 10) // 10
 * safeParseInt("", 10) // 10
 */
export function safeParseInt(value: string | null | undefined, defaultValue: number): number {
  if (!value) return defaultValue;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
}

/**
 * Safely parse a string to boolean
 * Used for parsing query parameters (favorites_only)
 *
 * @param value - String to parse
 * @param defaultValue - Default value if parsing fails
 * @returns Parsed boolean or default value
 *
 * @example
 * safeParseBoolean("true", false) // true
 * safeParseBoolean("false", true) // false
 * safeParseBoolean("1", false) // true
 * safeParseBoolean("0", false) // false
 * safeParseBoolean("yes", false) // false (strict parsing)
 */
export function safeParseBoolean(value: string | null | undefined, defaultValue: boolean): boolean {
  if (!value) return defaultValue;
  const lowercased = value.toLowerCase().trim();
  if (lowercased === "true" || lowercased === "1") return true;
  if (lowercased === "false" || lowercased === "0") return false;
  return defaultValue;
}

/**
 * Validate ward name format
 * Ensures ward name meets database constraints
 *
 * @param wardName - Ward name to validate
 * @returns Object with isValid flag and optional error message
 *
 * @example
 * validateWardName("Kardiologia") // { isValid: true }
 * validateWardName("") // { isValid: false, error: "Ward name cannot be empty" }
 * validateWardName("a".repeat(300)) // { isValid: false, error: "Ward name exceeds 255 characters" }
 */
export function validateWardName(wardName: string): { isValid: boolean; error?: string } {
  if (!wardName || wardName.trim() === "") {
    return { isValid: false, error: "Ward name cannot be empty" };
  }

  if (wardName.length > 255) {
    return { isValid: false, error: "Ward name exceeds 255 characters" };
  }

  return { isValid: true };
}

/**
 * Validate email format (basic check)
 * Used for client-side validation before API calls
 *
 * @param email - Email address to validate
 * @returns true if email format is valid
 *
 * @example
 * isValidEmail("user@example.com") // true
 * isValidEmail("invalid.email") // false
 * isValidEmail("") // false
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
