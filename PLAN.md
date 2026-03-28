# Health Tracker PWA — Implementation Plan

**Domain:** health.bilaltariq.tech
**Stack:** Next.js 16 + Tailwind v4 + shadcn/ui + SQLite (Turso) + Drizzle ORM
**Hosting:** Fly.io (persistent volumes for SQLite)
**Security:** Tailscale Funnel or Fly.io internal networking
**PWA:** next-pwa with offline-first caching

---

## 1. Architecture Overview

```
┌─────────────────────────────────────────────┐
│  health.bilaltariq.tech (Fly.io)            │
│  ┌───────────────────────────────────────┐  │
│  │  Next.js 16 (App Router)              │  │
│  │  ├── /app                             │  │
│  │  │   ├── (dashboard)/                 │  │
│  │  │   ├── workouts/                    │  │
│  │  │   ├── nutrition/                   │  │
│  │  │   ├── progress/                    │  │
│  │  │   └── api/                         │  │
│  │  ├── /components (shadcn/ui)          │  │
│  │  ├── /lib                             │  │
│  │  │   ├── db/ (Drizzle + Turso)        │  │
│  │  │   └── schema/                      │  │
│  │  └── /public (PWA manifest, icons)    │  │
│  └───────────────────────────────────────┘  │
│  Turso (embedded SQLite replica)            │
└─────────────────────────────────────────────┘
```

### Why these choices

| Decision | Rationale |
|----------|-----------|
| **Next.js 16** | Matches portfolio stack. App Router for RSC + API routes in one deploy. |
| **Turso (libSQL)** | Embedded replica on Fly.io volume = zero-latency reads, cloud sync. Single-user app doesn't need Postgres. Own your data as a `.db` file. |
| **Drizzle ORM** | Type-safe, lightweight, SQLite-native. No heavy abstraction. |
| **Fly.io over Railway** | Persistent volumes for SQLite. Global edge deployment. Fly.io machines sleep when idle = cheap for single-user. |
| **Tailscale** | Fly.io machine joins your tailnet. No auth layer needed — if you can reach it, you're authenticated. DNS via Tailscale MagicDNS or CNAME from Netlify. |
| **shadcn/ui + Tailwind v4** | Composable, accessible, themeable. Easy dark/light mode. Forkable. |

---

## 2. Feature Scope

### Phase 1 — Core (MVP)
- **Workout logging**: Start session, log exercises from gym-plan.md programme, sets/reps/weight
- **Programme reference**: View the full programme (Tue/Wed/Fri) inline, tap to start
- **Timer**: Rest timer between sets (60s, 90s, 2min, 3min presets)
- **History**: View past sessions, see progression per exercise
- **PWA**: Install on phone, works offline, syncs when back online

### Phase 2 — Nutrition
- **Daily food log**: Quick-add meals with macros (protein, carbs, fat, calories)
- **Recipe link**: Optional URL to cook.bilaltariq.tech recipe for traceability
- **Favourites/recents**: Re-log frequent meals with one tap
- **Targets**: Daily macro/calorie targets with progress ring
- **Water tracking**: Simple increment counter

### Phase 3 — Insights + Enhancements
- **Body metrics**: Weight, measurements over time
- **Charts**: Weight progression per exercise, bodyweight trend, macro adherence
- **Deload reminders**: Based on 4-week cycle from programme
- **Export**: Download all data as JSON/CSV
- **Photo-to-nutrition**: Snap a meal photo, vision model (Claude API) estimates macros, pre-fills the log form for confirmation. Camera via `<input capture="environment">` (PWA-friendly). ~$0.01-0.03 per call.

---

## 3. Data Model (Drizzle Schema)

```typescript
// db/schema.ts

// Workout sessions
export const sessions = sqliteTable("sessions", {
  id: text("id").primaryKey(), // nanoid
  date: text("date").notNull(), // ISO date
  dayType: text("day_type").notNull(), // "tuesday" | "wednesday" | "friday"
  startedAt: text("started_at").notNull(),
  completedAt: text("completed_at"),
  notes: text("notes"),
});

// Individual sets within a session
export const sets = sqliteTable("sets", {
  id: text("id").primaryKey(),
  sessionId: text("session_id").notNull().references(() => sessions.id),
  exerciseName: text("exercise_name").notNull(),
  setNumber: integer("set_number").notNull(),
  reps: integer("reps"),
  weight: real("weight"), // kg
  duration: integer("duration"), // seconds (for carries, holds)
  distance: real("distance"), // metres (for carries, sled)
  rpe: integer("rpe"), // 1-10
  completedAt: text("completed_at"),
});

// Nutrition entries
export const meals = sqliteTable("meals", {
  id: text("id").primaryKey(),
  date: text("date").notNull(),
  name: text("name").notNull(),
  mealType: text("meal_type"), // breakfast, lunch, dinner, snack
  calories: integer("calories"),
  protein: real("protein"), // grams
  carbs: real("carbs"),
  fat: real("fat"),
  recipeUrl: text("recipe_url"), // optional link to cook.bilaltariq.tech
  isFavourite: integer("is_favourite", { mode: "boolean" }).default(false),
  notes: text("notes"),
});

// Body measurements
export const measurements = sqliteTable("measurements", {
  id: text("id").primaryKey(),
  date: text("date").notNull(),
  weight: real("weight"), // kg
  notes: text("notes"),
});

// Water tracking
export const water = sqliteTable("water", {
  id: text("id").primaryKey(),
  date: text("date").notNull(),
  glasses: integer("glasses").notNull().default(0),
});
```

---

## 4. Theming — Portfolio Parity + Dark/Light

Adapt the portfolio's CSS custom properties into Tailwind v4 + shadcn theme tokens.

### Dark mode (default — matches portfolio)
```css
:root {
  --background: #12110f;
  --foreground: #f4efe6;
  --card: #1a1816;
  --card-foreground: #f4efe6;
  --primary: #c87a35;
  --primary-foreground: #12110f;
  --secondary: #23201b;
  --secondary-foreground: #c4b8a8;
  --muted: #23201b;
  --muted-foreground: rgba(244, 239, 230, 0.64);
  --accent: #e8932a;
  --accent-foreground: #12110f;
  --border: rgba(233, 226, 214, 0.1);
  --ring: #e8932a;
  --radius: 0.5rem;

  --font-sans: "Avenir Next", "Segoe UI", "Helvetica Neue", sans-serif;
  --font-mono: "JetBrains Mono", "SF Mono", Consolas, monospace;
}
```

### Light mode
```css
.light {
  --background: #faf8f5;
  --foreground: #1a1710;
  --card: #ffffff;
  --card-foreground: #1a1710;
  --primary: #c87a35;
  --primary-foreground: #faf8f5;
  --secondary: #f0ebe3;
  --secondary-foreground: #3d3629;
  --muted: #f0ebe3;
  --muted-foreground: rgba(26, 23, 16, 0.64);
  --accent: #e8932a;
  --accent-foreground: #faf8f5;
  --border: rgba(26, 23, 16, 0.12);
  --ring: #c87a35;
}
```

Theme toggle via `next-themes` — respects system preference, persists choice to localStorage.

---

## 5. DNS & Deployment

### Option A: Tailscale Funnel (recommended for single-user)
1. Fly.io machine joins Tailscale via `tailscale up` in Dockerfile
2. `tailscale funnel 443` exposes to internet (optional — only if you want public access)
3. For private-only: access via Tailscale IP / MagicDNS name
4. CNAME `health.bilaltariq.tech` → Fly.io app URL on Netlify DNS

### Option B: Fly.io native + Tailscale sidecar
1. Deploy to Fly.io with custom domain `health.bilaltariq.tech`
2. Fly.io handles TLS automatically with Let's Encrypt
3. Run Tailscale as a sidecar — app only listens on Tailscale interface
4. On Netlify DNS: add CNAME record `health` → `<app-name>.fly.dev`

**Recommended: Option B** — simpler, Fly.io handles TLS/DNS cert, Tailscale handles auth.

### Netlify DNS setup
```
health    CNAME    gym-tracker.fly.dev    TTL: 3600
```

Then on Fly.io:
```bash
fly certs create health.bilaltariq.tech
```

---

## 6. Factory AI Agent Readiness (Level 4-5)

### Pillar 1: Style & Validation
- [x] **Linter**: ESLint with flat config (`eslint.config.mjs`)
- [x] **Type checker**: TypeScript strict mode, `tsc --noEmit` in CI
- [x] **Formatter**: Prettier with `.prettierrc`
- [x] **Pre-commit hooks**: Husky + lint-staged (lint + format on commit)

### Pillar 2: Build System
- [x] **Build command documented**: In `AGENTS.md` and `package.json` scripts
- [x] **Dependencies pinned**: `pnpm-lock.yaml` committed
- [x] **VCS CLI**: `gh` CLI usage documented

### Pillar 3: Testing
- [x] **Unit tests**: Vitest for lib/utils/schema validation
- [x] **Integration tests**: Vitest + testing-library for API routes and components
- [x] **Tests runnable locally**: `pnpm test` runs everything
- [x] **Fast CI feedback**: Tests in GitHub Actions, parallelised
- [x] **Flaky test detection**: Vitest retry config + CI annotations

### Pillar 4: Documentation
- [x] **AGENTS.md**: Agent-facing instructions (build, test, deploy, architecture)
- [x] **README.md**: Human-facing setup and overview
- [x] **CLAUDE.md**: Project-specific Claude Code instructions
- [x] **Documentation freshness**: CI check that AGENTS.md matches actual scripts

### Pillar 5: Development Environment
- [x] **Devcontainer**: `.devcontainer/devcontainer.json` with Node 22 + pnpm
- [x] **Environment template**: `.env.example` with all required vars documented
- [x] **Local services**: `docker-compose.yml` for Turso local dev

### Pillar 6: Debugging & Observability
- [x] **Structured logging**: pino with JSON output
- [x] **Error tracking**: Sentry (free tier) or simple error boundary + API logging
- [x] **Health endpoint**: `/api/health` returns DB status, uptime

### Pillar 7: Security
- [x] **Branch protection**: main branch protected, require PR reviews
- [x] **Secret scanning**: GitHub secret scanning enabled
- [x] **CODEOWNERS**: `CODEOWNERS` file pointing to @bilal
- [x] **No secrets in code**: `.env.example` template, actual secrets in Fly.io secrets

### Pillar 8: Task Discovery
- [x] **Issue templates**: `.github/ISSUE_TEMPLATE/` with bug + feature templates
- [x] **Issue labels**: Automated labeling via `.github/labeler.yml`
- [x] **PR template**: `.github/PULL_REQUEST_TEMPLATE.md`

### Pillar 9: Product & Experimentation
- [x] **Analytics**: Simple event tracking (local SQLite table — own your data)
- [x] **Feature flags**: Environment-variable-based feature toggles for phased rollout

---

## 7. Repository Structure

```
gym/
├── .devcontainer/
│   └── devcontainer.json
├── .github/
│   ├── ISSUE_TEMPLATE/
│   │   ├── bug.yml
│   │   └── feature.yml
│   ├── PULL_REQUEST_TEMPLATE.md
│   ├── labeler.yml
│   └── workflows/
│       ├── ci.yml              # lint, typecheck, test, build
│       └── deploy.yml          # fly deploy on main push
├── app/
│   ├── (dashboard)/
│   │   └── page.tsx            # Today's overview
│   ├── workouts/
│   │   ├── page.tsx            # Programme view + history
│   │   ├── [id]/
│   │   │   └── page.tsx        # Session detail
│   │   └── new/
│   │       └── page.tsx        # Active workout logging
│   ├── nutrition/
│   │   ├── page.tsx            # Daily food log
│   │   └── new/
│   │       └── page.tsx        # Add meal
│   ├── progress/
│   │   └── page.tsx            # Charts + body metrics
│   ├── api/
│   │   ├── health/
│   │   │   └── route.ts
│   │   ├── sessions/
│   │   │   └── route.ts
│   │   ├── sets/
│   │   │   └── route.ts
│   │   ├── meals/
│   │   │   └── route.ts
│   │   └── measurements/
│   │       └── route.ts
│   ├── globals.css
│   ├── layout.tsx
│   └── manifest.ts             # PWA manifest
├── components/
│   ├── ui/                     # shadcn components
│   ├── workout-card.tsx
│   ├── exercise-logger.tsx
│   ├── rest-timer.tsx
│   ├── macro-ring.tsx
│   ├── theme-toggle.tsx
│   └── nav-bar.tsx             # Mobile bottom nav
├── lib/
│   ├── db/
│   │   ├── client.ts           # Turso/libSQL client
│   │   ├── schema.ts           # Drizzle schema
│   │   └── migrations/
│   ├── programme.ts            # Gym programme data (from gym-plan.md)
│   ├── validators.ts           # Zod schemas for API input
│   └── utils.ts
├── public/
│   ├── icons/                  # PWA icons (192, 512)
│   └── sw.js                   # Service worker (generated)
├── __tests__/
│   ├── lib/
│   │   ├── programme.test.ts
│   │   └── validators.test.ts
│   ├── api/
│   │   ├── sessions.test.ts
│   │   └── meals.test.ts
│   └── components/
│       ├── exercise-logger.test.tsx
│       └── rest-timer.test.tsx
├── e2e/                        # Playwright E2E tests
│   ├── workouts.spec.ts
│   ├── nutrition.spec.ts
│   ├── dashboard.spec.ts
│   └── pwa.spec.ts
├── AGENTS.md                   # Agent-facing docs
├── CLAUDE.md                   # Claude Code project instructions
├── CODEOWNERS
├── Dockerfile
├── fly.toml
├── docker-compose.yml          # Local dev (Turso)
├── renovate.json               # Automated dependency updates
├── playwright.config.ts
├── .env.example
├── .prettierrc
├── eslint.config.mjs
├── next.config.mjs
├── tsconfig.json
├── vitest.config.ts
├── package.json
├── pnpm-lock.yaml
└── gym-plan.md                 # Source programme
```

---

## 8. Implementation Phases

### Phase 0 — Scaffold (this session)
1. Init git repo, pnpm, Next.js 16
2. Tailwind v4 + shadcn/ui setup
3. Theme system (dark/light, portfolio parity)
4. AGENTS.md, CLAUDE.md, devcontainer, CI/CD
5. Drizzle + Turso local setup
6. PWA manifest + service worker
7. Basic layout: bottom nav, theme toggle

### Phase 1 — Workout Tracking
1. Programme data module (from gym-plan.md)
2. Dashboard: today's workout, quick-start
3. Active session: exercise list, set logging, rest timer
4. Session history + detail view
5. API routes + validation
6. Tests (unit + integration)

### Phase 2 — Nutrition
1. Meal logging form
2. Daily view with macro breakdown
3. Food favourites / recents
4. Macro targets + progress ring
5. Water counter

### Phase 3 — Insights + Deploy
1. Charts (exercise progression, weight trend)
2. Body metrics logging
3. Data export (JSON/CSV)
4. Fly.io deploy + Tailscale setup
5. DNS configuration
6. Deload cycle reminders

---

## 9. Key Dependencies

```json
{
  "dependencies": {
    "next": "^16.2.1",
    "react": "^19.2.4",
    "react-dom": "^19.2.4",
    "@libsql/client": "^0.14.0",
    "drizzle-orm": "^0.39.0",
    "zod": "^3.24.0",
    "nanoid": "^5.1.0",
    "next-themes": "^0.4.4",
    "pino": "^9.6.0",
    "recharts": "^2.15.0"
  },
  "devDependencies": {
    "typescript": "^6.0.2",
    "@types/react": "^19.2.14",
    "@types/react-dom": "^19.2.3",
    "tailwindcss": "^4.1.0",
    "@tailwindcss/postcss": "^4.1.0",
    "drizzle-kit": "^0.30.0",
    "vitest": "^3.1.0",
    "@testing-library/react": "^16.3.0",
    "@testing-library/jest-dom": "^6.6.0",
    "eslint": "^9.21.0",
    "eslint-config-next": "^16.2.1",
    "prettier": "^3.5.0",
    "husky": "^9.1.0",
    "lint-staged": "^15.4.0",
    "@serwist/next": "^9.0.0"
  }
}
```

---

## 10. Mobile-First UI Approach

- **Bottom navigation bar**: Dashboard, Workouts, Nutrition, Progress (4 tabs)
- **Large tap targets**: 48px minimum, comfortable for gym use with sweaty hands
- **Active workout**: Full-screen mode, big numbers, minimal chrome
- **Rest timer**: Prominent countdown, haptic feedback on completion
- **Desktop**: Same layout scales up, sidebar nav replaces bottom bar at `md:` breakpoint
- **Offline**: Service worker caches app shell + recent data, queues mutations for sync

---

## Decisions (Resolved)

1. **Turso (cloud sync)** — multi-device sync between phone and laptop. Embedded replica on Fly.io for zero-latency reads, Turso cloud for backup and sync.

2. **Tailscale + PIN** — Tailscale as primary auth (tailnet-only access). Simple PIN/passphrase overlay as a second layer for peace of mind.

3. **Nutrition = macro/calorie tracking only** — this app tracks what you eat (macros, calories, daily targets). Recipes live at [cook.bilaltariq.tech](https://cook.bilaltariq.tech) (Rust SSG, separate repo). Nutrition entries can optionally link to a cook recipe URL. No food database or barcode scanning — keep it manual and lightweight.

4. **Fly.io region: `lhr`** (London) confirmed.

---

## 11. Agent Readiness Enhancements (Level 4-5 Gaps)

The following items were identified as missing from the core plan and are required to reach Level 4-5 readiness.

### E2E Testing (Playwright)

Unit and integration tests via Vitest cover logic, but end-to-end tests are needed for CI confidence and the "Optimised" level. Playwright runs headless against the full Next.js app.

```
e2e/
├── workouts.spec.ts        # Log a session end-to-end
├── nutrition.spec.ts       # Add a meal, verify daily totals
├── dashboard.spec.ts       # Verify today's view renders correctly
└── pwa.spec.ts             # Install prompt, offline fallback
```

Add to `package.json`:
```json
{
  "devDependencies": {
    "@playwright/test": "^1.50.0"
  },
  "scripts": {
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui"
  }
}
```

Add to CI (`ci.yml`) as a separate job that runs after build:
```yaml
e2e:
  needs: build
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    - uses: pnpm/action-setup@v4
    - run: pnpm install
    - run: pnpm exec playwright install --with-deps chromium
    - run: pnpm build
    - run: pnpm test:e2e
```

### Automated Dependency Updates (Renovate)

For Level 5 ("self-improving systems"), dependencies should update themselves. Add a `renovate.json` at the repo root:

```json
{
  "$schema": "https://docs.renovatebot.com/renovate-schema.json",
  "extends": ["config:recommended"],
  "schedule": ["every weekend"],
  "automerge": true,
  "automergeType": "pr",
  "packageRules": [
    {
      "matchUpdateTypes": ["patch", "minor"],
      "automerge": true
    },
    {
      "matchUpdateTypes": ["major"],
      "automerge": false
    }
  ]
}
```

Enable the Renovate GitHub App on the repo. Patch and minor updates auto-merge if CI passes. Major updates require manual review.

### Bundle Size Monitoring

Track bundle size in CI to prevent regressions — aligns with the "Optimised" level's fast feedback loops.

Add to `package.json`:
```json
{
  "scripts": {
    "analyze": "ANALYZE=true next build"
  },
  "devDependencies": {
    "@next/bundle-analyzer": "^16.2.1"
  }
}
```

Add a CI step that reports bundle size on PRs:
```yaml
bundle-size:
  needs: build
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    - uses: pnpm/action-setup@v4
    - run: pnpm install
    - run: pnpm build
    - uses: preactjs/compressed-size-action@v2
      with:
        pattern: ".next/static/**/*.js"
```

This comments on PRs with size deltas so regressions are caught before merge.
