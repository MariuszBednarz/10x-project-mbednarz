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
- **Styling:** Tailwind CSS 4 + shadcn/ui (domyślne komponenty)
- **Components:** Card, Badge, Select, Switch, Input, Alert, Separator, Skeleton, Toast, Sheet
- **Icons:** Lucide React
- **PWA:** Astro PWA plugin
- **Auth Client:** @supabase/supabase-js
- **Hosting:** Render.com Static Site
- **Philosophy:** Feature > Design, minimalne customizacje, reużywalne komponenty

### Backend & Database

- **Platform:** Supabase (BaaS)
- **Database:** PostgreSQL
- **Authentication:** Supabase Auth (email/password + JWT)
- **API:** Supabase REST API + Row Level Security (RLS)
- **Region:** EU (closest available)

### Scraping Microservice (ZAIMPLEMENTOWANA)

- **Framework:** NestJS 11.1.6
- **Language:** TypeScript 5.9.3
- **Scraping:** Puppeteer 24.25.0 (headless Chromium)
- **Scheduling:** @nestjs/schedule 6.0.1 (CRON: `0 */12 * * *`, timezone: Europe/Warsaw)
- **Database Client:** @supabase/supabase-js 2.76.0 (Service Role Key authentication)
- **Configuration:** @nestjs/config 4.0.2 (dotenv integration)
- **Dependencies:**
  - `@nestjs/platform-express` - HTTP server
  - `reflect-metadata`, `rxjs` - NestJS core dependencies
- **Docker Base Image:** `ghcr.io/puppeteer/puppeteer:19.7.2` (używany przez Render.com)
- **Build Tool:** @nestjs/cli 11.0.10
- **Hosting:** Render.com Web Service (Free tier, bezpośrednie połączenie z GitHub repo)
- **Port:** 4000 (configurable via `PORT` env var)

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

scrap-app-be/          # ZAIMPLEMENTOWANE
├── src/
│   ├── main.ts                           # Entry point (port 4000)
│   ├── app.module.ts                     # Root module
│   ├── health/                           # Health check
│   │   ├── health.controller.ts
│   │   └── health.module.ts
│   ├── supabase/                         # Supabase integration
│   │   ├── supabase.service.ts          # Client initialization
│   │   └── supabase.module.ts
│   └── scraper/                          # Core scraping logic
│       ├── scraper.module.ts
│       ├── scraper.service.ts           # Puppeteer scraping
│       ├── data.service.ts              # Data mapping & DB operations
│       ├── scraper-scheduler.service.ts # CRON scheduling
│       ├── interfaces/
│       │   └── hospital.interface.ts    # TypeScript interfaces
│       └── dto/
│           └── ward-data.dto.ts         # Data Transfer Objects
├── Dockerfile                            # Puppeteer image config
├── config.env                            # Environment variables
├── nest-cli.json                         # NestJS CLI config
├── tsconfig.json                         # TypeScript config
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

### Scraper → Supabase (ZAIMPLEMENTOWANE)

- **Auth:** Service Role Key (bypasses RLS)
- **Operations:**
  - UPSERT na `hospital_wards` (conflict: `wardName, hospitalName`)
  - Automatyczna deduplicja przed zapisem (Map-based)
  - Szczegółowe logi: records before/after, inserted/updated counts
- **Schedule:** Co 12 godzin (00:00, 12:00 Europe/Warsaw)
- **Data Flow:**
  1. `ScraperService.scrapeWebsite()` → Puppeteer extraction
  2. `DataService.mapScrapedDataToDto()` → TypeScript DTOs
  3. `DataService.removeDuplicates()` → In-memory deduplication
  4. `DataService.saveToSupabase()` → UPSERT operation
- **Error Handling:** Try-catch z logowaniem, zachowanie ostatnich danych przy awarii

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

### Scraping Job (ZAIMPLEMENTOWANE)

- **Frequency:** Co 12 godzin (00:00, 12:00)
- **Method:** `@nestjs/schedule` decorator `@Cron()`
- **Timezone:** Europe/Warsaw
- **Implementation:** `ScraperSchedulerService.handleScrapingCron()`
- **Process:**
  1. Log start scraping task
  2. `scraperService.scrapeWebsite()` - Puppeteer extraction
  3. `dataService.mapScrapedDataToDto()` - DTO mapping
  4. `dataService.saveToSupabase()` - UPSERT operation
  5. Log completion with record count
- **Error Handling:** Try-catch z detailed logging, zachowanie ostatnich danych
- **CRON Expression:** `"0 */12 * * *"` (currently `"0 22 * * *"` for testing)
- **Configuration:** Hardcoded w decoratorze (do zmiany na env var jeśli potrzeba)

### AI Insights Job

- **Frequency:** Daily at 6:00 AM
- **Process:** Fetch data → API call → Store in DB
- **Cache:** 24h TTL in database
- **Env Variable:** `AI_CRON` (default: "0 6 \* \* \*")

## 8. Deployment & CI/CD

### Hosting

- **Frontend:** Render.com Static Site (free) - DO ZAIMPLEMENTOWANIA
- **Scraper:** Render.com Web Service (Free tier, GitHub auto-deploy) - ZAIMPLEMENTOWANE
  - Dockerfile build (Puppeteer base image)
  - Environment variables configured in Render dashboard
  - Health check: `/health` endpoint
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

**Scraper (ZAIMPLEMENTOWANE):**

- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_KEY` - Service Role Key (bypasses RLS)
- `PAGE` - Target URL (https://szpitale.lublin.uw.gov.pl/page/...)
- `PUPPETEER_EXECUTABLE_PATH` - Chrome path for production (`/usr/bin/google-chrome-stable`)
- `NODE_ENV` - Environment (development/production)
- `PORT` - Server port (default: 4000)
- ~~`ANTHROPIC_API_KEY`~~ - DO ZAIMPLEMENTOWANIA (AI insights)
- ~~`SCRAPING_CRON`~~ - Hardcoded in decorator, not env var yet
- ~~`AI_CRON`~~ - DO ZAIMPLEMENTOWANIA

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

### Scraper (ZAIMPLEMENTOWANE - bez testów jednostkowych jeszcze)

- Unit tests dla Puppeteer parsing logic (critical) - DO ZAIMPLEMENTOWANIA
- Framework: Jest (NestJS built-in) - dostępny ale nieużywany
- Manual end-to-end przed deploymentem - WYKONANE
- **Current Status:** Aplikacja działa, brak automated tests

### Frontend

- Manual testing of critical flows
- Browser testing: Chrome, Safari mobile, Firefox
- PWA functionality verification

### Integration

- Scraper → Supabase flow - ZAIMPLEMENTOWANE i DZIAŁA
  - UPSERT operation z conflict resolution
  - Service Role Key authentication
  - Deduplication logic
- RLS policies with test users - DO ZAIMPLEMENTOWANIA (frontend)
- AI insight generation - DO ZAIMPLEMENTOWANIA

## 11. Cost Estimation

### Monthly Costs (MVP)

```
Frontend (Render Static):     $0    (DO ZAIMPLEMENTOWANIA)
Scraper (Render Free):        $0    (ZAIMPLEMENTOWANE - free tier)
Supabase (Free tier):         $0
Anthropic API:                ~$0.05 (DO ZAIMPLEMENTOWANIA)
GitHub (public):              $0

TOTAL: ~$0/month (MVP), ~$0.05/month po dodaniu AI
```

**Uwaga:** Free tier Render.com ma ograniczenia (sleep po inaktywności, 750h/miesiąc). Możliwy upgrade do Starter ($7/month) jeśli potrzeba 24/7 uptime.

### Scaling (100-500 users)

- Supabase Pro: $25/month (if limits exceeded)
- Scraper upgrade: $15-25/month (optional)
- **Expected:** $10-30/month

## 12. Key Technical Decisions

### Decision Summary

1. **Data Updates:** UPSERT pattern (atomic, preserves IDs) - ✅ ZAIMPLEMENTOWANE
2. **Hosting:** Render.com Free tier (Puppeteer w Dockerze) - ✅ ZAIMPLEMENTOWANE
3. **Repository:** Separate repos (scrap-app-be + frontend) - ✅ ZAIMPLEMENTOWANE
4. **Type Sync:** Manual DTOs w scraperze - ✅ ZAIMPLEMENTOWANE (Supabase codegen dla frontendu)
5. **Puppeteer:** Docker image `ghcr.io/puppeteer/puppeteer:19.7.2` - ✅ ZAIMPLEMENTOWANE
6. **Error Handling:** Try-catch z detailed logging (no retries yet) - ✅ ZAIMPLEMENTOWANE
7. **AI Cache:** Database table (24h TTL) - ❌ DO ZAIMPLEMENTOWANIA
8. **Secrets:** Environment variables (config.env + Render dashboard) - ✅ ZAIMPLEMENTOWANE
9. **Testing:** Manual e2e testing only (unit tests - TODO) - ⚠️ CZĘŚCIOWO
10. **Monitoring:** Render logs + `/health` endpoint - ✅ ZAIMPLEMENTOWANE
11. **UI Components:** shadcn/ui (domyślne, minimalne customizacje) - ✅ DECYZJA
12. **Accordion:** REZYGNACJA - wszystkie dane widoczne w kartach - ✅ DECYZJA
13. **Warning Threshold:** 12h zamiast 24h/48h - ✅ DECYZJA
14. **Priority:** Feature > Design (MVP mindset) - ✅ DECYZJA

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
