# HosLU

> Real-time hospital bed availability tracker for Lublin region paramedics

HosLU is a Progressive Web App (PWA) designed for paramedics and healthcare services in the Lublin region of Poland. It aggregates real-time data about available hospital beds, solving the critical problem of accessing this information from a slow and unresponsive government website during emergency situations.

[![Node Version](https://img.shields.io/badge/node-22.14.0-brightgreen.svg)](https://nodejs.org/)
[![Astro](https://img.shields.io/badge/Astro-5.13-FF5D01.svg)](https://astro.build/)
[![React](https://img.shields.io/badge/React-19.1-61DAFB.svg)](https://react.dev/)

## Table of Contents

- [Tech Stack](#tech-stack)
- [Getting Started Locally](#getting-started-locally)
- [Available Scripts](#available-scripts)
- [Project Scope](#project-scope)
- [Project Status](#project-status)
- [License](#license)

## Tech Stack

### Frontend

- **Framework**: [Astro 5](https://astro.build/) - Modern static site builder
- **UI Library**: [React 19](https://react.dev/) - Component-based UI
- **Language**: [TypeScript 5](https://www.typescriptlang.org/) - Type-safe JavaScript
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/) - Utility-first CSS framework
- **Components**: [shadcn/ui](https://ui.shadcn.com/) - Reusable UI components
- **Icons**: [Lucide React](https://lucide.dev/) - Icon library
- **PWA**: Astro PWA plugin for offline capabilities

### Backend & Database

- **Platform**: [Supabase](https://supabase.com/) - Backend-as-a-Service
- **Database**: PostgreSQL with Row Level Security
- **Authentication**: Supabase Auth (email/password + JWT)
- **API**: Supabase REST API

### Scraping Microservice

- **Framework**: [NestJS](https://nestjs.com/) - Progressive Node.js framework
- **Scraping Engine**: [Puppeteer](https://pptr.dev/) - Headless Chrome automation
- **Scheduling**: @nestjs/schedule (CRON jobs every 12 hours)
- **Repository**: Separate backend repository ([scrap-app-be](https://github.com))

### AI Integration

- **Provider**: [Anthropic Claude API](https://www.anthropic.com/)
- **Purpose**: Daily insights about bed availability trends
- **Caching**: 24-hour database cache

### Hosting

- **Frontend**: [Render.com](https://render.com/) Static Site
- **Scraper**: Render.com Web Service (Free tier)
- **Database**: Supabase Cloud (EU region)

## Getting Started Locally

### Prerequisites

- **Node.js**: v22.14.0 (specified in `.nvmrc`)
- **npm**: Comes with Node.js
- **Supabase Account**: For database and authentication
- **Environment Variables**: See configuration below

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/yourusername/hoslu-frontend.git
   cd hoslu-frontend
   ```

2. **Install Node.js version**

   ```bash
   # Using nvm (recommended)
   nvm install
   nvm use
   ```

3. **Install dependencies**

   ```bash
   npm install
   ```

4. **Set up environment variables**

   Create a `.env` file in the root directory:

   ```env
   PUBLIC_SUPABASE_URL=your_supabase_project_url
   PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

5. **Set up Supabase**
   - Create a new Supabase project
   - Run database migrations from `supabase/migrations/` directory
   - Copy your project URL and anon key to `.env`
   - See [Database Setup Guide](./supabase/migrations/DEPLOYMENT_GUIDE.md) for details

6. **Run the development server**

   ```bash
   npm run dev
   ```

   The app will be available at `http://localhost:4321`

## Available Scripts

| Script             | Description                                  |
| ------------------ | -------------------------------------------- |
| `npm run dev`      | Start the development server with hot reload |
| `npm run build`    | Build the production-ready static site       |
| `npm run preview`  | Preview the production build locally         |
| `npm run lint`     | Run ESLint to check code quality             |
| `npm run lint:fix` | Automatically fix ESLint issues              |
| `npm run format`   | Format code with Prettier                    |

## Project Scope

### Core Features (MVP)

✅ **Implemented in Scraper Microservice:**

- Automated data scraping from government website every 12 hours
- Data aggregation and storage in Supabase
- Health check endpoint for monitoring

🚧 **To Be Implemented in Frontend:**

- User authentication (email/password with verification)
- Hospital and department browsing with real-time availability
- Color-coded bed availability badges (green >5, yellow 1-5, red ≤0)
- Favorites system (mark frequently used departments)
- Search and filtering (by department, hospital, district)
- AI-powered daily insights about bed availability trends
- Stale data warnings (when data >12 hours old)
- PWA capabilities (offline access, installable)
- Responsive mobile-first design

### Out of Scope (Post-MVP)

The following features are **not included** in the MVP:

- GPS navigation to hospitals
- Push notifications
- Other regions beyond Lublin
- Dark mode
- Data export to PDF
- Historical statistics
- Advanced filtering options
- Profile editing
- Multiple language support

### Future Considerations

Potential enhancements after MVP validation:

- Redis caching for high-traffic scenarios
- Supabase Realtime for live updates
- Sentry error tracking
- Historical analytics dashboard
- Multi-region support

## Project Status

**Current Phase**: MVP Development

| Component             | Status         | Notes                                           |
| --------------------- | -------------- | ----------------------------------------------- |
| Scraper Microservice  | ✅ Deployed    | Running on Render.com, scraping every 12 hours  |
| Database Schema       | ✅ Complete    | PostgreSQL with RLS, migrations ready to deploy |
| Frontend Application  | 🚧 In Progress | Astro + React implementation ongoing            |
| Authentication        | 📋 Planned     | Supabase Auth integration pending               |
| AI Insights           | 📋 Planned     | Claude API integration pending                  |
| PWA Features          | 📋 Planned     | Service worker and manifest to be added         |
| Production Deployment | 📋 Planned     | Render.com static site deployment               |

### MVP Success Metrics

- 30+ registered verified users
- Average 3+ favorite departments per active user
- 2x weekly login frequency over 3 months

### Architecture

```
┌─────────────────┐
│   FRONTEND      │  Astro 5 + React 19 (PWA)
│   Render.com    │
└────────┬────────┘
         │ HTTPS + JWT
         ↓
┌─────────────────┐
│   SUPABASE      │  PostgreSQL + Auth + REST API
│   Cloud         │
└────────┬────────┘
         ↑
         │ Service Role Key
┌────────┴────────┐
│   SCRAPER       │  NestJS + Puppeteer + CRON
│   Render.com    │  (Separate Repository)
└─────────────────┘
```

### Database Schema

The application uses 4 main tables in PostgreSQL (Supabase):

| Table            | Purpose                                  | Access Control     |
| ---------------- | ---------------------------------------- | ------------------ |
| `hospital_wards` | Hospital bed availability data (scraped) | Authenticated read |
| `user_favorites` | User's favorite wards                    | User-specific RLS  |
| `ai_insights`    | Cached AI-generated insights (24h TTL)   | Authenticated read |
| `scraping_logs`  | Audit log for scraping operations        | Authenticated read |

**Key Features:**

- Row Level Security (RLS) on all tables
- Trigram indexes for fuzzy search on ward names
- Automated cleanup of orphaned favorites
- Helper functions for monitoring and statistics

**Documentation:**

- [Database Setup Guide](./supabase/migrations/DEPLOYMENT_GUIDE.md)
- [Type Synchronization](./supabase/migrations/TYPE_SYNC.md)
- [Example Queries](./supabase/migrations/EXAMPLE_QUERIES.sql)
- [Migration Files](./supabase/migrations/)

## License

License information to be determined. Please contact the project maintainer for licensing details.

---

**Disclaimer**: This application provides informational data only. In case of doubt, verify information directly with the hospital. Always follow emergency protocols and use official communication channels as primary sources.

**Contributing**: This is currently a private MVP project. Contributions guidelines will be added once the project reaches stable release.

**Support**: For issues or questions, please open an issue in the GitHub repository.
