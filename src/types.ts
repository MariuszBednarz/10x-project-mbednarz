export interface HospitalWardDTO {
  id: string;
  wardName: string;
  wardLink: string | null;
  district: string | null;
  hospitalName: string;
  availablePlaces: string;
  lastUpdated: string | null;
  scrapedAt: string;
  created_at: string;
  updated_at: string;
}

export interface UserFavoriteDTO {
  id: string;
  user_id: string;
  ward_name: string;
  created_at: string;
}

export interface AIInsightDTO {
  id: string;
  insight_text: string;
  generated_at: string;
  expires_at: string;
  created_at: string;
  updated_at: string;
}

export interface WardAggregatedDTO {
  wardName: string;
  hospitalCount: number;
  totalPlaces: number;
  isFavorite: boolean;
  lastScrapedAt: string;
}

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

export interface HospitalsListResponseDTO {
  data: HospitalWardDTO[];
  meta: {
    total: number;
    limit: number;
    offset: number;
  };
}

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

export interface AddFavoriteCommand {
  ward_name: string;
}

export interface PaginationQueryParams {
  limit?: number;
  offset?: number;
}

export interface WardsQueryParams extends PaginationQueryParams {
  search?: string;
  favorites_only?: boolean;
}

export interface HospitalsQueryParams extends PaginationQueryParams {
  district?: string;
  search?: string;
  order?: "availablePlaces.desc" | "hospitalName.asc";
}

export interface ErrorResponseDTO {
  code: string;
  message: string;
  details?: string;
  hint?: string;
}

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

export interface APIResponse<T> {
  data: T;
  meta?: Record<string, unknown>;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    limit: number;
    offset: number;
    hasMore?: boolean;
  };
}
