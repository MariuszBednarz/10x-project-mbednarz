# Database Planning Session Notes

Planning session summary for HosLU database architecture and implementation decisions.

## Session Overview

**Date**: 2025-01-23  
**Session Type**: Database Architecture Planning  
**Scope**: MVP schema design for hospital bed availability application  
**Outcome**: Complete schema with 4 tables, RLS policies, triggers, and helper functions

---

## Key Decisions

### 1. Data Update Strategy: UPSERT Pattern

**Decision**: Use PostgreSQL UPSERT with conflict resolution instead of DELETE+INSERT.

**Rationale**:

- Atomic operations prevent race conditions
- Preserves record IDs and timestamps (`created_at` never changes)
- Foreign keys remain valid during updates
- Better performance for partial data changes

**Implementation**:

```sql
UPSERT hospital_wards
ON CONFLICT (wardName, hospitalName)
DO UPDATE SET ...
```

**Alternative Rejected**: DELETE all + INSERT new (would break FK references, lose created_at)

---

### 2. Soft Reference for Favorites

**Decision**: `user_favorites.ward_name` is a VARCHAR field (NOT a foreign key to `hospital_wards.wardName`).

**Rationale**:

- Avoids blocking scraper UPSERT operations when wards are removed
- Prevents FK constraint violations during scraper updates
- Simpler scraper logic (no need to handle FK cascades)

**Trade-off Accepted**:

- Risk of orphaned favorites when wards disappear from source data
- **Mitigation**: Trigger `cleanup_orphaned_favorites` runs after every scraper update

**Alternative Rejected**: Hard FK with CASCADE DELETE (would require complex scraper transaction management)

---

### 3. Timestamp Fields: Dual Strategy

**Decision**: Keep both `lastUpdated` (from HTML) and `scrapedAt` (from scraper).

**Rationale**:

- **`lastUpdated`** (VARCHAR):
  - Extracted from source HTML (e.g., "2025-01-23 14:35")
  - Unreliable (may be stale, malformed, or missing)
  - **Use Case**: Display to user as "Source updated: X"
- **`scrapedAt`** (TIMESTAMP WITH TIME ZONE):
  - Set by scraper at execution time
  - Reliable, always present
  - **Use Case**: Data freshness checks, warning banners

**Alternative Rejected**: Use only `lastUpdated` (too unreliable for freshness logic)

---

### 4. Warning Threshold: 12 Hours

**Decision**: Show warning banner when data is >12 hours old.

**Rationale**:

- Scraper runs every 12 hours (00:00, 12:00)
- If data is >12h old, it means scraper likely failed
- Matches scraper schedule for consistency

**Alternatives Considered**:

- 24 hours: Too lenient, users would see stale data too long
- 48 hours: Far too lenient for medical context

---

### 5. RLS Policy: Authenticated Only

**Decision**: Replace permissive "allow all" policy with authenticated-only access.

**Rationale**:

- No public access needed for MVP
- Reduces scraping by bots
- Encourages user registration (KPI goal: 30 users)
- Aligns with business model (user accounts required for favorites)

**Scraper Access**: Uses Service Role Key which bypasses RLS entirely.

**Alternative Rejected**: Keep anonymous read access (would reduce registration incentive)

---

### 6. Trigram Search Index

**Decision**: Use GIN trigram index instead of basic B-tree for ward name search.

**Rationale**:

- Supports fuzzy matching (`ILIKE '%kardio%'`)
- Better performance for live search with 300ms debounce
- Handles typos and partial matches
- Users may not know exact ward names

**Extension Required**: `pg_trgm` (available in Supabase by default)

**Alternative Rejected**: Basic B-tree index (only supports exact prefix matching)

---

### 7. AI Insights Cache: Database Table

**Decision**: Store AI insights in PostgreSQL table with 24h TTL (not Redis).

**Rationale**:

- MVP simplicity: no additional infrastructure
- Low volume: 1 insight per day, shared by all users
- RLS policy enforces TTL: `WHERE expires_at > NOW()`
- Easy to query for analytics later

**Alternatives Considered**:

- Redis: Overkill for MVP, additional cost/complexity
- In-memory cache: Lost on server restart

---

### 8. Repository Structure: Separate Repos

**Decision**: Keep scraper (`scrap-app-be`) and frontend (`hoslu-frontend`) as separate repositories.

**Rationale**:

- Independent deployment pipelines (Render.com Web Service vs Static Site)
- Different tech stacks (NestJS vs Astro+React)
- Scraper already deployed and working
- No code sharing needed (types are manually synced)

**Alternative Rejected**: Monorepo (would add complexity for minimal benefit in MVP)

---

### 9. Type Synchronization: Hybrid Approach

**Decision**:

- **Frontend**: Auto-generate types from Supabase schema
- **Scraper**: Manual interfaces

**Rationale**:

- Frontend: Supabase codegen provides full type safety for all tables
- Scraper: Only needs 3 tables, manual interfaces are simple and explicit
- Avoids scraper dependency on Supabase CLI

**Process**:

1. Modify database schema (migration)
2. Run `supabase gen types` for frontend
3. Manually update scraper interfaces (if affected tables changed)

**Alternative Rejected**: Auto-generate scraper types (would require Supabase CLI in scraper CI/CD)

---

### 10. No Accordion Component

**Decision**: Display all hospital data in cards without accordions.

**Rationale**:

- **Use Case**: Emergency medical context requires immediate visibility
- Users shouldn't need to click to see critical information
- Reduces cognitive load when comparing hospitals quickly
- Mobile-friendly: cards scroll naturally

**UI Design**:

- Card shows: name, district, badge with places, timestamp, icons (favorite, location, overflow emoji)
- All info visible at once

**Alternative Rejected**: Accordion with collapsed hospitals (requires extra click, slower decision-making)

---

### 11. availablePlaces as VARCHAR

**Decision**: Store `availablePlaces` as VARCHAR(10) instead of INTEGER.

**Rationale**:

- Source data may have non-numeric values (e.g., "N/A", "zamknięty", empty)
- Avoids scraper crashes on parse failures
- Allows graceful degradation (store as-is, handle conversion in queries)
- Negative values are valid (e.g., "-3" for overflow)

**Query Pattern**: Use regex + CASE for safe conversion:

```sql
CASE
    WHEN "availablePlaces" ~ '^-?[0-9]+$'
    THEN "availablePlaces"::INTEGER
    ELSE 0
END
```

**Alternative Rejected**: INTEGER + default 0 (loses information when source data is non-numeric)

---

### 12. Scraping Success Rate KPI

**Decision**: Track success rate in `scraping_logs` table with helper function.

**Rationale**:

- KPI goal: >95% success rate (defined in PRD)
- Database is better than log files for querying/aggregating
- Helper function `calculate_scraping_success_rate(days)` makes queries simple
- RLS allows authenticated users to monitor system health

**Data Collected**:

- `status`: success/failure
- `records_inserted`, `records_updated`: for debugging
- `error_message`: for failure analysis

---

### 13. Authentication: Supabase Auth (Managed Service)

**Decision**: Use Supabase Auth for user management instead of custom authentication.

**Rationale**:

- **Zero infrastructure**: Fully managed service (no auth server to maintain)
- **Built-in security**: JWT tokens, password hashing, rate limiting
- **Email verification**: Required flow out-of-the-box
- **RLS integration**: `auth.uid()` and `auth.role()` work seamlessly with PostgreSQL RLS
- **GDPR compliant**: User deletion handled by Supabase

**Implementation**:

- **User table**: `auth.users` (managed by Supabase, in separate schema)
- **Method**: Email + password with email verification required
- **Frontend**: `@supabase/supabase-js` with Anon Key + JWT
- **Scraper**: Service Role Key (bypasses RLS)

**Alternative Rejected**: Custom JWT implementation (would require auth server, token refresh logic, security audits)

---

### 14. Cascade Delete for GDPR Compliance

**Decision**: `user_favorites` has `ON DELETE CASCADE` from `auth.users`.

**Rationale**:

- GDPR compliance: deleting user account must delete all user data
- Supabase Auth doesn't automatically cascade to custom tables
- Explicit FK with CASCADE ensures no orphaned favorites

**Impact**: When user deletes account, all their favorites are automatically removed.

---

### 15. Partial Index for Active Insights

**Decision**: Use partial index `WHERE expires_at > NOW()` instead of full index.

**Rationale**:

- Frontend only queries active (non-expired) insights
- Partial index is smaller and faster for this specific query
- Expired insights are kept for analytics but not actively queried

**Query Pattern**:

```sql
SELECT * FROM ai_insights
WHERE expires_at > NOW()
ORDER BY generated_at DESC
LIMIT 1;
```

---

### 16. Naming Convention: Mixed Styles

**Decision**: Accept mixed camelCase/snake_case in database.

**Rationale**:

- **`hospital_wards`**: Uses camelCase (created by scraper before planning session)
- **New tables**: Use snake_case (PostgreSQL convention)
- **Impact**: Minimal, TypeScript types handle both styles
- **Trade-off**: Consistency sacrificed to avoid breaking existing scraper

**Future Consideration**: Standardize on snake_case in v2 (requires scraper refactor)

---

## Unresolved Issues

### 1. AI Insights Implementation (Deferred)

**Status**: Database schema ready, but Claude API integration not implemented.

**What's Missing**:

- NestJS service to call Claude API
- CRON job scheduled for 6:00 AM daily
- Prompt engineering for generating insights
- Error handling when API fails

**Blockers**: None (schema is ready, just needs scraper code)

**Next Steps**:

1. Add `ANTHROPIC_API_KEY` environment variable
2. Create AI service in scraper
3. Implement daily CRON job
4. Test insight generation

---

### 2. Frontend Implementation (Not Started)

**Status**: Database is ready, frontend doesn't exist yet.

**What's Ready**:

- Database schema deployed
- RLS policies configured
- Type generation command documented

**What's Missing**:

- Astro + React app initialization
- Authentication UI (login/register)
- Main dashboard (ward list)
- Hospital list view
- Search/filter functionality
- Favorites management

**Blockers**: None (database work is complete)

---

### 3. Historical Data / Analytics (Out of Scope for MVP)

**Status**: Intentionally deferred to post-MVP.

**Current Limitation**:

- `hospital_wards` uses UPSERT-only (no history)
- Cannot track bed availability trends over time
- Cannot analyze patterns (e.g., "Kardiologia is always full on Mondays")

**Why Deferred**:

- Adds significant complexity (separate history table, partitioning)
- Not required for MVP user stories
- Can be added later without breaking changes

**Future Consideration**: Add `hospital_wards_history` table with INSERT-only records

---

### 4. Scraper Retry Logic (Partial Implementation)

**Status**: Basic error handling exists, but no retry mechanism.

**Current Behavior**:

- Try-catch wraps scraping logic
- Errors logged to `scraping_logs` table
- Last successful data remains in database

**What's Missing**:

- Automatic retry on failure (e.g., 3 attempts with exponential backoff)
- Alerting when all retries fail
- Partial success handling (some wards scraped, others failed)

**Impact**: If scraper fails, users see stale data until next scheduled run (12h later)

**Next Steps**: Add retry logic with `@nestjs/schedule` or external monitoring

---

### 5. Database Backup Strategy (Not Defined)

**Status**: Relying on Supabase Cloud default backups.

**Current State**:

- Supabase free tier: Daily backups (7-day retention)
- No manual backup process defined
- No disaster recovery plan

**Risk**: Low (Supabase is reliable, data can be re-scraped)

**Future Consideration**:

- Upgrade to Supabase Pro for PITR (point-in-time recovery)
- Export critical data (user accounts, favorites) to external storage

---

### 6. Performance Testing (Not Performed)

**Status**: Schema designed for expected load, but not tested.

**Assumptions**:

- ~30-100 users (MVP)
- ~200-300 hospital records
- Scraping every 12h
- ~10-50 queries per minute

**What's Missing**:

- Load testing with realistic data volume
- Query performance benchmarks
- Index effectiveness validation

**Mitigation**: All indexes follow best practices, should be sufficient for MVP

**Next Steps**: Monitor query performance in production, add indexes if needed

---

## Schema Evolution Path

### Phase 1: MVP (Current)

- ✅ 4 tables with RLS
- ✅ Soft reference for favorites
- ✅ Trigram search index
- ✅ Helper functions for monitoring
- ⏳ AI insights (schema ready, implementation pending)
- ⏳ Frontend integration (pending)

### Phase 2: Post-MVP Enhancements (Future)

- [ ] Historical data tracking (`hospital_wards_history` table)
- [ ] Push notifications (requires `user_subscriptions` table)
- [ ] User preferences (dark mode, default filters)
- [ ] Admin dashboard (scraper control panel)
- [ ] Hospital comments/ratings (UGC feature)

### Phase 3: Scaling (Future)

- [ ] Redis cache for hot data
- [ ] Read replicas for frontend queries
- [ ] Partitioning for historical data
- [ ] Full-text search upgrade (PostgreSQL FTS or external service)

---

## Lessons Learned

### What Went Well

1. **UPSERT Pattern**: Atomic updates simplified scraper logic significantly
2. **Soft Reference Design**: Avoided complex FK cascade scenarios
3. **Trigger for Cleanup**: Automatic orphaned favorites removal works elegantly
4. **Helper Functions**: Made monitoring queries reusable and simple
5. **Separate Repos**: No regrets, deployment independence is valuable

### What Was Challenging

1. **Mixed Naming Conventions**: camelCase vs snake_case creates inconsistency, but acceptable trade-off
2. **Type Sync Manual Process**: Scraper interfaces require manual updates, but volume is low
3. **VARCHAR for Numeric Data**: Requires safe conversion logic in every query, but handles edge cases

### What Would We Do Differently

1. **Start with snake_case**: If designing from scratch, standardize on PostgreSQL convention
2. **Add Scraper Tests Earlier**: Unit tests for Puppeteer logic would catch edge cases sooner
3. **Document Type Sync in CI/CD**: Automate reminder to regenerate types after migrations

---

## Technical Debt Acknowledged

| Item                       | Severity | Mitigation                               | Timeline           |
| -------------------------- | -------- | ---------------------------------------- | ------------------ |
| Mixed camelCase/snake_case | Low      | Document clearly, no user impact         | Post-MVP refactor  |
| Manual type sync (scraper) | Low      | Low change frequency, documented process | Acceptable for MVP |
| No scraper retry logic     | Medium   | Monitor logs, manual restart if needed   | Add in v1.1        |
| No historical data         | Low      | Out of scope for MVP                     | Phase 2            |
| VARCHAR for numeric field  | Low      | Safe conversion queries documented       | Acceptable         |

---

## Migration Checklist (Completed)

- [x] Create `user_favorites` table with FK cascade
- [x] Create `ai_insights` table with TTL
- [x] Create `scraping_logs` table for KPIs
- [x] Update `hospital_wards` RLS (authenticated only)
- [x] Add trigram index for fuzzy search
- [x] Add triggers (cleanup favorites, updated_at)
- [x] Add helper functions (6 utility functions)
- [x] Document type sync process
- [x] Document deployment procedure
- [x] Document common queries

---

## Open Questions for Future Sessions

1. **Should we add hospital GPS coordinates?**
   - Would enable distance-based sorting
   - Requires geocoding service or manual data entry
   - Not in MVP scope, but common feature request

2. **Should we track user activity (last login, query history)?**
   - Would help measure engagement KPIs
   - Raises privacy concerns
   - Could inform product improvements

3. **Should we expose scraping logs to users?**
   - Could increase transparency ("Why is data stale?")
   - Might create confusion or distrust
   - Currently only accessible to authenticated users

4. **Should we add rate limiting at database level?**
   - Supabase has built-in rate limiting
   - Could add custom limits per user (e.g., 100 queries/minute)
   - Probably not needed for MVP user count

---

## References

- **PRD**: `.ai/prd.md` - Product requirements and user stories
- **Tech Stack**: `.ai/tech-stack.md` - Architecture and technology decisions
- **Database Schema**: `supabase/DATABASE_SCHEMA_SUMMARY.md` - Detailed schema documentation
- **Migrations**: `supabase/migrations/` - SQL migration files
- **Example Queries**: `supabase/migrations/EXAMPLE_QUERIES.sql` - Query patterns for developers

---

**Session Completed**: 2025-01-23  
**Next Session**: Frontend implementation planning  
**Status**: Database ready for frontend integration ✅
