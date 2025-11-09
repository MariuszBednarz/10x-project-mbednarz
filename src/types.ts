/**
 * Shared Types - Frontend & Backend DTOs
 *
 * This file contains Data Transfer Objects and shared types for the HosLU API
 *
 * @see .ai/api-plan.md for API contract specifications
 * @see .ai/api-implementation-plan.md for implementation details
 */

// ===========================================
// ENTITY TYPES (Database Records)
// ===========================================

/**
 * Hospital Ward - Individual hospital record with bed availability
 * Maps to: hospital_wards table
 */
export interface HospitalWardDTO {
  id: string;
  wardName: string;
  wardLink: string | null;
  district: string | null;
  hospitalName: string;
  availablePlaces: string; // VARCHAR - handle conversion carefully
  lastUpdated: string | null; // ⚠️ Unreliable - from source HTML
  scrapedAt: string; // ✅ Reliable - our timestamp
  created_at: string;
  updated_at: string;
}

/**
 * User Favorite - User's favorited ward
 * Maps to: user_favorites table
 */
export interface UserFavoriteDTO {
  id: string;
  user_id: string;
  ward_name: string;
  created_at: string;
}

/**
 * AI Insight - Cached AI-generated insight
 * Maps to: ai_insights table
 */
export interface AIInsightDTO {
  id: string;
  insight_text: string;
  generated_at: string;
  expires_at: string;
  created_at: string;
  updated_at: string;
}

// ===========================================
// API RESPONSE TYPES
// ===========================================

/**
 * Ward Aggregated - Single ward with statistics
 * Used in: GET /api/wards
 */
export interface WardAggregatedDTO {
  wardName: string;
  hospitalCount: number;
  totalPlaces: number;
  isFavorite: boolean;
  lastScrapedAt: string;
}

/**
 * Wards List Response - Response for GET /api/wards
 */
export interface WardsListResponseDTO {
  data: WardAggregatedDTO[];
  meta: {
    total: number;
    limit: number;
    offset: number;
    lastScrapeTime: string;
    isStale: boolean;
  };
}

/**
 * Hospitals List Response - Response for GET /api/wards/{wardName}/hospitals
 */
export interface HospitalsListResponseDTO {
  data: HospitalWardDTO[];
  meta: {
    total: number;
    limit: number;
    offset: number;
  };
}

/**
 * Favorites List Response - Response for GET /api/users/me/favorites
 */
export interface FavoritesListResponseDTO {
  data: FavoriteWithStatsDTO[];
  meta: {
    total: number;
    limit: number;
    offset: number;
  };
}

/**
 * Favorite with Stats - User favorite with live statistics
 * Used in: GET /api/users/me/favorites
 */
export interface FavoriteWithStatsDTO {
  id: string;
  wardName: string;
  hospitalCount: number;
  totalPlaces: number;
  createdAt: string;
}

/**
 * Current Insight Response - Response for GET /api/insights/current
 */
export interface CurrentInsightResponseDTO {
  insight_text: string;
  generated_at: string;
  expires_at: string;
}

/**
 * System Status Response - Response for GET /api/status
 *
 * Note: PostgreSQL function returns JSON type.
 * Use parseSystemStatus() helper to convert from database.types.ts Json to SystemStatusDTO
 */
export interface SystemStatusDTO {
  isStale: boolean;
  lastScrapeTime: string;
  hoursSinceLastScrape: number;
  totalWards: number;
  totalHospitals: number;
  scrapingSuccessRate30d: number;
}

/**
 * Type guard: Parse Json from get_system_status() to SystemStatusDTO
 *
 * @example
 * const { data } = await supabase.rpc('get_system_status');
 * const status = parseSystemStatus(data);
 */
export function parseSystemStatus(json: unknown): SystemStatusDTO {
  if (!json || typeof json !== "object") {
    throw new Error("Invalid system status response");
  }

  const obj = json as Record<string, unknown>;

  return {
    isStale: Boolean(obj.isStale),
    lastScrapeTime: String(obj.lastScrapeTime || ""),
    hoursSinceLastScrape: Number(obj.hoursSinceLastScrape || 0),
    totalWards: Number(obj.totalWards || 0),
    totalHospitals: Number(obj.totalHospitals || 0),
    scrapingSuccessRate30d: Number(obj.scrapingSuccessRate30d || 0),
  };
}

// ===========================================
// COMMAND TYPES (API Inputs)
// ===========================================

/**
 * Add Favorite Command - Input for POST /api/users/me/favorites
 */
export interface AddFavoriteCommand {
  ward_name: string;
}

// ===========================================
// QUERY PARAMETER TYPES
// ===========================================

/**
 * Pagination Query Parameters
 * Used across multiple endpoints
 */
export interface PaginationQueryParams {
  limit?: number; // default: 50, max: 100
  offset?: number; // default: 0
}

/**
 * Wards Query Parameters - GET /api/wards
 *
 * Note: Sorting is fixed at database level (total_places DESC).
 * For alternative sorting, implement client-side after fetching data.
 */
export interface WardsQueryParams extends PaginationQueryParams {
  search?: string;
  favorites_only?: boolean;
}

/**
 * Hospitals Query Parameters - GET /api/wards/{wardName}/hospitals
 */
export interface HospitalsQueryParams extends PaginationQueryParams {
  district?: string;
  search?: string;
  order?: "availablePlaces.desc" | "hospitalName.asc";
}

// ===========================================
// ERROR TYPES
// ===========================================

/**
 * Standard Error Response
 * Used across all endpoints
 */
export interface ErrorResponseDTO {
  code: string;
  message: string;
  details?: string;
  hint?: string;
}

/**
 * Common Error Codes
 */
export enum ErrorCode {
  VALIDATION_ERROR = "VALIDATION_ERROR",
  UNAUTHORIZED = "UNAUTHORIZED",
  EMAIL_NOT_VERIFIED = "EMAIL_NOT_VERIFIED",
  NOT_FOUND = "NOT_FOUND",
  CONFLICT = "CONFLICT",
  INTERNAL_SERVER_ERROR = "INTERNAL_SERVER_ERROR",
  BAD_REQUEST = "BAD_REQUEST",
  FORBIDDEN = "FORBIDDEN",
  RATE_LIMIT_EXCEEDED = "RATE_LIMIT_EXCEEDED",
  UNPROCESSABLE_ENTITY = "UNPROCESSABLE_ENTITY",
}

// ===========================================
// HELPER TYPES
// ===========================================

/**
 * API Response Wrapper (Generic)
 */
export interface APIResponse<T> {
  data: T;
  meta?: Record<string, unknown>;
}

/**
 * Paginated Response Wrapper (Generic)
 */
export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    limit: number;
    offset: number;
    hasMore?: boolean;
  };
}
