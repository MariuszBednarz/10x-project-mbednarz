/**
 * Text Utility Functions
 * Handles edge cases like truncation, special characters, encoding
 */

/**
 * Truncate text to max length with ellipsis
 * @param text - Text to truncate
 * @param maxLength - Maximum length (default 30)
 * @returns Truncated text with ellipsis if needed
 */
export function truncateText(text: string, maxLength = 30): string {
  if (!text) return "";
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + "...";
}

/**
 * Normalize ward name for display
 * Handles Polish characters, spacing, case
 * @param wardName - Raw ward name from API
 * @returns Normalized display name
 */
export function normalizeWardName(wardName: string): string {
  if (!wardName) return "";
  // Trim whitespace
  return wardName.trim();
}

/**
 * Sanitize ward name for URL encoding
 * Handles special characters, spaces, Polish diacritics
 * @param wardName - Ward name to sanitize
 * @returns URL-safe ward name
 */
export function sanitizeWardName(wardName: string): string {
  if (!wardName) return "";
  // encodeURIComponent handles all special characters and Polish diacritics
  return encodeURIComponent(wardName.trim());
}

/**
 * Decode ward name from URL
 * Reverses URL encoding, handles special characters
 * @param encodedWardName - URL-encoded ward name
 * @returns Decoded ward name
 */
export function decodeWardName(encodedWardName: string): string {
  if (!encodedWardName) return "";
  try {
    return decodeURIComponent(encodedWardName);
  } catch {
    // Fallback if decoding fails
    return encodedWardName;
  }
}

/**
 * Check if string is empty or whitespace only
 * @param text - Text to check
 * @returns true if empty or whitespace
 */
export function isEmptyOrWhitespace(text: string): boolean {
  return !text || text.trim().length === 0;
}

/**
 * Get initials from ward name
 * Useful for fallback avatars or badges
 * @param wardName - Ward name
 * @returns First 2 characters uppercase
 */
export function getInitials(wardName: string): string {
  if (!wardName) return "?";
  const trimmed = wardName.trim();
  if (!trimmed) return "?";
  const words = trimmed.split(" ");
  if (words.length > 1) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return trimmed.substring(0, 2).toUpperCase();
}

/**
 * Format search query for API call
 * Validates and trims query
 * @param query - Raw search query
 * @returns Validated query or undefined
 */
export function formatSearchQuery(query: string): string | undefined {
  if (!query) return undefined;
  const trimmed = query.trim();
  // Min 2 chars per spec
  if (trimmed.length < 2) return undefined;
  // Max 100 chars per spec
  if (trimmed.length > 100) return trimmed.substring(0, 100);
  return trimmed;
}
