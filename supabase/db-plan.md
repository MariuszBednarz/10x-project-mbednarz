# Database Plan - HosLU MVP

Database schema documentation for the HosLU hospital bed availability application.

## Table of Contents

- [Schema Overview](#schema-overview)
- [Tables](#tables)
- [Relationships](#relationships)
- [Indexes](#indexes)
- [Row Level Security (RLS)](#row-level-security-rls)
- [Triggers](#triggers)
- [Helper Functions](#helper-functions)
- [Type Synchronization](#type-synchronization)
- [Deployment Procedures](#deployment-procedures)
- [Common Queries](#common-queries)

---

## Schema Overview

**Database**: PostgreSQL (Supabase Cloud)  
**Region**: EU (closest available)  
**Tables**: 4 main tables + `auth.users` (Supabase managed)

```
┌─────────────────┐
│  auth.users     │ (Supabase Auth)
└────────┬────────┘
         │
         │ FK CASCADE DELETE
         ↓
┌─────────────────┐      Soft Reference
│ user_favorites  │◄────────────────────┐
└─────────────────┘                     │
                                        │
┌─────────────────┐                     │
│ hospital_wards  │─────────────────────┘
│ (UPSERT target) │
└─────────────────┘

┌─────────────────┐
│  ai_insights    │ (Independent, global cache)
└─────────────────┘

┌─────────────────┐
│ scraping_logs   │ (Audit/monitoring)
└─────────────────┘
```

---

## Tables

### 1. `hospital_wards`

Core table storing scraped hospital bed availability data. Updated via UPSERT every 12 hours.

| Column            | Type                     | Constraints                   | Description                              |
| ----------------- | ------------------------ | ----------------------------- | ---------------------------------------- |
| `id`              | UUID                     | PK, DEFAULT gen_random_uuid() | Primary key                              |
| `wardName`        | VARCHAR(255)             | NOT NULL                      | Ward name (e.g., "Kardiologia")          |
| `wardLink`        | TEXT                     | NULLABLE                      | URL to ward details page                 |
| `district`        | VARCHAR(100)             | NULLABLE                      | District name (e.g., "Lublin")           |
| `hospitalName`    | VARCHAR(255)             | NOT NULL                      | Hospital name                            |
| `availablePlaces` | VARCHAR(10)              | NOT NULL, DEFAULT '0'         | Bed count (can be negative for overflow) |
| `lastUpdated`     | VARCHAR(255)             | NULLABLE                      | UNRELIABLE: timestamp from HTML source   |
| `scrapedAt`       | TIMESTAMP WITH TIME ZONE | NOT NULL                      | RELIABLE: scraping execution time        |
| `created_at`      | TIMESTAMP WITH TIME ZONE | DEFAULT NOW()                 | First insertion timestamp                |
| `updated_at`      | TIMESTAMP WITH TIME ZONE | DEFAULT NOW()                 | Last update (auto-updated by trigger)    |

**Unique Constraint**: `(wardName, hospitalName)`

**Notes**:

- `availablePlaces` stored as VARCHAR to handle non-numeric values from source
- Negative values indicate ward overflow (e.g., "-3" = 3 patients over capacity)
- `scrapedAt` is the authoritative timestamp for data freshness checks
- `lastUpdated` is extracted from HTML and may be unreliable

---

### 2. `user_favorites`

Stores user's favorite wards for quick access.

| Column       | Type                     | Constraints                                     | Description                                           |
| ------------ | ------------------------ | ----------------------------------------------- | ----------------------------------------------------- |
| `id`         | UUID                     | PK, DEFAULT gen_random_uuid()                   | Primary key                                           |
| `user_id`    | UUID                     | NOT NULL, FK → auth.users(id) ON DELETE CASCADE | User reference                                        |
| `ward_name`  | VARCHAR(255)             | NOT NULL                                        | Ward name (soft reference to hospital_wards.wardName) |
| `created_at` | TIMESTAMP WITH TIME ZONE | DEFAULT NOW()                                   | When ward was favorited                               |

**Unique Constraint**: `(user_id, ward_name)` (prevents duplicate favorites)

**Notes**:

- No hard FK to `hospital_wards` (soft reference by name)
- Orphaned favorites cleaned up by trigger when ward no longer exists
- CASCADE DELETE on user deletion (GDPR compliance)

---

### 3. `ai_insights`

Caches daily AI-generated insights about bed availability (24h TTL).

| Column         | Type                     | Constraints                   | Description                           |
| -------------- | ------------------------ | ----------------------------- | ------------------------------------- |
| `id`           | UUID                     | PK, DEFAULT gen_random_uuid() | Primary key                           |
| `insight_text` | TEXT                     | NOT NULL                      | AI-generated insight (1-2 sentences)  |
| `generated_at` | TIMESTAMP WITH TIME ZONE | DEFAULT NOW()                 | When insight was generated            |
| `expires_at`   | TIMESTAMP WITH TIME ZONE | NOT NULL                      | Expiration time (generated_at + 24h)  |
| `created_at`   | TIMESTAMP WITH TIME ZONE | DEFAULT NOW()                 | Record creation timestamp             |
| `updated_at`   | TIMESTAMP WITH TIME ZONE | DEFAULT NOW()                 | Last update (auto-updated by trigger) |

**Check Constraint**: `expires_at > generated_at`

**Notes**:

- Global cache shared by all users
- Generated daily at 6:00 AM
- RLS policy only shows active (non-expired) insights

---

### 4. `scraping_logs`

Audit log for scraping operations. Used for calculating success rate KPI (target: >95%).

| Column             | Type                     | Constraints                               | Description                         |
| ------------------ | ------------------------ | ----------------------------------------- | ----------------------------------- |
| `id`               | UUID                     | PK, DEFAULT gen_random_uuid()             | Primary key                         |
| `started_at`       | TIMESTAMP WITH TIME ZONE | NOT NULL, DEFAULT NOW()                   | Scraping job start time             |
| `completed_at`     | TIMESTAMP WITH TIME ZONE | NULLABLE                                  | Scraping job completion time        |
| `status`           | VARCHAR(20)              | NOT NULL, CHECK IN ('success', 'failure') | Job outcome                         |
| `records_inserted` | INT                      | DEFAULT 0                                 | Number of new records created       |
| `records_updated`  | INT                      | DEFAULT 0                                 | Number of existing records updated  |
| `error_message`    | TEXT                     | NULLABLE                                  | Error details if status = 'failure' |
| `created_at`       | TIMESTAMP WITH TIME ZONE | DEFAULT NOW()                             | Log entry creation                  |

**Check Constraint**: `completed_at >= started_at` (if not NULL)

**Notes**:

- `completed_at` is NULL if job is still running or crashed
- Used for monitoring scraping health and calculating KPIs

---

## Relationships

### Hard Foreign Key

- `user_favorites.user_id` → `auth.users.id` (CASCADE DELETE)
  - Deleting a user automatically deletes all their favorites (GDPR)

### Soft Reference (No FK)

- `user_favorites.ward_name` ≈ `hospital_wards.wardName` (by value)
  - No FK to avoid blocking scraper UPSERT operations
  - Orphaned favorites cleaned up by trigger `cleanup_orphaned_favorites`

### Independent Tables

- `ai_insights`: No relations, global cache
- `scraping_logs`: No relations, audit trail

---

## Indexes

### `hospital_wards`

| Index Name                          | Type        | Columns          | Purpose                   |
| ----------------------------------- | ----------- | ---------------- | ------------------------- |
| `idx_hospital_wards_scraped_at`     | B-tree      | `scrapedAt DESC` | Sort by freshness         |
| `idx_hospital_wards_district`       | B-tree      | `district`       | Filter by district        |
| `idx_hospital_wards_ward_name_trgm` | GIN trigram | `wardName`       | Fuzzy/live search (ILIKE) |

**Extension Required**: `pg_trgm` (installed in migration 5)

### `user_favorites`

| Index Name                     | Type   | Columns     | Purpose                |
| ------------------------------ | ------ | ----------- | ---------------------- |
| `idx_user_favorites_user_id`   | B-tree | `user_id`   | Find user's favorites  |
| `idx_user_favorites_ward_name` | B-tree | `ward_name` | Cleanup trigger lookup |

### `ai_insights`

| Index Name                     | Type           | Columns                                      | Purpose              |
| ------------------------------ | -------------- | -------------------------------------------- | -------------------- |
| `idx_ai_insights_expires_at`   | Partial B-tree | `expires_at DESC` WHERE `expires_at > NOW()` | Find active insights |
| `idx_ai_insights_generated_at` | B-tree         | `generated_at DESC`                          | Find latest insight  |

### `scraping_logs`

| Index Name                     | Type   | Columns           | Purpose                   |
| ------------------------------ | ------ | ----------------- | ------------------------- |
| `idx_scraping_logs_created_at` | B-tree | `created_at DESC` | Time-based queries        |
| `idx_scraping_logs_status`     | B-tree | `status`          | Filter by success/failure |

---

## Row Level Security (RLS)

All tables have RLS **enabled**. Scraper uses Service Role Key which **bypasses RLS**.

### `hospital_wards`

| Policy Name                               | Operation | Rule                            |
| ----------------------------------------- | --------- | ------------------------------- |
| "Authenticated users read hospital_wards" | SELECT    | `auth.role() = 'authenticated'` |

**Notes**:

- No INSERT/UPDATE/DELETE policies (scraper uses Service Role Key)
- Anonymous users **blocked** from reading data

### `user_favorites`

| Policy Name                      | Operation | Rule                   |
| -------------------------------- | --------- | ---------------------- |
| "Users can view own favorites"   | SELECT    | `auth.uid() = user_id` |
| "Users can insert own favorites" | INSERT    | `auth.uid() = user_id` |
| "Users can delete own favorites" | DELETE    | `auth.uid() = user_id` |

**Notes**: Users cannot view/modify other users' favorites

### `ai_insights`

| Policy Name                                   | Operation | Rule                                                   |
| --------------------------------------------- | --------- | ------------------------------------------------------ |
| "Authenticated users read active ai_insights" | SELECT    | `auth.role() = 'authenticated' AND expires_at > NOW()` |

**Notes**: Only active (non-expired) insights are visible

### `scraping_logs`

| Policy Name                                  | Operation | Rule                            |
| -------------------------------------------- | --------- | ------------------------------- |
| "Authenticated users can read scraping_logs" | SELECT    | `auth.role() = 'authenticated'` |

**Notes**: Read-only access for monitoring/debugging

---

## Triggers

### 1. `trigger_cleanup_orphaned_favorites`

**Table**: `hospital_wards`  
**Timing**: AFTER INSERT, UPDATE, DELETE  
**Scope**: FOR EACH STATEMENT  
**Function**: `cleanup_orphaned_favorites()`

**Purpose**: Automatically removes favorites for wards that no longer exist in `hospital_wards`.

**Behavior**:

```sql
DELETE FROM user_favorites
WHERE ward_name NOT IN (
    SELECT DISTINCT "wardName" FROM hospital_wards
);
```

**When Triggered**:

- After scraper UPSERT operations
- When ward is removed from source data
- Ensures favorites stay in sync with available wards

---

### 2. `trigger_ai_insights_updated_at`

**Table**: `ai_insights`  
**Timing**: BEFORE UPDATE  
**Scope**: FOR EACH ROW  
**Function**: `update_updated_at_column()`

**Purpose**: Automatically updates `updated_at` timestamp when record is modified.

**Behavior**:

```sql
NEW.updated_at = NOW();
```

---

### 3. `update_hospital_wards_updated_at` (if exists)

**Table**: `hospital_wards`  
**Timing**: BEFORE UPDATE  
**Scope**: FOR EACH ROW  
**Function**: `update_updated_at_column()`

**Purpose**: Automatically updates `updated_at` timestamp when record is modified.

---

## Helper Functions

### 1. `is_data_stale()` → BOOLEAN

Returns `true` if the latest scraped data is older than 12 hours.

**Usage**:

```sql
SELECT is_data_stale(); -- true or false
```

**Use Case**: Display warning banner in frontend when data is stale

---

### 2. `get_last_scrape_time()` → TIMESTAMP WITH TIME ZONE

Returns the timestamp of the most recent scraping operation.

**Usage**:

```sql
SELECT get_last_scrape_time();
-- Returns: 2025-01-23 14:35:22+00
```

**Use Case**: Show "Last updated: X hours ago" in UI

---

### 3. `count_unique_wards()` → INTEGER

Returns the count of unique ward names in the system.

**Usage**:

```sql
SELECT count_unique_wards(); -- e.g., 28
```

**Use Case**: Monitoring and statistics dashboard

---

### 4. `count_unique_hospitals()` → INTEGER

Returns the count of unique hospital names in the system.

**Usage**:

```sql
SELECT count_unique_hospitals(); -- e.g., 15
```

**Use Case**: Monitoring and statistics dashboard

---

### 5. `calculate_scraping_success_rate(days INTEGER DEFAULT 30)` → NUMERIC

Calculates scraping success rate percentage for the last N days.

**Usage**:

```sql
SELECT calculate_scraping_success_rate(7);  -- Last 7 days
SELECT calculate_scraping_success_rate(30); -- Last 30 days (default)
-- Returns: 96.50
```

**Use Case**: KPI monitoring (target: >95%)

---

### 6. `get_total_places_by_ward(p_ward_name VARCHAR)` → INTEGER

Calculates total available places across all hospitals for a specific ward.

**Usage**:

```sql
SELECT get_total_places_by_ward('Kardiologia'); -- e.g., 27
```

**Use Case**: AI insights generation, analytics

**Notes**: Safely handles VARCHAR to INTEGER conversion

---

## Type Synchronization

### Single Source of Truth

**Supabase PostgreSQL schema** → Frontend + Scraper types

### Frontend (Auto-Generated)

```bash
# After database migration
cd hoslu-frontend
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/types/database.types.ts
```

**Generated File**: `src/types/database.types.ts`

**Usage**:

```typescript
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types/database.types";

const supabase = createClient<Database>(url, key);

// Type-safe queries
const { data } = await supabase.from("hospital_wards").select("*");
// data is typed as Database['public']['Tables']['hospital_wards']['Row'][]
```

**When to Regenerate**:

- ✅ After adding/removing tables
- ✅ After adding/removing columns
- ✅ After changing column types
- ✅ After adding/removing functions
- ❌ NOT needed for data changes

---

### Scraper (Manual Interfaces)

**Location**: `scrap-app-be/src/scraper/interfaces/database.types.ts`

**Interfaces**:

```typescript
export interface HospitalWard {
  id?: string;
  wardName: string;
  wardLink?: string;
  district?: string;
  hospitalName: string;
  availablePlaces: string;
  lastUpdated?: string;
  scrapedAt: Date; // Converted to ISO string for DB
}

export interface ScrapingLog {
  id?: string;
  started_at: Date;
  completed_at?: Date;
  status: "success" | "failure";
  records_inserted: number;
  records_updated: number;
  error_message?: string;
}

export interface AIInsight {
  id?: string;
  insight_text: string;
  generated_at: Date;
  expires_at: Date; // generated_at + 24 hours
}
```

**When to Update**:

- ✅ When schema changes for tables scraper uses
- ✅ When field types change
- ❌ NOT needed for tables scraper doesn't use (e.g., `user_favorites`)

---

## Deployment Procedures

### Prerequisites

- [ ] Supabase account and project created
- [ ] Supabase CLI installed: `npm install -g supabase`
- [ ] Project linked: `supabase link --project-ref YOUR_PROJECT_REF`

### Migration Order

Execute migrations **in order**:

1. `20250123000001_create_user_favorites.sql`
2. `20250123000002_create_ai_insights.sql`
3. `20250123000003_create_scraping_logs.sql`
4. `20250123000004_update_hospital_wards_rls.sql`
5. `20250123000005_add_search_indexes.sql`
6. `20250123000006_add_triggers.sql`
7. `20250123000007_add_helper_functions.sql`

### Deployment Methods

#### Option A: Supabase CLI (Recommended)

```bash
cd hoslu-frontend
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
supabase migration list  # Verify
```

#### Option B: Supabase Dashboard

1. Open SQL Editor in Supabase Dashboard
2. Copy/paste each migration file content
3. Execute in order

### Verification Checklist

After deployment, verify:

```sql
-- Check all tables exist
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public' ORDER BY table_name;
-- Expected: ai_insights, hospital_wards, scraping_logs, user_favorites

-- Check RLS is enabled
SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';
-- Expected: All should have rowsecurity = true

-- Check pg_trgm extension
SELECT extname FROM pg_extension WHERE extname = 'pg_trgm';
-- Expected: pg_trgm

-- Check triggers exist
SELECT tgname FROM pg_trigger
WHERE tgname IN ('trigger_cleanup_orphaned_favorites', 'trigger_ai_insights_updated_at');
-- Expected: 2 triggers

-- Check functions exist
SELECT routine_name FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN ('is_data_stale', 'get_last_scrape_time',
                       'count_unique_wards', 'count_unique_hospitals',
                       'calculate_scraping_success_rate', 'get_total_places_by_ward')
ORDER BY routine_name;
-- Expected: 6 functions
```

### Post-Deployment

1. **Regenerate Frontend Types**:

   ```bash
   cd hoslu-frontend
   npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/types/database.types.ts
   git add src/types/database.types.ts
   git commit -m "chore: regenerate database types after migration"
   ```

2. **Update Scraper Interfaces** (if schema changed):

   ```bash
   cd scrap-app-be
   # Manually edit src/scraper/interfaces/database.types.ts
   git add src/scraper/interfaces/database.types.ts
   git commit -m "chore: update database interfaces after migration"
   ```

3. **Test Scraper Integration**:
   ```bash
   curl https://your-scraper.onrender.com/health
   # Check Render logs for next scheduled run
   ```

### Rollback Procedure

If something goes wrong, execute migrations in **reverse order**:

```sql
-- 7. Drop helper functions
DROP FUNCTION IF EXISTS get_total_places_by_ward(VARCHAR);
DROP FUNCTION IF EXISTS calculate_scraping_success_rate(INTEGER);
DROP FUNCTION IF EXISTS count_unique_hospitals();
DROP FUNCTION IF EXISTS count_unique_wards();
DROP FUNCTION IF EXISTS get_last_scrape_time();
DROP FUNCTION IF EXISTS is_data_stale();

-- 6. Drop triggers
DROP TRIGGER IF EXISTS trigger_ai_insights_updated_at ON ai_insights;
DROP TRIGGER IF EXISTS trigger_cleanup_orphaned_favorites ON hospital_wards;
DROP FUNCTION IF EXISTS cleanup_orphaned_favorites();
DROP FUNCTION IF EXISTS update_updated_at_column();

-- 5. Drop search indexes
DROP INDEX IF EXISTS idx_hospital_wards_ward_name_trgm;
DROP EXTENSION IF EXISTS pg_trgm;

-- 4. Revert hospital_wards RLS
DROP POLICY IF EXISTS "Authenticated users read hospital_wards" ON hospital_wards;
CREATE POLICY "Allow all operations on hospital_wards"
    ON hospital_wards FOR ALL USING (true) WITH CHECK (true);

-- 3. Drop scraping_logs
DROP TABLE IF EXISTS scraping_logs CASCADE;

-- 2. Drop ai_insights
DROP TABLE IF EXISTS ai_insights CASCADE;

-- 1. Drop user_favorites
DROP TABLE IF EXISTS user_favorites CASCADE;
```

---

## Common Queries

### Data Freshness

```sql
-- Check if data is stale
SELECT is_data_stale() as is_stale;

-- Get last scrape time
SELECT get_last_scrape_time() as last_scrape,
       NOW() - get_last_scrape_time() as time_since_scrape;

-- Overall health check
SELECT
    MAX("scrapedAt") as latest_scrape,
    CASE
        WHEN MAX("scrapedAt") < NOW() - INTERVAL '12 hours'
        THEN 'STALE' ELSE 'FRESH'
    END as status
FROM hospital_wards;
```

### Ward Queries

```sql
-- Get all wards with fresh data
SELECT
    "wardName",
    COUNT(*) as hospital_count,
    SUM(CASE
        WHEN "availablePlaces" ~ '^-?[0-9]+$'
        THEN "availablePlaces"::INTEGER ELSE 0
    END) as total_places
FROM hospital_wards
WHERE "scrapedAt" > NOW() - INTERVAL '12 hours'
GROUP BY "wardName"
ORDER BY "wardName";

-- Search wards (fuzzy match)
SELECT DISTINCT "wardName"
FROM hospital_wards
WHERE "wardName" ILIKE '%kardio%'
ORDER BY "wardName";

-- Get hospitals by ward
SELECT "hospitalName", district, "availablePlaces", "scrapedAt"
FROM hospital_wards
WHERE "wardName" = 'Kardiologia'
ORDER BY CASE
    WHEN "availablePlaces" ~ '^-?[0-9]+$'
    THEN "availablePlaces"::INTEGER ELSE 0
END DESC;

-- Find overflow wards (negative places)
SELECT "wardName", "hospitalName", district, "availablePlaces"
FROM hospital_wards
WHERE "availablePlaces" ~ '^-[0-9]+$'
ORDER BY "availablePlaces"::INTEGER ASC;
```

### User Favorites

```sql
-- Get user's favorites with availability
SELECT
    f.ward_name,
    COUNT(DISTINCT h."hospitalName") as hospital_count,
    SUM(CASE
        WHEN h."availablePlaces" ~ '^-?[0-9]+$'
        THEN h."availablePlaces"::INTEGER ELSE 0
    END) as total_places
FROM user_favorites f
LEFT JOIN hospital_wards h ON h."wardName" = f.ward_name
WHERE f.user_id = 'USER_UUID_HERE'
GROUP BY f.ward_name
ORDER BY f.created_at DESC;

-- Find orphaned favorites (should be none if trigger works)
SELECT f.ward_name, COUNT(h.id) as matching_records
FROM user_favorites f
LEFT JOIN hospital_wards h ON h."wardName" = f.ward_name
GROUP BY f.ward_name
HAVING COUNT(h.id) = 0;
```

### AI Insights

```sql
-- Get active insight
SELECT insight_text, generated_at, expires_at
FROM ai_insights
WHERE expires_at > NOW()
ORDER BY generated_at DESC
LIMIT 1;

-- Check if new insight needed
SELECT
    CASE
        WHEN MAX(expires_at) < NOW() OR MAX(expires_at) IS NULL
        THEN 'GENERATE_NEW' ELSE 'USE_CACHED'
    END as action
FROM ai_insights;
```

### Scraping Logs & KPIs

```sql
-- Success rate (last 30 days)
SELECT calculate_scraping_success_rate(30) as success_rate_percent;

-- Detailed success rate
SELECT
    COUNT(*) as total_runs,
    COUNT(*) FILTER (WHERE status = 'success') as successes,
    COUNT(*) FILTER (WHERE status = 'failure') as failures,
    ROUND(COUNT(*) FILTER (WHERE status = 'success') * 100.0 / COUNT(*), 2) as success_rate
FROM scraping_logs
WHERE created_at > NOW() - INTERVAL '30 days';

-- Recent activity
SELECT started_at, completed_at, status,
       records_inserted, records_updated, error_message
FROM scraping_logs
ORDER BY started_at DESC
LIMIT 10;
```

### Monitoring Dashboard

```sql
-- System health overview
SELECT 'Data Freshness' as metric,
       CASE WHEN is_data_stale() THEN '⚠️ STALE' ELSE '✅ FRESH' END as status,
       get_last_scrape_time()::TEXT as value
UNION ALL
SELECT 'Success Rate (30d)',
       CASE
           WHEN calculate_scraping_success_rate(30) >= 95 THEN '✅ GOOD'
           WHEN calculate_scraping_success_rate(30) >= 80 THEN '⚠️ WARNING'
           ELSE '❌ CRITICAL'
       END,
       calculate_scraping_success_rate(30)::TEXT || '%'
UNION ALL
SELECT 'Total Wards', '📊 INFO', count_unique_wards()::TEXT
UNION ALL
SELECT 'Total Hospitals', '📊 INFO', count_unique_hospitals()::TEXT;
```

---

## Design Notes

### Timestamp Strategy

- **`scrapedAt`**: Source of truth for data freshness (set by scraper)
- **`lastUpdated`**: Unreliable HTML string from source, display only
- **`created_at`**: Record creation timestamp (never changes)
- **`updated_at`**: Auto-updated by trigger on modification

### Soft Reference Design

`user_favorites.ward_name` is **intentionally NOT a foreign key** to avoid blocking scraper UPSERT operations. Cleanup is handled via trigger.

### Service Role Key Bypass

Scraper and AI job use **Service Role Key** which completely bypasses RLS, allowing unrestricted INSERT/UPDATE/DELETE operations.

### No Historical Data

`hospital_wards` uses UPSERT-only (no history tracking) for MVP simplicity. Historical analytics is out of scope.

### camelCase vs snake_case

- **`hospital_wards`**: Uses camelCase column names in quotes (created by scraper)
- **New tables**: Use snake_case convention (e.g., `user_favorites.ward_name`)
- TypeScript types match database naming exactly

---

**Version**: 1.0 (MVP)  
**Last Updated**: 2025-01-23  
**Schema Status**: Implementation Ready
