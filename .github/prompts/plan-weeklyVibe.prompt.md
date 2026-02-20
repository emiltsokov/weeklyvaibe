# Plan: Weekly Vaibe - Smart Training Tracker

**TL;DR**: Build a single-user training dashboard that connects to Strava via OAuth2, displays weekly activity summaries with week-over-week comparison, and shows key metrics (distance, duration, elevation, suffer score). MVP focuses on core dashboard functionality using React + Chakra UI + TanStack Query frontend, Node.js/Express backend, and MongoDB for data persistence. Uses Biome for linting/formatting. Deployed via Docker (self-hosted).

---

## Phase 1: MVP (Dashboard + Weekly Reports)

### Steps

1. **Project scaffolding**
   - Initialize monorepo with `client/` (React + Vite) and `server/` (Node.js + Express)
   - Configure **Biome** for linting and formatting (replaces ESLint + Prettier)
     - Single `biome.json` at root with shared config
     - Enable format-on-save in editor
   - Add TypeScript for both client and server
   - Create `docker-compose.yml` with services: `client`, `server`, `mongodb`
   - Add `.env.example` with: `STRAVA_CLIENT_ID`, `STRAVA_CLIENT_SECRET`, `MONGODB_URI`, `SESSION_SECRET`

2. **Strava OAuth2 integration** (`server/src/auth/`)
   - Create `stravaAuth.ts` - routes for `/auth/strava` (redirect) and `/auth/callback` (token exchange)
   - Required scopes: `activity:read_all,profile:read_all`
   - Store tokens in MongoDB `athletes` collection with fields: `stravaId`, `accessToken`, `refreshToken`, `expiresAt`
   - Implement auto token refresh middleware checking `expiresAt` before API calls

3. **Strava API service** (`server/src/services/stravaService.ts`)
   - `getAthleteProfile()` - GET `/athlete`
   - `getActivities(after, before)` - GET `/athlete/activities` with pagination
   - `getActivityZones(activityId)` - GET `/activities/{id}/zones`
   - Rate limit handling with exponential backoff on 429

4. **Data aggregation service** (`server/src/services/aggregationService.ts`)
   - `getWeeklySummary(athleteId)` - aggregate last 7 days
   - `getWeekOverWeekComparison(athleteId)` - calculate % change vs previous week
   - Cache in `weeklySummaries` MongoDB collection

5. **MongoDB schemas** (`server/src/models/`)
   - `Athlete`: `{ stravaId, accessToken, refreshToken, expiresAt, profile, hrZones, createdAt }`
   - `Activity`: `{ stravaActivityId, athleteId, type, distance, movingTime, elevation, sufferScore, avgHR, maxHR, date }`
   - `WeeklySummary`: `{ athleteId, weekStart, totalDistance, totalDuration, totalElevation, avgSufferScore, calculatedAt }`

6. **REST API endpoints** (`server/src/routes/api.ts`)
   - `GET /api/dashboard` - current week summary + comparison
   - `GET /api/activities?limit=20` - recent activities
   - `POST /api/sync` - manual data sync trigger

7. **Frontend: TanStack Query setup** (`client/src/lib/api.ts`)
   - Configure `QueryClient` with sensible defaults (staleTime: 5min, retry: 2)
   - Create typed API hooks:
     - `useDashboard()` - fetches `/api/dashboard`, auto-refetch on window focus
     - `useActivities(limit)` - fetches `/api/activities` with pagination
     - `useSyncMutation()` - POST to `/api/sync` with loading/success states
   - Centralized error handling via `QueryClient.setDefaultOptions`

8. **Frontend: Authentication flow** (`client/src/pages/Login.tsx`)
   - "Connect with Strava" button
   - Handle callback, store auth state
   - Protected route wrapper using TanStack Query's `useQuery` for auth check

9. **Frontend: Dashboard** (`client/src/pages/Dashboard.tsx`)
   - Use `useDashboard()` hook for data fetching with loading/error states
   - Chakra UI grid layout with `<StatGroup>` for metrics
   - **Weekly Summary Card**: distance, duration, elevation, suffer score
   - **Week-over-Week Card**: % change with colored indicators
   - **Recent Activities List**: uses `useActivities()` with `<Skeleton>` loading states

10. **Docker configuration**
    - `Dockerfile` for server (Node 20 Alpine)
    - `Dockerfile` for client (multi-stage build + nginx)
    - `docker-compose.yml` with MongoDB, server, client

11. **Initial data sync flow**
    - On first login, fetch last 90 days of activities via pagination
    - Store in MongoDB `activities` collection
    - Run aggregation to populate `weeklySummaries`

---

## Phase 2: Recovery Status & TSS

### Steps

1. **TSS calculation service** (`server/src/services/stressService.ts`)
   - Implement hrTSS formula: `(duration × HRavg × IF) / (LTHR × 3600) × 100`
   - Estimate LTHR as 85% of max HR if not configured
   - Store calculated TSS on activity sync in `Activity.calculatedTSS`

2. **Recovery algorithm** (`server/src/services/recoveryService.ts`)
   - Analyze last activity's HR zone distribution via `/activities/{id}/zones`
   - If >50% time in Zone 4/5 → status = "Need Sleep" (red)
   - If >30% time in Zone 4/5 → status = "Light Activity Only" (yellow)
   - Otherwise → status = "Ready to Train" (green)
   - Calculate suggested rest hours based on TSS (e.g., TSS > 150 = 48hr rest)

3. **Dashboard: Recovery widget**
   - Color-coded status indicator (Chakra `<Badge>` with dynamic colorScheme)
   - "Last activity intensity" bar chart showing zone distribution
   - Suggested rest time countdown

4. **Dashboard: Balance Score widget**
   - 7-day rolling TSS total
   - Fatigue indicator based on recent load vs 6-week average
   - Color heatmap scale: green (fresh) → yellow (moderate) → red (overloaded)

---

## Phase 3: AI Feedback Integration

### Steps

1. **OpenAI service** (`server/src/services/feedbackService.ts`)
   - Create prompt template with athlete stats: weekly load %, TSS trend, recovery status, HR trends
   - Use `gpt-4o-mini` for cost-effective responses
   - Generate personalized feedback based on scenarios:
     - Overload: weekly load > 130% of 4-week average
     - Good balance: high load + low avg HR trend
     - Need rest: 3+ consecutive high-intensity days

2. **Feedback API endpoint**
   - `GET /api/feedback` - returns AI-generated insight
   - Cache feedback for 6 hours to avoid excessive API calls

3. **Dashboard: AI Coach widget**
   - Display daily personalized message
   - "Refresh insight" button (respects cache cooldown)

---

## Phase 4: Goal Tracker & Webhooks

### Steps

1. **Goal management** (`server/src/models/Goal.ts`)
   - Schema: `{ athleteId, type: 'duration'|'distance', target, unit, weekStart, progress }`
   - Support weekly goals: "5 hours of activity" or "50km running"

2. **Goal settings UI** (`client/src/pages/Goals.tsx`)
   - Form to set weekly targets
   - Activity type filter (all, run, ride, swim)

3. **Visual Goal Tracker widget**
   - "Thermometer" progress bar (Chakra `<Progress>` with gradient)
   - Pace indicator: "On track", "Behind schedule", "Overachieving"
   - Burnout warning if consistently exceeding 130% of goal

4. **Strava webhooks** (`server/src/webhooks/stravaWebhook.ts`)
   - `GET /webhook` - validation endpoint responding with `hub.challenge`
   - `POST /webhook` - receive activity events, respond 200 immediately
   - Background job queue (Bull + Redis) for async processing
   - On activity create: sync new activity, update goals, recalculate recovery

5. **Docker: Add Redis service** for webhook job queue

---

## Phase 5: Multi-user & Production Hardening

### Steps

1. Add user authentication layer (sessions or JWT)
2. Data isolation middleware ensuring users only access their data
3. Strava app review submission for multi-athlete support
4. Rate limit tracking per user
5. Error monitoring (Sentry)
6. Automated backups for MongoDB

---

## Verification

- **MVP**: Login with Strava → Dashboard shows weekly stats → Week-over-week comparison displays correctly → Activities list loads
- **Phase 2**: Recovery status changes based on last activity intensity → TSS calculates correctly
- **Phase 3**: AI feedback generates relevant insights based on training state
- **Phase 4**: Create activity in Strava → Webhook fires → Goal progress updates in <30s
- **Docker**: `docker-compose up` starts all services → App accessible at `localhost:3000`

---

## Decisions

- **Biome**: Single tool for linting + formatting, faster than ESLint + Prettier combo, simpler config
- **TanStack Query**: Handles caching, background refetching, loading/error states, deduplication - eliminates manual `useEffect` data fetching
- **Chakra UI**: Accessible components, good DX
- **Docker self-hosted**: Full deployment control
- **Single user first**: Simplifies MVP, auth layer added in Phase 5
- **MongoDB**: Ideal for flexible activity schemas and time-series aggregations
- **Use Strava suffer_score**: Directly available, supplement with calculated TSS for deeper analysis
