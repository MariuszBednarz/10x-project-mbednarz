# HosLU - Stack Techniczny i Architektura

## 1. Architektura Systemu

```
┌─────────────────┐
│   FRONTEND      │  Astro 5 + React 19 (PWA)
│   Render.com    │
└────────┬────────┘
         │ HTTPS + JWT
         ↓
┌─────────────────┐
│   SUPABASE      │  PostgreSQL + Auth + REST API
│   Cloud         │  Single Source of Truth
└────────┬────────┘
         ↑
         │ Service Role Key
┌────────┴────────┐
│   SCRAPER       │  NestJS + Puppeteer + Cron
│   Render.com    │
└─────────────────┘
         │
         ↓
    External APIs:
    - lublin.uw.gov.pl
    - Anthropic Claude API
```

## 2. Stack Techniczny

### Frontend

- **Framework:** Astro 5
- **UI Library:** React 19
- **Language:** TypeScript
- **Styling:** Tailwind CSS + shadcn/ui
- **PWA:** Astro PWA plugin
- **Auth Client:** @supabase/supabase-js
- **Hosting:** Render.com Static Site

### Backend & Database

- **Platform:** Supabase (BaaS)
- **Database:** PostgreSQL
- **Authentication:** Supabase Auth (email/password + JWT)
- **API:** Supabase REST API + Row Level Security (RLS)
- **Region:** EU (closest available)

### Scraping Microservice

- **Framework:** NestJS
- **Scraping:** Puppeteer (proven on Render.com)
- **Scheduling:** @nestjs/schedule (cron jobs)
- **Client:** @supabase/supabase-js (Service Role Key)
- **Hosting:** Render.com Web Service ($7/month)

### AI Integration

- **Provider:** Anthropic Claude API
- **Client:** @anthropic-ai/sdk
- **Caching:** Supabase database (24h TTL)
- **Schedule:** Daily at 6:00 AM

## 3. Organizacja Kodu

### Repository Structure

**Separate Repositories:**

```
hoslu-frontend/
├── src/
│   ├── pages/
│   ├── components/
│   ├── lib/
│   └── types/
└── package.json

hoslu-scraper/
├── src/
│   ├── modules/
│   │   ├── scraper/
│   │   ├── data/
│   │   ├── scheduler/
│   │   ├── ai/
│   │   └── health/
│   └── main.ts
└── package.json
```

### Type Synchronization

- **Primary:** Supabase TypeScript codegen
- **Secondary:** Manual sync dla scraper DTOs
- **Command:** `npx supabase gen types typescript`

## 4. Model Danych (Supabase PostgreSQL)

### Tabele

- `auth.users` - Accounts (Supabase managed)
- `public.user_preferences` - User settings
- `public.user_favorites` - Favorite departments
- `public.departments` - Hospital departments
- `public.hospitals` - Hospital availability data
- `public.ai_insights` - Cached AI insights

### Update Strategy

- **Method:** UPSERT pattern
- **Conflict Resolution:** `(department_id, name)`
- **Benefits:** Atomic operations, preserves IDs

## 5. Data Flow & Responsibilities

### Frontend → Supabase

- **Auth:** Anon Key + JWT (user context)
- **Access:** Direct queries via Supabase client
- **Operations:** SELECT, INSERT/DELETE favorites

### Scraper → Supabase

- **Auth:** Service Role Key (bypasses RLS)
- **Operations:** UPSERT hospitals/departments
- **Schedule:** Every 12 hours (configurable)

### Scraper → External

- **lublin.uw.gov.pl:** Puppeteer scraping
- **Anthropic API:** Daily AI insights at 6 AM

## 6. Security Model

### Authentication & Authorization

- Email verification required
- JWT tokens for sessions
- Row Level Security on all tables
- Service Role Key restricted to scraper only

### Data Protection

- HTTPS enforced everywhere
- Password hashing via Supabase
- Parameterized queries (SQL injection prevention)
- CORS configured in Supabase dashboard
- Input validation (frontend + backend)

### Compliance

- RODO/GDPR compliant
- Privacy policy + cookie consent
- Account deletion functionality
- Data minimization principle
- Disclaimer: informational data only

## 7. Scheduling & Cron Jobs

### Scraping Job

- **Frequency:** Every 12 hours
- **Method:** @nestjs/schedule
- **Error Handling:** 3 retries with exponential backoff
- **Failure Mode:** Preserve last data, log errors
- **Env Variable:** `SCRAPING_CRON` (default: "0 _/12 _ \* \*")

### AI Insights Job

- **Frequency:** Daily at 6:00 AM
- **Process:** Fetch data → API call → Store in DB
- **Cache:** 24h TTL in database
- **Env Variable:** `AI_CRON` (default: "0 6 \* \* \*")

## 8. Deployment & CI/CD

### Hosting

- **Frontend:** Render.com Static Site (free)
- **Scraper:** Render.com Web Service ($7/month)
- **Database:** Supabase Cloud (free tier MVP)

### Deployment Flow

1. Push to GitHub (main branch)
2. Render.com auto-deploys
3. Health check verification
4. Monitor via Render logs

### Environment Variables

**Frontend:**

- `PUBLIC_SUPABASE_URL`
- `PUBLIC_SUPABASE_ANON_KEY`

**Scraper:**

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ANTHROPIC_API_KEY`
- `SCRAPING_CRON`
- `AI_CRON`
- `NODE_ENV`

## 9. Monitoring & Observability (MVP)

### Monitoring Stack

- **Logs:** Render.com built-in
- **Health:** `/health` endpoint on scraper
- **Uptime:** Render.com automatic
- **Database:** Supabase dashboard

### Key Metrics

- Scraping success rate
- Last successful scrape timestamp
- Hospital/department count
- AI generation success
- User registration/login counts

### Error Handling

- **Scraper:** Try-catch with detailed logging
- **Frontend:** React error boundaries
- **Database:** Transaction rollbacks
- **No Email Alerts:** MVP uses logs only

## 10. Testing Strategy (MVP Minimum)

### Scraper

- Unit tests for Puppeteer parsing logic (critical)
- Framework: Jest (NestJS built-in)
- Manual end-to-end before deploy

### Frontend

- Manual testing of critical flows
- Browser testing: Chrome, Safari mobile, Firefox
- PWA functionality verification

### Integration

- Scraper → Supabase flow
- RLS policies with test users
- AI insight generation

## 11. Cost Estimation

### Monthly Costs (MVP)

```
Frontend (Render Static):     $0
Scraper (Render Starter):     $7
Supabase (Free tier):         $0
Anthropic API:                ~$0.05
GitHub (public):              $0

TOTAL: ~$7/month
```

### Scaling (100-500 users)

- Supabase Pro: $25/month (if limits exceeded)
- Scraper upgrade: $15-25/month (optional)
- **Expected:** $10-30/month

## 12. Key Technical Decisions

### Decision Summary

1. **Data Updates:** UPSERT pattern (atomic, preserves IDs)
2. **Hosting:** Render.com (proven Puppeteer setup)
3. **Repository:** Separate repos (simpler for MVP)
4. **Type Sync:** Supabase codegen + manual DTOs
5. **Puppeteer:** Existing POC setup works on Render
6. **Error Handling:** 3 retries, logs only (no email)
7. **AI Cache:** Database table (24h TTL)
8. **Secrets:** Environment variables only
9. **Testing:** Minimum - scraper unit tests
10. **Monitoring:** Render logs only

## 13. Future Considerations (Post-MVP)

### Potential Optimizations

- Redis for AI caching (high traffic)
- Supabase Realtime for live updates
- Sentry for error tracking
- Monorepo if code sharing grows
- Custom JWT tokens (replace Service Role Key)

### Scaling Strategy

- Horizontal scraper scaling (requires coordination)
- Supabase auto-scales database
- CDN handles frontend traffic

### Out of Scope

- Push notifications
- Multiple regions
- Historical analytics
- Advanced filtering
- Dark mode
- Data export

---

**Version:** 1.0  
**Updated:** 2025-10-18  
**Status:** Implementation Ready
