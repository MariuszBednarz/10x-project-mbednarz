# HosLU - Supabase Database Documentation

This directory contains complete database schema, migrations, and documentation for the HosLU MVP project.

## 📁 Directory Structure

```
supabase/
├── README.md                           # This file - navigation guide
├── db-plan.md                          # Complete database schema & technical details
├── session-notes.md                    # Planning session decisions & rationale
└── migrations/                         # Migration SQL files
    ├── EXAMPLE_QUERIES.sql             # Common SQL queries for development
    │
    ├── 20250123000001_create_user_favorites.sql
    ├── 20250123000002_create_ai_insights.sql
    ├── 20250123000003_create_scraping_logs.sql
    ├── 20250123000004_update_hospital_wards_rls.sql
    ├── 20250123000005_add_search_indexes.sql
    ├── 20250123000006_add_triggers.sql
    └── 20250123000007_add_helper_functions.sql
```

## 🚀 Quick Start

### For First-Time Setup

1. **Read schema**: [db-plan.md](./db-plan.md) - Complete schema with tables, indexes, RLS, triggers
2. **Deploy migrations**: See deployment section in [db-plan.md](./db-plan.md#deployment-procedures)
3. **Generate types**: See type sync section in [db-plan.md](./db-plan.md#type-synchronization)
4. **Verify deployment**: Use verification queries in [db-plan.md](./db-plan.md#common-queries)

### For Understanding Architecture Decisions

1. **Planning decisions**: [session-notes.md](./session-notes.md) - Why we chose UPSERT, soft references, etc.
2. **Technical trade-offs**: See "Key Decisions" section in session-notes.md
3. **Unresolved issues**: See "Unresolved Issues" section for future work

### For Development

1. **Schema reference**: [db-plan.md](./db-plan.md) - Tables, columns, types, constraints
2. **Example queries**: [migrations/EXAMPLE_QUERIES.sql](./migrations/EXAMPLE_QUERIES.sql)
3. **Helper functions**: See "Helper Functions" section in db-plan.md

## 📚 Documentation Index

### Core Documentation

| Document                                                           | Purpose                                                                                                  | Audience           |
| ------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------- | ------------------ |
| [db-plan.md](./db-plan.md)                                         | Complete database schema reference: tables, indexes, RLS policies, triggers, functions, deployment guide | All developers     |
| [session-notes.md](./session-notes.md)                             | Planning session summary: architectural decisions, trade-offs, rationale, unresolved issues              | All developers, PM |
| [migrations/EXAMPLE_QUERIES.sql](./migrations/EXAMPLE_QUERIES.sql) | Common SQL queries for development and debugging                                                         | All developers     |

## 🗄️ Schema Overview

### Tables (4)

1. **`hospital_wards`** ✅ Exists (created by scraper)
   - Hospital bed availability data (scraped every 12h)
   - Access: Authenticated users (read-only)

2. **`user_favorites`** 🆕 New
   - User's favorite hospital wards
   - Access: User-specific (RLS)

3. **`ai_insights`** 🆕 New
   - Cached AI-generated insights (24h TTL)
   - Access: Authenticated users (read-only)

4. **`scraping_logs`** 🆕 New
   - Audit log for scraping operations
   - Access: Authenticated users (read-only)

### Helper Functions (8)

- `is_data_stale()` - Check if data older than 12 hours
- `get_last_scrape_time()` - Get latest scraping timestamp
- `count_unique_wards()` - Count unique ward names
- `count_unique_hospitals()` - Count unique hospital names
- `calculate_scraping_success_rate(days)` - Calculate success rate %
- `get_total_places_by_ward(ward_name)` - Total available places by ward
- `get_system_status()` - Aggregated system health metrics (JSON)
- `get_unique_districts()` - List of unique districts for filters

### Triggers (3)

- `trigger_cleanup_orphaned_favorites` - Auto-cleanup favorites for deleted wards
- `trigger_ai_insights_updated_at` - Auto-update timestamp
- `update_hospital_wards_updated_at` - Auto-update timestamp

## 🔐 Security

- **RLS enabled** on all tables
- **Authenticated-only access** (no anonymous users)
- **User isolation** (can't access other users' data)
- **Service Role Key** for scraper (bypasses RLS)
- **CASCADE DELETE** for GDPR compliance

## 🔧 Common Tasks

### Deploy Schema

```bash
# Using Supabase CLI
supabase link --project-ref YOUR_REF
supabase db push

# Verify
supabase migration list
```

### Generate TypeScript Types

```bash
# Frontend
npx supabase gen types typescript --project-id YOUR_ID > src/types/database.types.ts

# Scraper - manual update
# Edit: scrap-app-be/src/scraper/interfaces/database.types.ts
```

### Verify Deployment

```sql
-- Check all tables exist
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public' ORDER BY table_name;

-- Check RLS enabled
SELECT tablename, rowsecurity FROM pg_tables
WHERE schemaname = 'public';

-- Check functions exist
SELECT routine_name FROM information_schema.routines
WHERE routine_schema = 'public' ORDER BY routine_name;
```

### Monitor Health

```sql
-- Overall system health
SELECT
    is_data_stale() as data_stale,
    get_last_scrape_time() as last_scrape,
    count_unique_wards() as wards,
    count_unique_hospitals() as hospitals,
    calculate_scraping_success_rate(30) as success_rate_30d;
```

## 🐛 Troubleshooting

### pg_trgm extension not available

- Extension should be available by default in Supabase
- Contact Supabase support if missing

### RLS blocks scraper operations

- Verify scraper uses **Service Role Key** (not Anon Key)
- Service Role Key bypasses RLS

### Triggers not firing

- Check trigger status: `SELECT tgname, tgenabled FROM pg_trigger`
- Enable if disabled: `ALTER TABLE table_name ENABLE TRIGGER trigger_name`

### Type generation fails

- Verify Supabase CLI installed: `supabase --version`
- Link to project: `supabase link --project-ref YOUR_REF`

## 📊 Database Metrics

### Expected Data Volume (MVP)

- `hospital_wards`: ~500-1000 records
- `user_favorites`: <10,000 records
- `ai_insights`: <100 records (historical)
- `scraping_logs`: ~1460 records/year (2x daily for 2 years)

### Performance Targets

- Search query latency: <100ms (with trigram index)
- Favorites query latency: <50ms (with user_id index)
- Scraping UPSERT: <5s for 1000 records
- RLS policy overhead: <10ms

## 🔄 Migration History

| Date       | Version | Changes                                    |
| ---------- | ------- | ------------------------------------------ |
| 2025-01-23 | 1.0     | Initial MVP schema (4 tables, 8 functions) |

## 📝 Next Steps After Deployment

1. ✅ Deploy frontend application to Render.com
2. ✅ Implement authentication flow (Supabase Auth)
3. ✅ Test end-to-end user flows
4. ✅ Implement AI insights generation (Claude API)
5. ✅ Monitor scraping logs for success rate KPI (>95%)

## 🤝 Contributing

This is an MVP project. For schema changes:

1. Create new migration file with timestamp
2. Update documentation (db-plan.md, session-notes.md if decisions changed)
3. Test locally before pushing to production
4. Update TypeScript types after deployment

## 📖 External Resources

- [Supabase Documentation](https://supabase.com/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Supabase CLI Reference](https://supabase.com/docs/guides/cli)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)

## ⚠️ Important Notes

1. **Service Role Key Security**: Never expose Service Role Key in frontend code. Only use in backend (scraper).
2. **Data Freshness**: Always use `scrapedAt` timestamp, NOT `lastUpdated` (unreliable from source).
3. **Soft References**: `user_favorites.ward_name` is intentionally NOT a foreign key (cleanup via trigger).
4. **Type Sync**: Regenerate frontend types after every schema change.
5. **Testing**: Always test migrations in development before production.

---

**Version**: 1.0 (MVP)  
**Status**: ✅ Ready for Deployment  
**Last Updated**: 2025-01-23  
**Maintained by**: HosLU Development Team
