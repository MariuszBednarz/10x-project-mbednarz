# REST API Plan - HosLU MVP

## 1. Overview

This document defines the REST API contract for the HosLU application - the HTTP interface that clients use to access hospital bed availability data.

> **Note**: For implementation details (TypeScript code, services, validation), see `api-implementation-plan.md`

**Base URL:** `https://your-app.supabase.co/rest/v1` (Supabase REST API)  
**Authentication:** JWT Bearer tokens (managed by Supabase Auth)  
**Data Format:** JSON  
**API Style:** RESTful with resource-oriented design

**Purpose**: This document serves as:

- API contract for frontend developers
- Reference for external integrations
- Source of truth for request/response formats
- Testing specification

---

## 2. Resources

| Resource  | Database Table                  | Description                                       |
| --------- | ------------------------------- | ------------------------------------------------- |
| Wards     | `hospital_wards`                | Hospital ward bed availability (aggregated view)  |
| Hospitals | `hospital_wards`                | Individual hospital records with bed availability |
| Favorites | `user_favorites`                | User's favorited wards                            |
| Insights  | `ai_insights`                   | Daily AI-generated availability insights          |
| Status    | Helper functions                | System data freshness status                      |
| User      | `auth.users` (Supabase managed) | User account management                           |

---

## 3. Authentication & Authorization

### Authentication Mechanism

**Provider:** Supabase Auth  
**Method:** JWT Bearer tokens  
**Flow:** Email/Password with email verification required

#### Headers Required

```
Authorization: Bearer <JWT_TOKEN>
apikey: <SUPABASE_ANON_KEY>
```

#### Token Acquisition

```http
POST https://your-app.supabase.co/auth/v1/signup
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "secure_password_123"
}
```

**Response:**

```json
{
  "access_token": "eyJhbGc...",
  "token_type": "bearer",
  "expires_in": 3600,
  "refresh_token": "...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "email_confirmed_at": null
  }
}
```

#### Login

```http
POST https://your-app.supabase.co/auth/v1/token?grant_type=password
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "secure_password_123"
}
```

### Authorization via RLS

Row Level Security policies automatically enforce authorization rules:

- **hospital_wards**: Authenticated users have read access
- **user_favorites**: Users can only access their own favorites
- **ai_insights**: Authenticated users can read non-expired insights
- **scraping_logs**: Authenticated users have read-only access

No custom authorization logic required in application layer.

---

## 4. Endpoints

### 4.1 Wards

#### GET /api/wards

Get list of unique hospital wards with aggregated statistics.

**Authentication:** Required

**Query Parameters:**

| Parameter        | Type    | Required | Description                                                  |
| ---------------- | ------- | -------- | ------------------------------------------------------------ |
| `search`         | string  | No       | Case-insensitive search by ward name (uses trigram matching) |
| `favorites_only` | boolean | No       | Filter to show only user's favorited wards                   |
| `limit`          | integer | No       | Number of results to return (default: 50, max: 100)          |
| `offset`         | integer | No       | Number of results to skip for pagination (default: 0)        |

**Request Example:**

```http
GET /rest/v1/rpc/get_wards_aggregated?search=kardio&favorites_only=false&limit=20&offset=0
Authorization: Bearer <JWT_TOKEN>
apikey: <SUPABASE_ANON_KEY>
```

**Note:** Results are always sorted by `totalPlaces` descending (highest availability first). Client-side sorting can be implemented if needed for alternative sort orders.

**Response Success (200 OK):**

```json
{
  "data": [
    {
      "wardName": "Kardiologia",
      "hospitalCount": 5,
      "totalPlaces": 27,
      "isFavorite": true,
      "lastScrapedAt": "2025-01-24T12:00:00Z"
    },
    {
      "wardName": "Ortopedia",
      "hospitalCount": 8,
      "totalPlaces": 42,
      "isFavorite": false,
      "lastScrapedAt": "2025-01-24T12:00:00Z"
    }
  ],
  "meta": {
    "total": 28,
    "limit": 20,
    "offset": 0,
    "lastScrapeTime": "2025-01-24T12:00:00Z",
    "isStale": false
  }
}
```

**Response Errors:**

| Code | Description                                 |
| ---- | ------------------------------------------- |
| 401  | Unauthorized - Invalid or missing JWT token |
| 403  | Forbidden - Email not verified              |
| 500  | Internal Server Error                       |

**Business Logic:**

- Aggregates data by unique `wardName`
- Counts distinct hospitals per ward
- Sums `availablePlaces` (safely converts VARCHAR to INTEGER, handles non-numeric values)
- Checks if ward is in user's favorites
- Uses ILIKE pattern matching with trigram index for performance
- **Sorting:** Fixed order by `total_places DESC` (highest availability first)

**Implementation Note:**

- Requires PostgreSQL function: `get_wards_aggregated(p_search, p_user_id, p_favorites_only)`
- See implementation details in `api-implementation-plan.md` → Section 3.1

---

#### GET /api/wards/{wardName}/hospitals

Get list of hospitals for a specific ward.

**Authentication:** Required

**Path Parameters:**

| Parameter  | Type   | Required | Description                                 |
| ---------- | ------ | -------- | ------------------------------------------- |
| `wardName` | string | Yes      | URL-encoded ward name (e.g., "Kardiologia") |

**Query Parameters:**

| Parameter  | Type    | Required | Description                                                |
| ---------- | ------- | -------- | ---------------------------------------------------------- |
| `district` | string  | No       | Filter by district name                                    |
| `search`   | string  | No       | Search by hospital name                                    |
| `order`    | string  | No       | Sort: `availablePlaces.desc` (default), `hospitalName.asc` |
| `limit`    | integer | No       | Results limit (default: 50, max: 100)                      |
| `offset`   | integer | No       | Pagination offset (default: 0)                             |

**Request Example:**

```http
GET /rest/v1/hospital_wards?wardName=eq.Kardiologia&select=*&order=availablePlaces.desc
Authorization: Bearer <JWT_TOKEN>
apikey: <SUPABASE_ANON_KEY>
```

**Response Success (200 OK):**

```json
{
  "data": [
    {
      "id": "uuid",
      "wardName": "Kardiologia",
      "wardLink": "https://szpitale.lublin.uw.gov.pl/...",
      "district": "Lublin",
      "hospitalName": "Szpital Kliniczny Nr 1",
      "availablePlaces": "12",
      "lastUpdated": "2025-01-24 11:45",
      "scrapedAt": "2025-01-24T12:00:00Z",
      "created_at": "2025-01-20T10:00:00Z",
      "updated_at": "2025-01-24T12:00:00Z"
    },
    {
      "id": "uuid",
      "wardName": "Kardiologia",
      "wardLink": null,
      "district": "Lubartów",
      "hospitalName": "Szpital Powiatowy w Lubartowie",
      "availablePlaces": "-3",
      "lastUpdated": "2025-01-24 10:30",
      "scrapedAt": "2025-01-24T12:00:00Z",
      "created_at": "2025-01-20T10:00:00Z",
      "updated_at": "2025-01-24T12:00:00Z"
    }
  ],
  "meta": {
    "total": 5,
    "limit": 50,
    "offset": 0
  }
}
```

**Response Errors:**

| Code | Description                                 |
| ---- | ------------------------------------------- |
| 401  | Unauthorized - Invalid or missing JWT token |
| 403  | Forbidden - Email not verified              |
| 404  | Not Found - Ward name does not exist        |
| 500  | Internal Server Error                       |

**Business Logic:**

- Filters by exact `wardName` match
- Optionally filters by `district`
- Sorts by available places (handles negative values correctly)
- Returns complete hospital records with all timestamps
- Uses district index for efficient filtering

**Validation:**

- `wardName` must be URL-encoded
- `district` is case-sensitive (matches database values)

---

### 4.2 Favorites

#### GET /api/users/me/favorites

Get current user's favorite wards with live availability data.

**Authentication:** Required

**Query Parameters:**

| Parameter | Type    | Required | Description                           |
| --------- | ------- | -------- | ------------------------------------- |
| `limit`   | integer | No       | Results limit (default: 50, max: 100) |
| `offset`  | integer | No       | Pagination offset (default: 0)        |

**Request Example:**

```http
GET /rest/v1/rpc/get_user_favorites_with_stats
Authorization: Bearer <JWT_TOKEN>
apikey: <SUPABASE_ANON_KEY>
```

**Response Success (200 OK):**

```json
{
  "data": [
    {
      "id": "uuid",
      "wardName": "Kardiologia",
      "hospitalCount": 5,
      "totalPlaces": 27,
      "createdAt": "2025-01-20T14:30:00Z"
    },
    {
      "id": "uuid",
      "wardName": "Ortopedia",
      "hospitalCount": 8,
      "totalPlaces": 42,
      "createdAt": "2025-01-21T09:15:00Z"
    }
  ],
  "meta": {
    "total": 2,
    "limit": 50,
    "offset": 0
  }
}
```

**Response Errors:**

| Code | Description                                 |
| ---- | ------------------------------------------- |
| 401  | Unauthorized - Invalid or missing JWT token |
| 403  | Forbidden - Email not verified              |
| 500  | Internal Server Error                       |

**Business Logic:**

- Automatically filters by authenticated user (via RLS)
- JOINs with hospital_wards to provide live statistics
- Orders by created_at DESC (most recent first)
- Returns orphaned favorites if ward no longer exists (with null stats)

**Implementation Note:**

- Requires PostgreSQL function: `get_user_favorites_with_stats()`
- See implementation in `api-implementation-plan.md` → Section 3.3

---

#### POST /api/users/me/favorites

Add a ward to user's favorites.

**Authentication:** Required

**Request Body:**

```json
{
  "ward_name": "Kardiologia"
}
```

**Request Example:**

```http
POST /rest/v1/user_favorites
Authorization: Bearer <JWT_TOKEN>
apikey: <SUPABASE_ANON_KEY>
Content-Type: application/json
Prefer: return=representation

{
  "user_id": "uuid",
  "ward_name": "Kardiologia"
}
```

**Response Success (201 Created):**

```json
{
  "id": "uuid",
  "user_id": "uuid",
  "ward_name": "Kardiologia",
  "created_at": "2025-01-24T14:30:00Z"
}
```

**Response Errors:**

| Code | Description                                             |
| ---- | ------------------------------------------------------- |
| 400  | Bad Request - Invalid ward_name format                  |
| 401  | Unauthorized - Invalid or missing JWT token             |
| 403  | Forbidden - Email not verified or user_id mismatch      |
| 409  | Conflict - Favorite already exists                      |
| 422  | Unprocessable Entity - ward_name exceeds 255 characters |
| 500  | Internal Server Error                                   |

**Error Response Example (409 Conflict):**

```json
{
  "code": "23505",
  "message": "duplicate key value violates unique constraint \"user_favorites_user_id_ward_name_key\"",
  "details": "Key (user_id, ward_name)=(uuid, Kardiologia) already exists."
}
```

**Business Logic:**

- RLS policy ensures user_id matches authenticated user
- Unique constraint prevents duplicates
- Does NOT validate ward existence (soft reference design)
- Orphaned favorites cleaned by database trigger when ward disappears

**Validation:**

- `ward_name`: Required, max 255 characters, non-empty string
- `user_id`: Must match `auth.uid()` (enforced by RLS)

---

#### DELETE /api/users/me/favorites/{id}

Remove a ward from user's favorites.

**Authentication:** Required

**Path Parameters:**

| Parameter | Type | Required | Description        |
| --------- | ---- | -------- | ------------------ |
| `id`      | uuid | Yes      | Favorite record ID |

**Request Example:**

```http
DELETE /rest/v1/user_favorites?id=eq.uuid-here
Authorization: Bearer <JWT_TOKEN>
apikey: <SUPABASE_ANON_KEY>
```

**Response Success (204 No Content):**

```
(empty body)
```

**Response Errors:**

| Code | Description                                  |
| ---- | -------------------------------------------- |
| 401  | Unauthorized - Invalid or missing JWT token  |
| 403  | Forbidden - Favorite belongs to another user |
| 404  | Not Found - Favorite ID does not exist       |
| 500  | Internal Server Error                        |

**Business Logic:**

- RLS policy ensures user can only delete their own favorites
- Idempotent operation (deleting non-existent ID returns 404)
- No cascade effects (favorites are leaf nodes)

**Validation:**

- `id`: Must be valid UUID format

---

### 4.3 Insights

#### GET /api/insights/current

Get the current active AI-generated insight.

**Authentication:** Required

**Request Example:**

```http
GET /rest/v1/ai_insights?select=insight_text,generated_at,expires_at&expires_at=gt.now()&order=generated_at.desc&limit=1
Authorization: Bearer <JWT_TOKEN>
apikey: <SUPABASE_ANON_KEY>
```

**Response Success (200 OK):**

```json
{
  "insight_text": "💡 Niska dostępność: Kardiologia (3 miejsca). Wysoka: Ortopedia (27 miejsc)",
  "generated_at": "2025-01-24T06:00:00Z",
  "expires_at": "2025-01-25T06:00:00Z"
}
```

**Response Success (204 No Content):**

```
(empty body)
```

_Returned when no active insight exists (graceful degradation)_

**Response Errors:**

| Code | Description                                 |
| ---- | ------------------------------------------- |
| 401  | Unauthorized - Invalid or missing JWT token |
| 403  | Forbidden - Email not verified              |
| 500  | Internal Server Error                       |

**Business Logic:**

- Returns only non-expired insights (RLS policy filters automatically)
- Always returns the most recent insight by `generated_at`
- Global cache shared by all users
- Client should handle empty response gracefully (hide insight banner)

**Validation:**

- No request parameters required
- Always returns single record or empty response

---

### 4.4 Status

#### GET /api/status

Get system data freshness status.

**Authentication:** Required

**Request Example:**

```http
GET /rest/v1/rpc/get_system_status
Authorization: Bearer <JWT_TOKEN>
apikey: <SUPABASE_ANON_KEY>
```

**Response Success (200 OK):**

```json
{
  "isStale": false,
  "lastScrapeTime": "2025-01-24T12:00:00Z",
  "hoursSinceLastScrape": 2.5,
  "totalWards": 28,
  "totalHospitals": 15,
  "scrapingSuccessRate30d": 96.5
}
```

**Response Errors:**

| Code | Description                                 |
| ---- | ------------------------------------------- |
| 401  | Unauthorized - Invalid or missing JWT token |
| 403  | Forbidden - Email not verified              |
| 500  | Internal Server Error                       |

**Business Logic:**

- Calls helper functions: `is_data_stale()`, `get_last_scrape_time()`, `count_unique_wards()`, `count_unique_hospitals()`, `calculate_scraping_success_rate(30)`
- Data is stale if last scrape > 12 hours ago
- Success rate calculated from `scraping_logs` table

**Implementation Note:**

- Requires PostgreSQL function: `get_system_status()`
- Aggregates multiple helper functions
- See implementation in `api-implementation-plan.md` → Section 3.5

---

### 4.5 User Account Management

#### DELETE /api/users/me

Delete current user account and all associated data (GDPR compliance).

**Authentication:** Required

**Request Example:**

```http
POST /rest/v1/rpc/delete_user_account
Authorization: Bearer <JWT_TOKEN>
apikey: <SUPABASE_ANON_KEY>
```

**Response Success (204 No Content):**

```
(empty body)
```

**Response Errors:**

| Code | Description                                 |
| ---- | ------------------------------------------- |
| 401  | Unauthorized - Invalid or missing JWT token |
| 403  | Forbidden - Email not verified              |
| 500  | Internal Server Error                       |

**Business Logic:**

- Deletes user from `auth.users` using Supabase Admin API
- CASCADE DELETE automatically removes all `user_favorites` records
- Invalidates all user's JWT tokens
- Operation is irreversible

**Implementation Note:**

- Use Supabase Admin SDK with Service Role Key
- CASCADE DELETE removes user_favorites automatically
- See implementation in `api-implementation-plan.md` → Section 4.8

---

### 4.6 Scraping Logs (Monitoring)

#### GET /api/logs/scraping

Get scraping operation logs for monitoring (optional for MVP).

**Authentication:** Required

**Query Parameters:**

| Parameter | Type    | Required | Description                            |
| --------- | ------- | -------- | -------------------------------------- |
| `status`  | string  | No       | Filter by status: `success`, `failure` |
| `limit`   | integer | No       | Results limit (default: 10, max: 100)  |
| `offset`  | integer | No       | Pagination offset (default: 0)         |

**Request Example:**

```http
GET /rest/v1/scraping_logs?select=*&order=started_at.desc&limit=10
Authorization: Bearer <JWT_TOKEN>
apikey: <SUPABASE_ANON_KEY>
```

**Response Success (200 OK):**

```json
{
  "data": [
    {
      "id": "uuid",
      "started_at": "2025-01-24T12:00:00Z",
      "completed_at": "2025-01-24T12:03:45Z",
      "status": "success",
      "records_inserted": 12,
      "records_updated": 143,
      "error_message": null,
      "created_at": "2025-01-24T12:00:00Z"
    }
  ],
  "meta": {
    "total": 487,
    "limit": 10,
    "offset": 0
  }
}
```

**Response Errors:**

| Code | Description                                 |
| ---- | ------------------------------------------- |
| 401  | Unauthorized - Invalid or missing JWT token |
| 403  | Forbidden - Email not verified              |
| 500  | Internal Server Error                       |

**Business Logic:**

- Read-only access for all authenticated users
- Ordered by `started_at DESC` (most recent first)
- Used for monitoring scraper health and KPI calculations

---

## 5. Error Responses

### Standard Error Format

All API errors follow this structure:

```json
{
  "code": "ERROR_CODE",
  "message": "Human-readable error message",
  "details": "Additional context (optional)",
  "hint": "Suggestion for resolution (optional)"
}
```

### Common HTTP Status Codes

| Code | Meaning               | Use Case                                            |
| ---- | --------------------- | --------------------------------------------------- |
| 200  | OK                    | Successful GET request                              |
| 201  | Created               | Successful POST creating new resource               |
| 204  | No Content            | Successful DELETE or operation with no return value |
| 400  | Bad Request           | Invalid request format or parameters                |
| 401  | Unauthorized          | Missing or invalid authentication token             |
| 403  | Forbidden             | Valid token but insufficient permissions            |
| 404  | Not Found             | Resource does not exist                             |
| 409  | Conflict              | Duplicate resource (e.g., favorite already exists)  |
| 422  | Unprocessable Entity  | Validation error (e.g., field exceeds max length)   |
| 429  | Too Many Requests     | Rate limit exceeded                                 |
| 500  | Internal Server Error | Unexpected server error                             |
| 503  | Service Unavailable   | Database or external service unavailable            |

---

## 6. Rate Limiting

### Limits (MVP)

| Endpoint Type                  | Limit        | Window   |
| ------------------------------ | ------------ | -------- |
| Authentication                 | 10 requests  | 1 minute |
| Read operations (GET)          | 100 requests | 1 minute |
| Write operations (POST/DELETE) | 20 requests  | 1 minute |
| Status checks                  | 30 requests  | 1 minute |

### Rate Limit Headers

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 87
X-RateLimit-Reset: 1706097600
```

### Rate Limit Error (429)

```json
{
  "code": "RATE_LIMIT_EXCEEDED",
  "message": "Too many requests. Please try again later.",
  "details": "Limit: 100 requests per minute",
  "retryAfter": 45
}
```

---

## 7. Pagination

### Query Parameters

| Parameter | Type    | Default | Max | Description                |
| --------- | ------- | ------- | --- | -------------------------- |
| `limit`   | integer | 50      | 100 | Number of results per page |
| `offset`  | integer | 0       | N/A | Number of results to skip  |

### Response Metadata

All paginated endpoints include a `meta` object:

```json
{
  "data": [...],
  "meta": {
    "total": 150,
    "limit": 50,
    "offset": 0,
    "hasMore": true
  }
}
```

### Pagination Links (Optional Enhancement)

```json
{
  "links": {
    "first": "/api/wards?limit=50&offset=0",
    "prev": null,
    "next": "/api/wards?limit=50&offset=50",
    "last": "/api/wards?limit=50&offset=100"
  }
}
```

---

## 8. Filtering & Sorting

### Supabase Query Operators

Supabase REST API supports rich querying via URL parameters:

**Equality:**

```
?column=eq.value
```

**Comparison:**

```
?column=gt.10      (greater than)
?column=gte.10     (greater than or equal)
?column=lt.10      (less than)
?column=lte.10     (less than or equal)
```

**Pattern Matching:**

```
?column=like.*value*    (SQL LIKE)
?column=ilike.*value*   (case-insensitive LIKE)
```

**Ordering:**

```
?order=column.asc
?order=column.desc
```

**Multiple Filters:**

```
?status=eq.success&started_at=gte.2025-01-01
```

### Example: Complex Query

```http
GET /rest/v1/hospital_wards?wardName=ilike.*kardio*&district=eq.Lublin&availablePlaces=gt.0&order=availablePlaces.desc&limit=20
```

---

## 9. Validation Rules

### hospital_wards (Read-only)

| Field           | Rules                     | Enforced By        |
| --------------- | ------------------------- | ------------------ |
| wardName        | NOT NULL, max 255 chars   | Database + Scraper |
| hospitalName    | NOT NULL, max 255 chars   | Database + Scraper |
| availablePlaces | NOT NULL, max 10 chars    | Database + Scraper |
| scrapedAt       | NOT NULL, valid timestamp | Database + Scraper |

### user_favorites

| Field             | Rules                              | Enforced By    |
| ----------------- | ---------------------------------- | -------------- |
| ward_name         | Required, max 255 chars, non-empty | API validation |
| user_id           | Must match authenticated user      | RLS policy     |
| Unique constraint | (user_id, ward_name)               | Database       |

### Request Validation

**Ward Name Format:**

- Allow: Letters, numbers, spaces, Polish characters (ąćęłńóśźż)
- Max length: 255 characters
- Trim whitespace

**Search Query:**

- Min length: 1 character (after trimming)
- Max length: 100 characters
- SQL injection prevention via parameterized queries

---

## 10. Business Logic Requirements

### BL-1: Ward Aggregation

- Group by unique `wardName`
- Count distinct hospitals per ward
- Sum `availablePlaces` (handle VARCHAR to INT conversion safely)
- Check favorite status per authenticated user
- Include data freshness metadata

### BL-2: Hospital Sorting with Negative Values

- Sort by `availablePlaces` numerically (not alphabetically)
- Treat negative values as "worse than 0"
- Handle non-numeric values gracefully

### BL-3: Favorites Optimistic Updates

- Client immediately updates UI before API call
- Rollback on error
- Recommended pattern for better UX

### BL-4: Fuzzy Search

- Use trigram index (`pg_trgm`) for similarity matching
- Case-insensitive search on `wardName`
- Support partial matches

### BL-5: Data Staleness Check

- Data is stale if last scrape > 12 hours ago
- Helper function: `is_data_stale()`

### BL-6: Orphaned Favorites Cleanup

- Automatic trigger after `hospital_wards` modifications
- Removes favorites for non-existent wards
- Maintains referential integrity

> **Implementation details** (SQL code, TypeScript patterns) in `api-implementation-plan.md`

---

## 11. Caching Strategy

### Client-Side Caching

**Ward List:**

- Cache duration: 10 minutes
- Invalidate on: User adds/removes favorite

**Hospital List:**

- Cache duration: 10 minutes
- Invalidate on: Never (read-only data)

**AI Insights:**

- Cache duration: 1 hour
- Invalidate on: Never (24h server-side cache)

**Status:**

- Cache duration: 5 minutes
- Invalidate on: Never

### HTTP Cache Headers

```http
Cache-Control: public, max-age=600
ETag: "33a64df551425fcc55e4d42a148795d9f25f89d4"
Last-Modified: Wed, 24 Jan 2025 12:00:00 GMT
```

### Supabase Automatic Caching

Supabase REST API automatically uses PostgreSQL connection pooling and query result caching.

---

## 12. CORS Configuration

### Allowed Origins (Production)

```
https://hoslu.onrender.com
https://hoslu-app.netlify.app
```

### Allowed Methods

```
GET, POST, DELETE, OPTIONS
```

### Allowed Headers

```
Authorization, Content-Type, apikey, Prefer
```

### Configuration (Supabase Dashboard)

Navigate to: **Settings > API > CORS Settings**

```json
{
  "allowedOrigins": ["https://hoslu.onrender.com"],
  "allowedMethods": ["GET", "POST", "DELETE", "OPTIONS"],
  "allowedHeaders": ["Authorization", "Content-Type", "apikey", "Prefer"],
  "exposedHeaders": ["X-RateLimit-Limit", "X-RateLimit-Remaining"],
  "maxAge": 3600,
  "credentials": true
}
```

---

## 13. Testing Strategy

### Unit Tests (Backend Functions)

- Test `get_wards_aggregated()` with various search queries
- Test `get_user_favorites_with_stats()` with orphaned favorites
- Test `is_data_stale()` with different timestamps
- Test VARCHAR to INTEGER conversion edge cases

### Integration Tests

- Auth flow: signup → verify email → login → access protected endpoint
- Favorites flow: add → list → delete → verify deletion
- Search flow: empty query → partial match → no results
- RLS enforcement: attempt to access another user's favorites (expect 403)

### End-to-End Tests (Manual for MVP)

1. **User Registration & Login**
   - Sign up with valid email
   - Verify email (check inbox)
   - Log in with credentials
   - Access dashboard

2. **Browse Wards**
   - View ward list with aggregated stats
   - Search for "Kardio" (verify trigram matching)
   - Filter by favorites (empty initially)

3. **Hospital Details**
   - Click on ward → view hospital list
   - Verify sorting (highest places first)
   - Check negative values display correctly

4. **Favorites Management**
   - Add ward to favorites (verify optimistic update)
   - Refresh page (verify persistence)
   - Remove from favorites (verify deletion)
   - Toggle "favorites only" filter

5. **AI Insights**
   - Verify insight displays (if within 24h window)
   - Verify graceful degradation if expired

6. **Data Staleness**
   - Mock old scrape time (DB update)
   - Verify warning banner appears
   - Verify link to source is present

7. **Account Deletion**
   - Delete account via API
   - Verify logout
   - Verify cannot log in again
   - Verify favorites deleted (check DB)

---

## 14. Performance Considerations

### Database Indexes

Ensure these indexes exist (from db-plan.md):

```sql
-- Ward search performance
CREATE INDEX idx_hospital_wards_ward_name_trgm
ON hospital_wards USING GIN ("wardName" gin_trgm_ops);

-- District filtering
CREATE INDEX idx_hospital_wards_district
ON hospital_wards (district);

-- Freshness sorting
CREATE INDEX idx_hospital_wards_scraped_at
ON hospital_wards ("scrapedAt" DESC);

-- User favorites lookup
CREATE INDEX idx_user_favorites_user_id
ON user_favorites (user_id);

-- Favorites cleanup trigger
CREATE INDEX idx_user_favorites_ward_name
ON user_favorites (ward_name);
```

### Query Optimization

**Best Practices:**

- Avoid N+1 queries (use JOINs or batch queries)
- Use SELECT projection (fetch only needed columns)
- Leverage database indexes

**Connection Pooling:**

- Supabase manages automatically
- Default pool size: 10 connections

> See `api-implementation-plan.md` for code examples

---

## 15. Security Best Practices

### 1. Never Expose Service Role Key

- ❌ Frontend: Never use `SUPABASE_SERVICE_ROLE_KEY`
- ✅ Frontend: Use `SUPABASE_ANON_KEY` + JWT authentication
- ✅ Backend: Service Role Key only in API routes

### 2. Validate Input on Both Sides

- Frontend: Client-side validation (UX feedback)
- Backend: Zod schemas (security enforcement)
- Database: Constraints and RLS policies (integrity)

### 3. Use Prepared Statements

- Supabase REST API uses parameterized queries automatically
- For custom SQL: Always use `$1, $2` placeholders

### 4. Rate Limiting

- MVP: Not implemented (rely on Supabase defaults)
- Post-MVP: Implement with Redis + Edge Functions
- See `api-implementation-plan.md` for patterns

### 5. HTTPS Only

- Enforced automatically by Supabase in production

---

## 16. Monitoring & Observability

### Health Check Endpoint

**Endpoint:** `GET /health` (for scraper service)

```json
{
  "status": "healthy",
  "timestamp": "2025-01-24T14:30:00Z",
  "database": "connected",
  "lastScrape": "2025-01-24T12:00:00Z"
}
```

### Key Metrics to Track

1. **API Response Times**
   - p50, p95, p99 latencies per endpoint
   - Target: p95 < 500ms for GET requests

2. **Error Rates**
   - 4xx errors (client errors)
   - 5xx errors (server errors)
   - Target: < 1% error rate

3. **Authentication Success Rate**
   - Login success vs failures
   - Target: > 95% success rate

4. **Database Performance**
   - Query execution times
   - Connection pool utilization
   - Target: < 100ms for simple queries

5. **Scraping KPIs**
   - Success rate (target: > 95%)
   - Data freshness (target: < 12h)
   - Records inserted/updated per run

### Logging Best Practices

**Requirements:**

- Structured logging (JSON format)
- Include context: userId, endpoint, duration
- Log errors with stack traces
- Never log sensitive data (passwords, tokens)

> Implementation patterns in `api-implementation-plan.md` → Section 6

---

## 17. API Versioning (Future Consideration)

For MVP, versioning is handled by Supabase REST API (`/rest/v1`). For future custom endpoints:

### URL Versioning (Recommended)

```
https://api.hoslu.app/v1/wards
https://api.hoslu.app/v2/wards
```

### Header Versioning (Alternative)

```http
GET /api/wards
Accept: application/vnd.hoslu.v1+json
```

### Deprecation Strategy

1. Announce deprecation 6 months in advance
2. Add `Sunset` header to deprecated endpoints
3. Return warnings in response body
4. Remove deprecated version after 12 months

```http
HTTP/1.1 200 OK
Sunset: Wed, 24 Jul 2026 12:00:00 GMT
Warning: 299 - "This API version will be deprecated on 2026-07-24"
```

---

## 18. Implementation Roadmap

### Phase 1: Core Functionality (MVP)

1. ✅ **Authentication** - Supabase Auth (sign up, login, email verification)
2. ✅ **Ward List** - GET wards with aggregation and search
3. ✅ **Hospital List** - GET hospitals by ward with filtering
4. ✅ **Favorites** - POST/DELETE favorites with optimistic updates
5. ✅ **AI Insights** - GET current insight with graceful degradation
6. ✅ **Data Freshness** - Warning banner using helper functions

### Phase 2: Enhanced Features (Post-MVP)

7. ⏳ **Status Dashboard** - GET /api/status (admin metrics aggregation)
8. ⏳ **Scraping Logs** - GET logs for monitoring dashboard
9. ⏳ **Account Deletion** - DELETE user account (GDPR)
10. ⏳ **District Autocomplete** - GET unique districts for filter dropdown
11. ⏳ **Advanced Search** - Fuzzy matching with relevance scoring

### Phase 3: Optimization (Future)

12. ⏳ **Rate Limiting** - Implement per-user limits with Redis
13. ⏳ **Response Caching** - Add ETags and conditional requests
14. ⏳ **Batch Operations** - Bulk add/remove favorites
15. ⏳ **WebSocket Support** - Real-time updates via Supabase Realtime

---

## 19. Additional Custom Functions Required

### Function: get_unique_districts()

Returns list of unique districts for filter dropdown.

```sql
CREATE OR REPLACE FUNCTION get_unique_districts()
RETURNS TABLE (district VARCHAR) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT hw.district
  FROM hospital_wards hw
  WHERE hw.district IS NOT NULL
  ORDER BY hw.district ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Usage:**

```http
GET /rest/v1/rpc/get_unique_districts
```

**Response:**

```json
[{ "district": "Biała Podlaska" }, { "district": "Lubartów" }, { "district": "Lublin" }, { "district": "Puławy" }]
```

---

## 20. Summary

This document defines the **REST API contract** for HosLU MVP - the HTTP interface specification.

**What's included**:

- ✅ Endpoint descriptions (URL, methods, query params)
- ✅ Request/Response formats (JSON examples)
- ✅ Authentication & authorization requirements
- ✅ Error codes and responses
- ✅ Business logic requirements (what, not how)
- ✅ Rate limiting, CORS, caching policies
- ✅ Pagination & filtering specifications

**What's NOT included** (see `api-implementation-plan.md`):

- ❌ TypeScript code examples
- ❌ Service layer patterns
- ❌ Zod validation schemas
- ❌ PostgreSQL function implementations
- ❌ Testing strategies

**Design Priorities**:

- **Simplicity**: REST-ful, resource-oriented design
- **Security**: JWT + RLS, validated inputs
- **Performance**: Indexed queries, pagination
- **User Experience**: Clear errors, graceful degradation

---

**Version:** 1.1  
**Last Updated:** 2025-01-25  
**Status:** Ready for Implementation  
**Companion Doc:** `api-implementation-plan.md`
