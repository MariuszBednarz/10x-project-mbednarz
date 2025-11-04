# REST API Implementation Plan - HosLU MVP

> **✅ IMPLEMENTATION STATUS**: All 10 API endpoints, 6 services, and 5 validation schemas have been fully implemented.  
> **📋 NEXT PHASE**: Testing, database functions deployment, and production deployment.  
> **Last Updated**: 2025-10-29

## Table of Contents

1. [Overview](#1-overview)
2. [Project Structure](#2-project-structure)
3. [Services Implementation](#3-services-implementation)
4. [API Endpoints Implementation](#4-api-endpoints-implementation)
5. [Validation Schemas](#5-validation-schemas)
6. [Error Handling](#6-error-handling)
7. [Security Considerations](#7-security-considerations)
8. [Testing Strategy](#8-testing-strategy)
9. [Implementation Checklist](#9-implementation-checklist)

---

## 1. Overview

This document provides implementation patterns, code examples, and technical details for building the HosLU REST API.

> **Note**: For API contract (HTTP interface, request/response formats), see `api-plan.md`

### Current Implementation Status

**✅ COMPLETED (All Core Features)**:

- All 10 API endpoints (wards, hospitals, favorites, insights, status, logs, user profile)
- All 6 services with business logic
- All 5 validation schemas (Zod)
- All 4 utility modules (response, error, auth, type-guards)
- Complete error handling patterns
- Authentication and authorization helpers

**📋 IN PROGRESS (Testing & Deployment)**:

- Unit tests for services
- Integration testing
- Database functions deployment
- Production environment setup

### Technology Stack

- **Framework**: Astro 5 with server-side endpoints
- **Database**: Supabase (PostgreSQL with RLS)
- **Authentication**: Supabase Auth (JWT tokens)
- **Validation**: Zod schemas
- **Language**: TypeScript 5

### Key Principles

1. **Security First**: JWT authentication + RLS policies
2. **Type Safety**: Full TypeScript coverage with generated types
3. **Validation**: Zod schemas for all inputs
4. **Error Handling**: Early returns with standardized error responses
5. **Service Layer**: Extract business logic from endpoints
6. **Performance**: Leverage database indexes and helper functions

### Document Purpose

This guide contains:

- TypeScript/Astro implementation patterns
- Service layer architecture
- Validation schemas (Zod)
- Error handling utilities
- Testing strategies
- PostgreSQL functions (SQL code)
- Common pitfalls and solutions

---

## 2. Project Structure

Create the following directory structure:

```
src/
├── pages/
│   └── api/
│       ├── wards/
│       │   ├── index.ts              # GET /api/wards
│       │   └── [wardName]/
│       │       └── hospitals.ts      # GET /api/wards/{wardName}/hospitals
│       ├── users/
│       │   └── me/
│       │       ├── favorites/
│       │       │   ├── index.ts      # GET/POST /api/users/me/favorites
│       │       │   └── by-ward/
│       │       │       └── [wardName].ts  # DELETE /api/users/me/favorites/by-ward/{wardName}
│       │       └── index.ts          # GET /api/users/me, DELETE /api/users/me
│       ├── insights/
│       │   └── current.ts            # GET /api/insights/current
│       ├── status.ts                 # GET /api/status
│       └── logs/
│           └── scraping.ts           # GET /api/logs/scraping
├── lib/
│   ├── services/
│   │   ├── wards.service.ts          # Ward aggregation logic
│   │   ├── hospitals.service.ts      # Hospital queries
│   │   ├── favorites.service.ts      # Favorites management
│   │   ├── insights.service.ts       # AI insights fetching
│   │   ├── status.service.ts         # System status
│   │   └── logs.service.ts           # Scraping logs
│   ├── validation/
│   │   ├── wards.schema.ts           # Zod schemas for wards
│   │   ├── hospitals.schema.ts       # Zod schemas for hospitals
│   │   ├── favorites.schema.ts       # Zod schemas for favorites
│   │   └── common.schema.ts          # Shared schemas (pagination, etc.)
│   └── utils/
│       ├── api-response.ts           # Standardized response helpers
│       ├── error-handler.ts          # Error handling utilities
│       └── auth.ts                   # Authentication helpers
├── middleware/
│   └── index.ts                      # Existing Supabase middleware
└── types.ts                          # Existing DTOs
```

---

## 3. Services Implementation

Services encapsulate business logic and database operations. They use the Supabase client passed from the API route.

### 3.1 WardsService (`src/lib/services/wards.service.ts`)

**Purpose**: Handle ward aggregation, search, and filtering.

**Methods**:

```typescript
export class WardsService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Get aggregated wards with statistics
   * Calls PostgreSQL function: get_wards_aggregated()
   */
  async getWards(params: WardsQueryParams, userId: string): Promise<WardsListResponseDTO>;

  /**
   * Check if data is stale (>12 hours old)
   * Calls PostgreSQL function: is_data_stale()
   */
  async isDataStale(): Promise<boolean>;

  /**
   * Get last scrape timestamp
   * Calls PostgreSQL function: get_last_scrape_time()
   */
  async getLastScrapeTime(): Promise<string>;
}
```

**Implementation Details**:

- Use `supabase.rpc('get_wards_aggregated', { ... })` for aggregation
- ⚠️ **CRITICAL**: Always pass authenticated user.id (never NULL) - NULL breaks isFavorite detection
- Handle `favorites_only` filter by passing `p_favorites_only` parameter
- Implement search using `p_search` parameter (PostgreSQL handles trigram matching)
- Calculate `hasMore` based on returned count vs limit
- Call helper functions for metadata: `is_data_stale()`, `get_last_scrape_time()`
- **Sorting:** Function returns fixed order by `total_places DESC`. For alternative sorting (e.g., alphabetical), implement client-side sorting after fetching data

**Error Handling**:

- Catch database errors and throw custom `ServiceError`
- Handle empty results gracefully (return empty array, not error)
- Log errors with context (user ID, search term)

**PostgreSQL Function Required**:

```sql
CREATE OR REPLACE FUNCTION get_wards_aggregated(
  p_search TEXT DEFAULT NULL,
  p_user_id UUID DEFAULT NULL,
  p_favorites_only BOOLEAN DEFAULT FALSE
)
RETURNS TABLE (
  "wardName" VARCHAR,
  "hospitalCount" BIGINT,
  "totalPlaces" INTEGER,
  "isFavorite" BOOLEAN,
  "lastScrapedAt" TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    hw."wardName",
    COUNT(DISTINCT hw."hospitalName")::BIGINT as hospital_count,
    SUM(
      CASE
        WHEN hw."availablePlaces" ~ '^-?[0-9]+$'
        THEN hw."availablePlaces"::INTEGER
        ELSE 0
      END
    )::INTEGER as total_places,
    EXISTS(
      SELECT 1 FROM user_favorites uf
      WHERE uf.user_id = p_user_id
      AND uf.ward_name = hw."wardName"
    ) as is_favorite,
    MAX(hw."scrapedAt") as last_scraped_at
  FROM hospital_wards hw
  WHERE
    (p_search IS NULL OR hw."wardName" ILIKE '%' || p_search || '%')
    AND (
      NOT p_favorites_only
      OR EXISTS(
        SELECT 1 FROM user_favorites uf
        WHERE uf.user_id = p_user_id
        AND uf.ward_name = hw."wardName"
      )
    )
  GROUP BY hw."wardName"
  ORDER BY total_places DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper functions
CREATE OR REPLACE FUNCTION is_data_stale() RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    SELECT MAX("scrapedAt") < NOW() - INTERVAL '12 hours'
    FROM hospital_wards
  );
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_last_scrape_time()
RETURNS TIMESTAMP WITH TIME ZONE AS $$
BEGIN
  RETURN (SELECT MAX("scrapedAt") FROM hospital_wards);
END;
$$ LANGUAGE plpgsql;
```

### 3.2 HospitalsService (`src/lib/services/hospitals.service.ts`)

**Purpose**: Query hospitals by ward with filtering and sorting.

**Methods**:

```typescript
export class HospitalsService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Get hospitals for a specific ward
   * Queries hospital_wards table with filters
   */
  async getHospitalsByWard(wardName: string, params: HospitalsQueryParams): Promise<HospitalsListResponseDTO>;

  /**
   * Check if ward exists
   */
  async wardExists(wardName: string): Promise<boolean>;
}
```

**Implementation Details**:

- Use Supabase query builder: `from('hospital_wards').select('*')`
- Filter by `wardName` (exact match): `.eq('wardName', wardName)`
- Apply district filter if provided: `.eq('district', params.district)`
- Apply search filter: `.ilike('hospitalName', `%${params.search}%`)`
- Sort by available places (handle VARCHAR to INTEGER conversion):
  ```typescript
  .order('availablePlaces', { ascending: false, nullsFirst: false })
  ```
- Implement pagination: `.range(offset, offset + limit - 1)`
- Get total count: `{ count: 'exact' }`

**Error Handling**:

- Return 404 if ward doesn't exist
- Handle invalid district gracefully (empty results)
- Validate wardName format (URL decode first)

### 3.3 FavoritesService (`src/lib/services/favorites.service.ts`)

**Purpose**: Manage user favorites (CRUD operations).

**Methods**:

```typescript
export class FavoritesService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Get user favorites with live statistics
   * Calls PostgreSQL function: get_user_favorites_with_stats()
   */
  async getUserFavorites(userId: string, params: PaginationQueryParams): Promise<FavoritesListResponseDTO>;

  /**
   * Add ward to favorites
   * Inserts into user_favorites table
   */
  async addFavorite(userId: string, command: AddFavoriteCommand): Promise<UserFavoriteDTO>;

  /**
   * Remove favorite by ward name
   * Deletes from user_favorites table by ward name (natural identifier)
   */
  async removeFavoriteByWardName(userId: string, wardName: string): Promise<boolean>;
}
```

**PostgreSQL Function Required**:

```sql
CREATE OR REPLACE FUNCTION get_user_favorites_with_stats()
RETURNS TABLE (
  id UUID,
  "wardName" VARCHAR,
  "hospitalCount" BIGINT,
  "totalPlaces" INTEGER,
  "createdAt" TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    f.id,
    f.ward_name as "wardName",
    COUNT(DISTINCT h."hospitalName")::BIGINT as hospital_count,
    SUM(
      CASE
        WHEN h."availablePlaces" ~ '^-?[0-9]+$'
        THEN h."availablePlaces"::INTEGER
        ELSE 0
      END
    )::INTEGER as total_places,
    f.created_at as "createdAt"
  FROM user_favorites f
  LEFT JOIN hospital_wards h ON h."wardName" = f.ward_name
  WHERE f.user_id = auth.uid()
  GROUP BY f.id, f.ward_name, f.created_at
  ORDER BY f.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Implementation Details**:

- **Get Favorites**: Use `supabase.rpc('get_user_favorites_with_stats')`
  - RLS automatically filters by authenticated user
  - Apply pagination to RPC result
  - Calculate total count

- **Add Favorite**:

  ```typescript
  const { data, error } = await supabase
    .from("user_favorites")
    .insert({
      user_id: userId,
      ward_name: command.ward_name,
    })
    .select()
    .single();
  ```

  - Handle duplicate error (code: 23505) → return 409 Conflict
  - RLS policy enforces `user_id` matches authenticated user

- **Remove Favorite by Ward Name**:

  ```typescript
  const { error, count } = await supabase
    .from("user_favorites")
    .delete({ count: "exact" })
    .eq("user_id", userId)
    .eq("ward_name", wardName);

  return count !== null && count > 0;
  ```

  - Returns `true` if deleted, `false` if not found (for 404 handling)
  - RLS policy provides additional protection
  - Uses ward name as natural identifier (no UUID lookup needed)

**Error Handling**:

- 409 Conflict for duplicate favorites
- 404 for non-existent favorites on delete
- 422 for validation errors (ward_name too long)
- Validate ward_name format (max 255 chars, non-empty)

### 3.4 InsightsService (`src/lib/services/insights.service.ts`)

**Purpose**: Fetch current AI-generated insights.

**Methods**:

```typescript
export class InsightsService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Get current active insight (non-expired)
   * Queries ai_insights table with RLS filter
   */
  async getCurrentInsight(): Promise<AIInsightDTO | null>;
}
```

**Implementation Details**:

```typescript
const { data, error } = await supabase
  .from("ai_insights")
  .select("insight_text, generated_at, expires_at")
  .gt("expires_at", new Date().toISOString())
  .order("generated_at", { ascending: false })
  .limit(1)
  .single();
```

- RLS policy automatically filters expired insights
- Return `null` if no active insight (not an error)
- Handle empty result gracefully (204 No Content)

**Error Handling**:

- Return 204 if no active insight
- Log but don't fail on query errors (graceful degradation)

### 3.5 StatusService (`src/lib/services/status.service.ts`)

**Purpose**: Provide system health and data freshness status.

**Methods**:

```typescript
export class StatusService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Get comprehensive system status
   * Calls PostgreSQL function: get_system_status()
   */
  async getSystemStatus(): Promise<SystemStatusDTO>;
}
```

**Implementation Details**:

```typescript
const { data, error } = await supabase.rpc("get_system_status");
```

**PostgreSQL Functions Required**:

```sql
CREATE OR REPLACE FUNCTION get_system_status()
RETURNS JSON AS $$
DECLARE
  result JSON;
  last_scrape TIMESTAMP WITH TIME ZONE;
BEGIN
  last_scrape := get_last_scrape_time();

  SELECT json_build_object(
    'isStale', is_data_stale(),
    'lastScrapeTime', last_scrape,
    'hoursSinceLastScrape', EXTRACT(EPOCH FROM (NOW() - last_scrape)) / 3600,
    'totalWards', count_unique_wards(),
    'totalHospitals', count_unique_hospitals(),
    'scrapingSuccessRate30d', calculate_scraping_success_rate(30)
  ) INTO result;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper functions
CREATE OR REPLACE FUNCTION count_unique_wards() RETURNS INTEGER AS $$
BEGIN
  RETURN (SELECT COUNT(DISTINCT "wardName")::INTEGER FROM hospital_wards);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION count_unique_hospitals() RETURNS INTEGER AS $$
BEGIN
  RETURN (SELECT COUNT(DISTINCT "hospitalName")::INTEGER FROM hospital_wards);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION calculate_scraping_success_rate(days INTEGER)
RETURNS NUMERIC AS $$
BEGIN
  RETURN (
    SELECT
      CASE
        WHEN COUNT(*) = 0 THEN 0
        ELSE (COUNT(*) FILTER (WHERE status = 'success')::NUMERIC / COUNT(*) * 100)
      END
    FROM scraping_logs
    WHERE started_at >= NOW() - (days || ' days')::INTERVAL
  );
END;
$$ LANGUAGE plpgsql;
```

**Error Handling**:

- Return cached status on error (if available)
- Log errors but don't fail request
- Consider 5-minute cache for this endpoint

### 3.6 LogsService (`src/lib/services/logs.service.ts`)

**Purpose**: Query scraping operation logs (monitoring/debugging).

**Methods**:

```typescript
export class LogsService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Get scraping logs with filtering and pagination
   */
  async getScrapingLogs(params: ScrapingLogsQueryParams): Promise<ScrapingLogsListResponseDTO>;
}
```

**Implementation Details**:

```typescript
let query = supabase.from("scraping_logs").select("*", { count: "exact" }).order("started_at", { ascending: false });

if (params.status) {
  query = query.eq("status", params.status);
}

const { data, error, count } = await query.range(params.offset || 0, (params.offset || 0) + (params.limit || 10) - 1);
```

**Error Handling**:

- Handle empty results (return empty array)
- Validate status parameter (only 'success' or 'failure')

---

## 4. API Endpoints Implementation

Each endpoint follows the same pattern:

1. Export `prerender = false`
2. Validate authentication
3. Parse and validate request parameters
4. Call service method
5. Return standardized response

### 4.1 GET /api/wards (`src/pages/api/wards/index.ts`)

> **API Contract**: See `api-plan.md` → Section 4.1 for HTTP details (query params, response format)

**Implementation Pattern**:

```typescript
import type { APIRoute } from "astro";
import { WardsService } from "@/lib/services/wards.service";
import { validateWardsQuery } from "@/lib/validation/wards.schema";
import { createErrorResponse, createSuccessResponse } from "@/lib/utils/api-response";
import { getAuthenticatedUser } from "@/lib/utils/auth";

export const prerender = false;

export const GET: APIRoute = async ({ request, locals }) => {
  try {
    // 1. Authenticate user
    const user = await getAuthenticatedUser(locals.supabase);
    if (!user) {
      return createErrorResponse(401, "UNAUTHORIZED", "Missing or invalid authentication token");
    }

    // 2. Parse and validate query parameters
    const url = new URL(request.url);
    const queryParams = {
      search: url.searchParams.get("search") || undefined,
      favorites_only: url.searchParams.get("favorites_only") === "true",
      limit: parseInt(url.searchParams.get("limit") || "50"),
      offset: parseInt(url.searchParams.get("offset") || "0"),
    };

    const validatedParams = validateWardsQuery(queryParams);

    // 3. Call service
    const wardsService = new WardsService(locals.supabase);
    const result = await wardsService.getWards(validatedParams, user.id);

    // 4. Return response
    return createSuccessResponse(200, result);
  } catch (error) {
    if (error.code === "VALIDATION_ERROR") {
      return createErrorResponse(400, "BAD_REQUEST", error.message);
    }

    console.error("[GET /api/wards] Error:", error);
    return createErrorResponse(500, "INTERNAL_SERVER_ERROR", "Failed to fetch wards");
  }
};
```

**Key Implementation Notes**:

- Use `validateWardsQuery()` for Zod validation
- Service returns metadata (`isStale`, `lastScrapeTime`)
- Handle validation errors → 400
- Handle database errors → 500

### 4.2 GET /api/wards/[wardName]/hospitals (`src/pages/api/wards/[wardName]/hospitals.ts`)

> **API Contract**: See `api-plan.md` → Section 4.1 (GET /api/wards/{wardName}/hospitals)

**Implementation Pattern**:

```typescript
import type { APIRoute } from "astro";
import { HospitalsService } from "@/lib/services/hospitals.service";
import { validateHospitalsQuery } from "@/lib/validation/hospitals.schema";
import { createErrorResponse, createSuccessResponse } from "@/lib/utils/api-response";
import { getAuthenticatedUser } from "@/lib/utils/auth";

export const prerender = false;

export const GET: APIRoute = async ({ params, request, locals }) => {
  try {
    // 1. Authenticate user
    const user = await getAuthenticatedUser(locals.supabase);
    if (!user) {
      return createErrorResponse(401, "UNAUTHORIZED", "Missing or invalid authentication token");
    }

    // 2. Decode and validate ward name
    const wardName = decodeURIComponent(params.wardName || "");
    if (!wardName) {
      return createErrorResponse(400, "BAD_REQUEST", "Ward name is required");
    }

    // 3. Parse and validate query parameters
    const url = new URL(request.url);
    const queryParams = {
      district: url.searchParams.get("district") || undefined,
      search: url.searchParams.get("search") || undefined,
      order: url.searchParams.get("order") || "availablePlaces.desc",
      limit: parseInt(url.searchParams.get("limit") || "50"),
      offset: parseInt(url.searchParams.get("offset") || "0"),
    };

    const validatedParams = validateHospitalsQuery(queryParams);

    // 4. Call service
    const hospitalsService = new HospitalsService(locals.supabase);

    // Check if ward exists first
    const exists = await hospitalsService.wardExists(wardName);
    if (!exists) {
      return createErrorResponse(404, "NOT_FOUND", `Ward "${wardName}" does not exist`);
    }

    const result = await hospitalsService.getHospitalsByWard(wardName, validatedParams);

    // 5. Return response
    return createSuccessResponse(200, result);
  } catch (error) {
    if (error.code === "VALIDATION_ERROR") {
      return createErrorResponse(400, "BAD_REQUEST", error.message);
    }

    console.error(`[GET /api/wards/${params.wardName}/hospitals] Error:`, error);
    return createErrorResponse(500, "INTERNAL_SERVER_ERROR", "Failed to fetch hospitals");
  }
};
```

**Key Implementation Notes**:

- ⚠️ **CRITICAL**: Use `decodeURIComponent(params.wardName)` for URL-encoded names
- Check ward exists first → 404 if not found
- Validate query params with Zod

### 4.3 GET /api/users/me (`src/pages/api/users/me/index.ts`)

> **API Contract**: See `api-plan.md` → Section 4.5 (GET /api/users/me)

**Implementation Pattern**:

```typescript
export const GET: APIRoute = async ({ locals }) => {
  try {
    // 1. Authenticate user
    const user = await getAuthenticatedUser(locals.supabase);
    if (!user) {
      return createErrorResponse(401, "UNAUTHORIZED", "Missing or invalid authentication token");
    }

    // 2. Return user profile
    return createSuccessResponse(200, {
      id: user.id,
      email: user.email,
      email_confirmed_at: user.email_confirmed_at || null,
      created_at: user.created_at,
    });
  } catch (error: any) {
    // Handle email not verified error
    if (isEmailNotVerifiedError(error)) {
      return createErrorResponse(403, "FORBIDDEN", error.message, undefined, "Please verify your email address");
    }

    // Log and handle unexpected errors
    console.error("[GET /api/users/me] Error:", {
      message: getErrorMessage(error),
      stack: error?.stack,
    });

    return createErrorResponse(500, "INTERNAL_SERVER_ERROR", "Failed to fetch user profile");
  }
};
```

**Key Implementation Notes**:

- No service layer needed - data comes directly from `getAuthenticatedUser()`
- Returns only public profile fields (no sensitive data)
- Used for profile display in frontend

### 4.4 GET /api/users/me/favorites (`src/pages/api/users/me/favorites/index.ts`)

> **API Contract**: See `api-plan.md` → Section 4.2 (GET /api/users/me/favorites)

**Implementation Pattern**:

```typescript
export const GET: APIRoute = async ({ request, locals }) => {
  try {
    const user = await getAuthenticatedUser(locals.supabase);
    if (!user) {
      return createErrorResponse(401, "UNAUTHORIZED", "Missing or invalid authentication token");
    }

    const url = new URL(request.url);
    const queryParams = {
      limit: parseInt(url.searchParams.get("limit") || "50"),
      offset: parseInt(url.searchParams.get("offset") || "0"),
    };

    const validatedParams = validatePaginationQuery(queryParams);

    const favoritesService = new FavoritesService(locals.supabase);
    const result = await favoritesService.getUserFavorites(user.id, validatedParams);

    return createSuccessResponse(200, result);
  } catch (error) {
    console.error("[GET /api/users/me/favorites] Error:", error);
    return createErrorResponse(500, "INTERNAL_SERVER_ERROR", "Failed to fetch favorites");
  }
};
```

### 4.5 POST /api/users/me/favorites (`src/pages/api/users/me/favorites/index.ts`)

> **API Contract**: See `api-plan.md` → Section 4.2 (POST /api/users/me/favorites)

**Implementation Pattern**:

```typescript
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const user = await getAuthenticatedUser(locals.supabase);
    if (!user) {
      return createErrorResponse(401, "UNAUTHORIZED", "Missing or invalid authentication token");
    }

    // Parse and validate request body
    const body = await request.json();
    const command = validateAddFavoriteCommand(body);

    const favoritesService = new FavoritesService(locals.supabase);
    const favorite = await favoritesService.addFavorite(user.id, command);

    return createSuccessResponse(201, favorite);
  } catch (error) {
    if (error.code === "VALIDATION_ERROR") {
      return createErrorResponse(400, "BAD_REQUEST", error.message);
    }

    if (error.code === "23505") {
      // Duplicate key violation
      return createErrorResponse(409, "CONFLICT", "This ward is already in your favorites");
    }

    if (error.code === "WARD_NAME_TOO_LONG") {
      return createErrorResponse(422, "UNPROCESSABLE_ENTITY", "Ward name exceeds 255 characters");
    }

    console.error("[POST /api/users/me/favorites] Error:", error);
    return createErrorResponse(500, "INTERNAL_SERVER_ERROR", "Failed to add favorite");
  }
};
```

**Key Implementation Notes**:

- Handle error code `23505` (duplicate) → 409 Conflict
- Validate `ward_name` with Zod (max 255 chars)
- Return 201 Created on success

### 4.6 DELETE /api/users/me/favorites/by-ward/[wardName] (`src/pages/api/users/me/favorites/by-ward/[wardName].ts`)

> **API Contract**: See `api-plan.md` → Section 4.2 (DELETE /api/users/me/favorites/by-ward/{wardName})

**Implementation Pattern**:

```typescript
export const DELETE: APIRoute = async ({ params, locals }) => {
  try {
    const user = await getAuthenticatedUser(locals.supabase);
    if (!user) {
      return createErrorResponse(401, "UNAUTHORIZED", "Missing or invalid authentication token");
    }

    const wardName = params.wardName;
    if (!wardName) {
      return createErrorResponse(400, "BAD_REQUEST", "Ward name is required");
    }

    // Decode URL-encoded ward name
    const decodedWardName = decodeURIComponent(wardName);

    const favoritesService = new FavoritesService(locals.supabase);

    // Remove favorite by ward name
    const deleted = await favoritesService.removeFavoriteByWardName(user.id, decodedWardName);

    if (!deleted) {
      return createErrorResponse(404, "NOT_FOUND", "Favorite not found");
    }

    return new Response(null, { status: 204 });
  } catch (error) {
    console.error(`[DELETE /api/users/me/favorites/by-ward/${params.wardName}] Error:`, error);
    return createErrorResponse(500, "INTERNAL_SERVER_ERROR", "Failed to remove favorite");
  }
};
```

**Key Implementation Notes**:

- ⚠️ **CRITICAL**: Use `decodeURIComponent(wardName)` for URL-encoded names
- No UUID validation needed - uses ward name directly
- Service returns boolean to indicate if deletion occurred (404 handling)
- Return 204 No Content (empty body) on success
- Zero migration required - uses existing `ward_name` column

### 4.7 GET /api/insights/current (`src/pages/api/insights/current.ts`)

> **API Contract**: See `api-plan.md` → Section 4.3 (GET /api/insights/current)

**Implementation Pattern**:

```typescript
export const GET: APIRoute = async ({ locals }) => {
  try {
    const user = await getAuthenticatedUser(locals.supabase);
    if (!user) {
      return createErrorResponse(401, "UNAUTHORIZED", "Missing or invalid authentication token");
    }

    const insightsService = new InsightsService(locals.supabase);
    const insight = await insightsService.getCurrentInsight();

    if (!insight) {
      return new Response(null, { status: 204 }); // No active insight
    }

    return createSuccessResponse(200, insight);
  } catch (error) {
    console.error("[GET /api/insights/current] Error:", error);
    return createErrorResponse(500, "INTERNAL_SERVER_ERROR", "Failed to fetch insight");
  }
};
```

**Key Implementation Notes**:

- Return 204 No Content if no active insight (not an error)
- Graceful degradation pattern

### 4.8 GET /api/status (`src/pages/api/status.ts`)

> **API Contract**: See `api-plan.md` → Section 4.4 (GET /api/status)

**Implementation Pattern**:

```typescript
export const GET: APIRoute = async ({ locals }) => {
  try {
    const user = await getAuthenticatedUser(locals.supabase);
    if (!user) {
      return createErrorResponse(401, "UNAUTHORIZED", "Missing or invalid authentication token");
    }

    const statusService = new StatusService(locals.supabase);
    const status = await statusService.getSystemStatus();

    return createSuccessResponse(200, status);
  } catch (error) {
    console.error("[GET /api/status] Error:", error);
    return createErrorResponse(500, "INTERNAL_SERVER_ERROR", "Failed to fetch system status");
  }
};
```

**Key Implementation Notes**:

- Consider caching response for 5 minutes
- All metrics aggregated by single RPC call

### 4.9 DELETE /api/users/me (`src/pages/api/users/me/index.ts`)

> **API Contract**: See `api-plan.md` → Section 4.6 (DELETE /api/users/me)

**Implementation Pattern**:

```typescript
import { createClient } from "@supabase/supabase-js";

export const DELETE: APIRoute = async ({ locals }) => {
  try {
    const user = await getAuthenticatedUser(locals.supabase);
    if (!user) {
      return createErrorResponse(401, "UNAUTHORIZED", "Missing or invalid authentication token");
    }

    // Use admin client with service role key
    const supabaseAdmin = createClient(import.meta.env.SUPABASE_URL, import.meta.env.SUPABASE_SERVICE_ROLE_KEY);

    // Delete user from auth.users (CASCADE deletes favorites)
    const { error } = await supabaseAdmin.auth.admin.deleteUser(user.id);

    if (error) {
      throw error;
    }

    return new Response(null, { status: 204 });
  } catch (error) {
    console.error("[DELETE /api/users/me] Error:", error);
    return createErrorResponse(500, "INTERNAL_SERVER_ERROR", "Failed to delete user account");
  }
};
```

**Key Implementation Notes**:

- ⚠️ **REQUIRES**: `SUPABASE_SERVICE_ROLE_KEY` environment variable
- Use Supabase Admin SDK (`supabaseAdmin.auth.admin.deleteUser()`)
- CASCADE DELETE automatic via foreign key

### 4.10 GET /api/logs/scraping (`src/pages/api/logs/scraping.ts`)

> **API Contract**: See `api-plan.md` → Section 4.7 (GET /api/logs/scraping)

**Implementation Pattern**:

```typescript
export const GET: APIRoute = async ({ request, locals }) => {
  try {
    const user = await getAuthenticatedUser(locals.supabase);
    if (!user) {
      return createErrorResponse(401, "UNAUTHORIZED", "Missing or invalid authentication token");
    }

    const url = new URL(request.url);
    const queryParams = {
      status: url.searchParams.get("status") as "success" | "failure" | undefined,
      limit: parseInt(url.searchParams.get("limit") || "10"),
      offset: parseInt(url.searchParams.get("offset") || "0"),
    };

    const validatedParams = validateScrapingLogsQuery(queryParams);

    const logsService = new LogsService(locals.supabase);
    const result = await logsService.getScrapingLogs(validatedParams);

    return createSuccessResponse(200, result);
  } catch (error) {
    console.error("[GET /api/logs/scraping] Error:", error);
    return createErrorResponse(500, "INTERNAL_SERVER_ERROR", "Failed to fetch scraping logs");
  }
};
```

**Key Implementation Notes**:

- Validate `status` enum: only 'success' or 'failure'
- Default limit: 10 (lower than other endpoints)
- Optional for MVP

---

## 5. Validation Schemas

Use Zod for all input validation. Create reusable schemas.

### 5.1 Common Schemas (`src/lib/validation/common.schema.ts`)

```typescript
import { z } from "zod";

// Pagination schema
export const paginationSchema = z.object({
  limit: z.number().int().min(1).max(100).default(50),
  offset: z.number().int().min(0).default(0),
});

export type PaginationInput = z.infer<typeof paginationSchema>;

// UUID schema
export const uuidSchema = z.string().uuid();

// Ward name schema
export const wardNameSchema = z
  .string()
  .min(1, "Ward name is required")
  .max(255, "Ward name exceeds 255 characters")
  .trim();
```

### 5.2 Wards Schema (`src/lib/validation/wards.schema.ts`)

```typescript
import { z } from "zod";
import { paginationSchema } from "./common.schema";

export const wardsQuerySchema = paginationSchema.extend({
  search: z.string().min(1).max(100).optional(),
  favorites_only: z.boolean().default(false),
});

export type WardsQueryInput = z.infer<typeof wardsQuerySchema>;

export function validateWardsQuery(input: unknown): WardsQueryInput {
  try {
    return wardsQuerySchema.parse(input);
  } catch (error) {
    throw { code: "VALIDATION_ERROR", message: error.errors[0].message };
  }
}

// Note: Sorting is fixed at database level (total_places DESC)
// For client-side sorting alternatives, sort the returned data array
```

### 5.3 Hospitals Schema (`src/lib/validation/hospitals.schema.ts`)

```typescript
import { z } from "zod";
import { paginationSchema } from "./common.schema";

export const hospitalsQuerySchema = paginationSchema.extend({
  district: z.string().max(100).optional(),
  search: z.string().min(1).max(100).optional(),
  order: z.enum(["availablePlaces.desc", "hospitalName.asc"]).default("availablePlaces.desc"),
});

export type HospitalsQueryInput = z.infer<typeof hospitalsQuerySchema>;

export function validateHospitalsQuery(input: unknown): HospitalsQueryInput {
  try {
    return hospitalsQuerySchema.parse(input);
  } catch (error) {
    throw { code: "VALIDATION_ERROR", message: error.errors[0].message };
  }
}
```

### 5.4 Favorites Schema (`src/lib/validation/favorites.schema.ts`)

```typescript
import { z } from "zod";
import { wardNameSchema } from "./common.schema";

export const addFavoriteCommandSchema = z.object({
  ward_name: wardNameSchema,
});

export type AddFavoriteCommandInput = z.infer<typeof addFavoriteCommandSchema>;

export function validateAddFavoriteCommand(input: unknown): AddFavoriteCommandInput {
  try {
    return addFavoriteCommandSchema.parse(input);
  } catch (error) {
    throw { code: "VALIDATION_ERROR", message: error.errors[0].message };
  }
}
```

### 5.5 Scraping Logs Schema (`src/lib/validation/logs.schema.ts`)

```typescript
import { z } from "zod";
import { paginationSchema } from "./common.schema";

export const scrapingLogsQuerySchema = paginationSchema.extend({
  status: z.enum(["success", "failure"]).optional(),
});

export type ScrapingLogsQueryInput = z.infer<typeof scrapingLogsQuerySchema>;

export function validateScrapingLogsQuery(input: unknown): ScrapingLogsQueryInput {
  try {
    return scrapingLogsQuerySchema.parse(input);
  } catch (error) {
    throw { code: "VALIDATION_ERROR", message: error.errors[0].message };
  }
}
```

---

## 6. Error Handling

### 6.1 Error Response Utility (`src/lib/utils/api-response.ts`)

```typescript
import type { ErrorResponseDTO } from "@/types";

export function createErrorResponse(
  status: number,
  code: string,
  message: string,
  details?: string,
  hint?: string
): Response {
  const error: ErrorResponseDTO = {
    code,
    message,
    ...(details && { details }),
    ...(hint && { hint }),
  };

  return new Response(JSON.stringify(error), {
    status,
    headers: {
      "Content-Type": "application/json",
    },
  });
}

export function createSuccessResponse<T>(status: number, data: T): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
    },
  });
}
```

### 6.2 Authentication Helper (`src/lib/utils/auth.ts`)

```typescript
import type { SupabaseClient } from "@supabase/supabase-js";

export async function getAuthenticatedUser(supabase: SupabaseClient) {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  // Check email verification
  if (!user.email_confirmed_at) {
    throw { code: "EMAIL_NOT_VERIFIED", message: "Email address not verified" };
  }

  return user;
}
```

### 6.3 Error Handling Strategy

**Pattern**: Use try-catch at endpoint level, throw custom errors from services.

**Custom Error Codes**:

- `VALIDATION_ERROR` - Zod validation failure
- `UNAUTHORIZED` - Missing/invalid JWT
- `EMAIL_NOT_VERIFIED` - Email not confirmed
- `NOT_FOUND` - Resource doesn't exist
- `CONFLICT` - Duplicate resource (409)
- `INTERNAL_SERVER_ERROR` - Unexpected errors

**Logging**: Always log errors with context:

```typescript
console.error(`[${method} ${path}] Error:`, {
  error: error.message,
  stack: error.stack,
  userId: user?.id,
  params: {
    /* relevant params */
  },
});
```

---

## 7. Security Considerations

### 7.1 Authentication & Authorization

**JWT Validation**:

- Handled automatically by Supabase middleware
- Token passed via `Authorization: Bearer <token>` header
- Middleware populates `locals.supabase` with authenticated client

**RLS Enforcement**:

- All database operations use `locals.supabase` (user context)
- RLS policies automatically filter data by `auth.uid()`
- No custom authorization logic needed

**Email Verification**:

- Check `user.email_confirmed_at` in `getAuthenticatedUser()`
- Block access if email not verified

### 7.2 Input Validation

**SQL Injection Prevention**:

- Supabase client uses parameterized queries automatically
- Never concatenate user input into SQL strings

**XSS Prevention**:

- Sanitize all user inputs with Zod
- Escape special characters in search queries
- Use Content-Type: application/json headers

**Validation Layers**:

1. **Frontend**: Client-side validation (UX)
2. **API**: Zod schemas (security)
3. **Database**: Constraints and triggers (integrity)

### 7.3 Rate Limiting (Future Enhancement)

**Current**: No rate limiting (MVP)

**Recommendation**: Implement in middleware using Redis:

```typescript
// Example for post-MVP
const rateLimiter = new RateLimiter({
  tokensPerInterval: 100,
  interval: "minute",
  fireImmediately: true,
});

const allowed = await rateLimiter.tryRemoveTokens(userId, 1);
if (!allowed) {
  return createErrorResponse(429, "RATE_LIMIT_EXCEEDED", "Too many requests");
}
```

### 7.4 CORS Configuration

Configure in Supabase Dashboard:

- **Allowed Origins**: `https://hoslu.onrender.com`
- **Allowed Methods**: GET, POST, DELETE, OPTIONS
- **Allowed Headers**: Authorization, Content-Type, apikey
- **Credentials**: true

### 7.5 Secrets Management

**Environment Variables**:

```bash
# .env (never commit)
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...  # Frontend (public)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...  # Backend only (secret)
```

**Access**:

- Frontend: `import.meta.env.PUBLIC_SUPABASE_ANON_KEY`
- Backend: `import.meta.env.SUPABASE_SERVICE_ROLE_KEY`

**⚠️ CRITICAL**: Never expose Service Role Key to frontend!

---

## 8. Testing Strategy

### 8.1 Unit Tests (Services)

**Framework**: Vitest (Astro default)

**Example**: `src/lib/services/__tests__/wards.service.test.ts`

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WardsService } from '../wards.service';

describe('WardsService', () => {
  let mockSupabase: any;
  let wardsService: WardsService;

  beforeEach(() => {
    mockSupabase = {
      rpc: vi.fn(),
    };
    wardsService = new WardsService(mockSupabase);
  });

  it('should fetch wards with default parameters', async () => {
    const mockData = { /* ... */ };
    mockSupabase.rpc.mockResolvedValue({ data: mockData, error: null });

    const result = await wardsService.getWards({
      limit: 50,
      offset: 0,
      order: 'total_places.desc',
      favorites_only: false,
    }, 'user-id');

    expect(mockSupabase.rpc).toHaveBeenCalledWith('get_wards_aggregated', {
      p_search: null,
      p_user_id: 'user-id',
      p_favorites_only: false,
    });
    expect(result.data).toEqual(mockData);
  });

  it('should handle search query', async () => {
    await wardsService.getWards({
      search: 'kardio',
      limit: 50,
      offset: 0,
      order: 'total_places.desc',
      favorites_only: false,
    }, 'user-id');

    expect(mockSupabase.rpc).toHaveBeenCalledWith('get_wards_aggregated', {
      p_search: 'kardio',
      p_user_id: 'user-id',
      p_favorites_only: false,
    });
  });

  it('should throw error on database failure', async () => {
    mockSupabase.rpc.mockResolvedValue({ data: null, error: { message: 'DB error' } });

    await expect(wardsService.getWards(/* ... */, 'user-id')).rejects.toThrow();
  });
});
```

### 8.2 Integration Tests (API Endpoints)

**Framework**: Vitest + Supertest equivalent for Astro

**Example**: `src/pages/api/__tests__/wards.test.ts`

```typescript
import { describe, it, expect } from "vitest";
import { GET } from "../wards/index";

describe("GET /api/wards", () => {
  it("should return 401 without authentication", async () => {
    const request = new Request("http://localhost/api/wards");
    const locals = { supabase: mockUnauthenticatedClient };

    const response = await GET({ request, locals } as any);

    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.code).toBe("UNAUTHORIZED");
  });

  it("should return wards list for authenticated user", async () => {
    const request = new Request("http://localhost/api/wards?limit=10");
    const locals = { supabase: mockAuthenticatedClient };

    const response = await GET({ request, locals } as any);

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data).toBeInstanceOf(Array);
    expect(body.meta).toHaveProperty("total");
  });

  it("should validate query parameters", async () => {
    const request = new Request("http://localhost/api/wards?limit=200"); // Exceeds max
    const locals = { supabase: mockAuthenticatedClient };

    const response = await GET({ request, locals } as any);

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.code).toBe("BAD_REQUEST");
  });
});
```

### 8.3 End-to-End Tests (Manual for MVP)

**Critical Flows to Test**:

1. **Authentication Flow**:
   - Sign up → verify email → login → access API
   - Invalid token → 401 error
   - Unverified email → 403 error

2. **Wards Flow**:
   - GET /api/wards → returns list
   - Search "kardio" → returns filtered results
   - favorites_only=true → returns only favorites

3. **Favorites Flow**:
   - POST /api/users/me/favorites → creates favorite
   - POST duplicate → returns 409 Conflict
   - GET /api/users/me/favorites → shows created favorite
   - DELETE /api/users/me/favorites/by-ward/{wardName} → removes favorite (URL-encoded)

4. **Error Handling**:
   - Invalid UUID → 400 error
   - Non-existent ward → 404 error
   - Database error → 500 error

### 8.4 RLS Policy Tests

**Test in Supabase SQL Editor**:

```sql
-- Test as authenticated user
SELECT set_config('request.jwt.claims', '{"sub": "user-uuid-here"}', true);

-- Should return user's favorites only
SELECT * FROM user_favorites;

-- Try to access another user's favorite (should fail)
DELETE FROM user_favorites WHERE user_id != 'user-uuid-here';
```

---

## 9. Implementation Checklist

### Phase 1: Foundation ✅ COMPLETED

- [x] **Project Structure**
  - [x] Create directory structure
  - [x] Set up validation schemas (common, wards, hospitals, favorites, logs)
  - [x] Create utility modules (api-response, error-handler, auth, type-guards)

- [x] **Services Layer**
  - [x] Implement `WardsService`
  - [x] Implement `HospitalsService`
  - [x] Implement `FavoritesService`
  - [x] Implement `InsightsService`
  - [x] Implement `StatusService`
  - [x] Implement `LogsService`
  - [ ] Write unit tests for services (TODO)

### Phase 2: Core Endpoints ✅ COMPLETED

- [x] **Wards Endpoints**
  - [x] GET /api/wards
  - [x] GET /api/wards/[wardName]/hospitals
  - [ ] Test with Postman/Insomnia (TODO)
  - [ ] Verify RLS enforcement (TODO)

- [x] **Favorites Endpoints**
  - [x] GET /api/users/me/favorites
  - [x] POST /api/users/me/favorites
  - [x] DELETE /api/users/me/favorites/by-ward/[wardName]
  - [ ] Test CRUD operations (TODO)
  - [ ] Test duplicate handling (409) (TODO)
  - [ ] Test URL encoding for ward names (TODO)

### Phase 3: MVP Features ✅ COMPLETED

- [x] **AI Insights**
  - [x] Implement `InsightsService`
  - [x] GET /api/insights/current
  - [ ] Test graceful degradation (no insight) (TODO)

- [x] **User Profile**
  - [x] GET /api/users/me
  - [x] Implement user profile endpoint

- [ ] **Integration Testing**
  - [ ] Test complete user flows (TODO)
  - [ ] Test RLS enforcement (TODO)
  - [ ] Test data freshness warning banner (TODO)

### Phase 4: Admin & Monitoring Features ✅ COMPLETED

- [x] **Admin Dashboard**
  - [x] Implement `StatusService`
  - [x] GET /api/status (aggregated metrics)
  - [x] Implement `LogsService`
  - [x] GET /api/logs/scraping

- [x] **User Management**
  - [x] DELETE /api/users/me (GDPR compliance)
  - [ ] Test CASCADE DELETE of favorites (TODO)

- [ ] **Advanced Features**
  - [ ] District filtering with `get_unique_districts()` (Post-MVP)
  - [ ] Advanced search improvements (Post-MVP)

### Phase 5: Deployment & Monitoring (IN PROGRESS)

- [ ] **Deployment**
  - [ ] Configure environment variables in Render
  - [ ] Deploy to production
  - [ ] Verify CORS settings
  - [ ] Test with production database

- [ ] **Monitoring**
  - [ ] Set up error logging
  - [ ] Monitor API response times
  - [ ] Track scraping success rate
  - [ ] Set up health checks

### Performance Optimization (Post-MVP)

- [ ] **Caching**
  - [ ] Add response caching for /api/status (5 min)
  - [ ] Add response caching for /api/insights/current (1 hour)
  - [ ] Implement ETag support

- [ ] **Rate Limiting**
  - [ ] Implement Redis-based rate limiting
  - [ ] Configure limits per endpoint type
  - [ ] Add rate limit headers

---

## 10. Additional PostgreSQL Functions & Triggers

### Orphaned Favorites Cleanup

**Purpose**: Automatically remove favorites for wards that no longer exist in `hospital_wards`.

```sql
-- Trigger function
CREATE OR REPLACE FUNCTION cleanup_orphaned_favorites()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM user_favorites
  WHERE ward_name NOT IN (
    SELECT DISTINCT "wardName" FROM hospital_wards
  );
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger
CREATE TRIGGER trigger_cleanup_orphaned_favorites
AFTER INSERT OR UPDATE OR DELETE ON hospital_wards
FOR EACH STATEMENT
EXECUTE FUNCTION cleanup_orphaned_favorites();
```

### Get Unique Districts (Post-MVP - Phase 2)

**Status**: Not implemented in MVP.

**Purpose**: District filtering planned for Phase 2 enhancement.

**Note**: Basic search in `get_wards_aggregated()` is sufficient for MVP scope.

### Optimistic Updates Pattern (Frontend)

**Purpose**: Improve UX by updating UI before API call completes.

```typescript
// Example: Add to favorites with optimistic update
async function addToFavorites(wardName: string) {
  // 1. Optimistically add to local state
  const optimisticFavorite = {
    id: "temp-" + Date.now(),
    ward_name: wardName,
    created_at: new Date().toISOString(),
  };

  favorites.value.push(optimisticFavorite);

  try {
    // 2. Make API call
    const { data, error } = await supabase.from("user_favorites").insert({ ward_name: wardName }).select().single();

    if (error) throw error;

    // 3. Replace optimistic with real data
    const index = favorites.value.findIndex((f) => f.id === optimisticFavorite.id);
    if (index >= 0) {
      favorites.value[index] = data;
    }
  } catch (error) {
    // 4. Rollback on error
    favorites.value = favorites.value.filter((f) => f.id !== optimisticFavorite.id);
    showError("Failed to add favorite");
  }
}
```

---

## 11. Common Pitfalls & Solutions

### Pitfall 1: Forgetting to URL-decode path parameters

**Problem**: Ward name "Kardiologia Dziecięca" encoded as "Kardiologia%20Dzieci%C4%99ca" not matching database.

**Solution**:

```typescript
const wardName = decodeURIComponent(params.wardName || "");
```

### Pitfall 2: Not handling VARCHAR to INTEGER conversion

**Problem**: Sorting `availablePlaces` alphabetically instead of numerically.

**Solution**: Use PostgreSQL CASE statement in query or handle in RPC function.

### Pitfall 3: Exposing Service Role Key in frontend

**Problem**: Accidental leak of Service Role Key bypasses all RLS.

**Solution**:

- Use `SUPABASE_SERVICE_ROLE_KEY` only in backend API routes
- Frontend uses `PUBLIC_SUPABASE_ANON_KEY`
- Never import `SUPABASE_SERVICE_ROLE_KEY` in client-side code

### Pitfall 4: Using internal UUIDs as API identifiers

**Problem**: Frontend needs to fetch and cache UUID mappings for natural identifiers (e.g., ward names).

**Solution**: Use natural identifiers (ward names) in API endpoints instead of internal database UUIDs.

**Example**:

```typescript
// ❌ BAD: Requires UUID lookup
DELETE / api / users / me / favorites / { uuid };

// ✅ GOOD: Uses natural identifier
DELETE / api / users / me / favorites / by - ward / { wardName };
```

### Pitfall 5: Returning 500 for user errors

**Problem**: Validation errors returning 500 instead of 400.

**Solution**: Use proper status codes:

- 400: Validation errors
- 404: Resource not found
- 500: Unexpected server errors only

### Pitfall 6: Forgetting email verification check

**Problem**: Users with unverified emails can access API.

**Solution**: Always check `user.email_confirmed_at` in `getAuthenticatedUser()`.

---

## 12. Quick Reference: PostgreSQL Functions

All SQL code is included in this document. Create these functions in order:

**Helper Functions** (Section 3.1):

1. `is_data_stale()` - Returns boolean
2. `get_last_scrape_time()` - Returns timestamp
3. `count_unique_wards()` - Returns count
4. `count_unique_hospitals()` - Returns count
5. `calculate_scraping_success_rate(days)` - Returns percentage

**Main Functions** (Sections 3.1-3.5): 6. `get_wards_aggregated(p_search, p_user_id, p_favorites_only)` - Ward aggregation 7. `get_user_favorites_with_stats()` - Favorites with live stats 8. `get_system_status()` - System health metrics 9. `get_unique_districts()` - District list (Section 10)

**Triggers** (Section 10): 10. `cleanup_orphaned_favorites()` + trigger - Auto-cleanup

### Supabase Configuration Checklist

- [ ] Enable RLS on all tables
- [ ] Deploy RLS policies
- [ ] Create database functions
- [ ] Add database indexes
- [ ] Configure CORS settings
- [ ] Set up email verification
- [ ] Generate type definitions

### Environment Variables

**Required**:

```bash
PUBLIC_SUPABASE_URL=https://xxx.supabase.co
PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...  # Backend only
```

**Optional** (Post-MVP):

```bash
ANTHROPIC_API_KEY=sk-ant-...  # For AI insights
REDIS_URL=redis://...  # For rate limiting
```

---

## 13. Success Criteria

### ✅ Implementation Complete (Core Features)

- ✅ All 10 endpoints implemented with correct structure
- ✅ All 6 services implemented with business logic
- ✅ All 5 validation schemas implemented with Zod
- ✅ All 4 utility modules implemented (response, error, auth, type-guards)
- ✅ Error responses follow standard format
- ✅ API documentation is up to date
- ✅ No Service Role Key leaks (only used in backend)
- ✅ Email verification enforced in `getAuthenticatedUser()`
- ✅ URL encoding handled correctly (ward names)
- ✅ Natural identifiers used in DELETE endpoint

### 📋 Testing Required (Next Phase)

- [ ] All endpoints return correct status codes (manual testing)
- [ ] RLS policies enforce authorization (database testing)
- [ ] Input validation catches all invalid inputs (unit tests)
- [ ] Unit tests cover services (>80% coverage)
- [ ] Integration tests cover critical flows
- [ ] Manual testing passes all scenarios
- [ ] Pagination works correctly
- [ ] Search returns relevant results
- [ ] Favorites sync with database changes

### 🚀 Deployment Required (Next Phase)

- [ ] Production deployment succeeds
- [ ] CORS configured correctly
- [ ] Environment variables configured
- [ ] Database functions deployed
- [ ] RLS policies enabled
- [ ] Monitoring and logging set up

---

## 14. Summary

This document provides **implementation patterns and code** for building the HosLU REST API.

**What's included**:

- ✅ Project structure (directories, files)
- ✅ TypeScript code patterns (Services, endpoints, utilities)
- ✅ Zod validation schemas
- ✅ PostgreSQL functions (complete SQL code)
- ✅ Error handling patterns
- ✅ Testing strategies & examples
- ✅ Implementation checklist
- ✅ Common pitfalls & solutions

**What's NOT included** (see `api-plan.md`):

- ❌ HTTP request/response examples
- ❌ API contract details (query params, status codes)
- ❌ Business requirements documentation
- ❌ Rate limiting policies

**Key Principles**:

- **Service Layer**: Business logic separated from routes
- **Type Safety**: Full TypeScript + Zod validation
- **Security**: RLS enforcement, JWT validation
- **Testing**: Unit + integration test patterns
- **Early Returns**: Error handling at function start

**How to Use**:

1. Read `api-plan.md` first (understand the contract)
2. Follow project structure (Section 2)
3. Implement services with SQL functions (Section 3)
4. Create API endpoints (Section 4)
5. Add validation schemas (Section 5)
6. Write tests (Section 8)
7. Check off implementation checklist (Section 9)

---

**Version**: 1.2  
**Status**: ✅ Fully Implemented  
**Updated**: 2025-10-29  
**Companion Doc**: `api-plan.md`

---

## Implementation Summary

### ✅ All 10 API Endpoints Implemented

1. ✅ GET /api/wards (Section 4.1)
   - File: `src/pages/api/wards/index.ts`
   - Service: `WardsService`
   - Validation: `validateWardsQuery`

2. ✅ GET /api/wards/{wardName}/hospitals (Section 4.2)
   - File: `src/pages/api/wards/[wardName]/hospitals.ts`
   - Service: `HospitalsService`
   - Validation: `validateHospitalsQuery`

3. ✅ GET /api/users/me (Section 4.3)
   - File: `src/pages/api/users/me/index.ts`
   - No service layer (direct auth helper)
   - Returns user profile data

4. ✅ GET /api/users/me/favorites (Section 4.4)
   - File: `src/pages/api/users/me/favorites/index.ts`
   - Service: `FavoritesService`
   - No validation (uses default pagination)

5. ✅ POST /api/users/me/favorites (Section 4.5)
   - File: `src/pages/api/users/me/favorites/index.ts`
   - Service: `FavoritesService`
   - Validation: `validateAddFavoriteCommand`

6. ✅ DELETE /api/users/me/favorites/by-ward/{wardName} (Section 4.6)
   - File: `src/pages/api/users/me/favorites/by-ward/[wardName].ts`
   - Service: `FavoritesService.removeFavoriteByWardName()`
   - Uses natural identifier (ward name) instead of UUID

7. ✅ GET /api/insights/current (Section 4.7)
   - File: `src/pages/api/insights/current.ts`
   - Service: `InsightsService`
   - Graceful degradation (204 if no insight)

8. ✅ GET /api/status (Section 4.8)
   - File: `src/pages/api/status.ts`
   - Service: `StatusService`
   - Aggregates system health metrics

9. ✅ DELETE /api/users/me (Section 4.9)
   - File: `src/pages/api/users/me/index.ts`
   - Uses Supabase Admin API
   - CASCADE deletes favorites

10. ✅ GET /api/logs/scraping (Section 4.10)
    - File: `src/pages/api/logs/scraping.ts`
    - Service: `LogsService`
    - Validation: `validateScrapingLogsQuery`

### ✅ All 6 Services Implemented

1. ✅ `WardsService` - `src/lib/services/wards.service.ts`
2. ✅ `HospitalsService` - `src/lib/services/hospitals.service.ts`
3. ✅ `FavoritesService` - `src/lib/services/favorites.service.ts`
4. ✅ `InsightsService` - `src/lib/services/insights.service.ts`
5. ✅ `StatusService` - `src/lib/services/status.service.ts`
6. ✅ `LogsService` - `src/lib/services/logs.service.ts`

### ✅ All 5 Validation Schemas Implemented

1. ✅ `common.schema.ts` - Pagination, UUID, Ward name
2. ✅ `wards.schema.ts` - Ward list queries
3. ✅ `hospitals.schema.ts` - Hospital list queries
4. ✅ `favorites.schema.ts` - Add favorite command
5. ✅ `logs.schema.ts` - Scraping logs queries

### ✅ All 4 Utility Modules Implemented

1. ✅ `api-response.ts` - Standardized response helpers
2. ✅ `error-handler.ts` - Error type guards and helpers
3. ✅ `auth.ts` - Authentication helper
4. ✅ `type-guards.ts` - Type checking utilities

### 📋 Next Steps (Testing & Deployment)

- [ ] Write unit tests for all services
- [ ] Perform integration testing with Postman/Insomnia
- [ ] Test RLS enforcement manually
- [ ] Test error scenarios (401, 403, 404, 409, 500)
- [ ] Configure production environment variables
- [ ] Deploy to production
- [ ] Set up monitoring and logging
