# AGENTS.md

Agent-facing instructions for the health tracker project.

## Stack

- **Framework**: Next.js 16 (App Router, Turbopack)
- **Language**: TypeScript (strict)
- **Styling**: Tailwind v4 (CSS-first, no tailwind.config.js)
- **Database**: Drizzle ORM + libSQL (Turso in prod, `file:local.db` in dev)
- **Package manager**: pnpm

## Commands

```bash
pnpm dev          # Start dev server (localhost:3000)
pnpm build        # Production build
pnpm typecheck    # tsc --noEmit
pnpm lint         # ESLint
pnpm format       # Prettier write
pnpm db:generate  # Generate Drizzle migrations from schema changes
pnpm db:migrate   # Apply migrations to local.db
pnpm db:studio    # Drizzle Studio (DB browser)
```

## Architecture

### Config files (edit, don't build UI for)
- `lib/programme.ts` — training programme, exercises, movement metadata. Bump `PROGRAMME_VERSION` on any change.
- `lib/config.ts` — units (kg/lbs), locale, bodyweight, progression steps, rest timer presets.

### Key design decisions
- Exercise IDs are stable slugs (e.g. `trap-bar-deadlift`). Never rename an ID — create a new one and retire the old.
- `movementPattern` and `muscleGroupPrimary` are denormalised onto every logged set at write time. This keeps progress charts coherent when the programme changes.
- `programmeVersion` is stored on every session row for the same reason.
- No settings UI — preferences live in `lib/config.ts`.

### Routing
- `/` — Dashboard (today's session, week overview)
- `/workouts` — Programme view + session history
- `/workouts/active?day=tuesday|wednesday|friday` — Active session logger (full-screen, hides nav)
- `/nutrition` — Meal log (Phase 2)
- `/progress` — Charts (Phase 3)

### Theming
- Dark mode is default. Light mode via `.light` class on `<html>`.
- All colours use CSS custom properties from `app/globals.css`. Never hardcode hex values in components.
- Theme tokens bridge to Tailwind v4 via `@theme inline` in globals.css.

### UX constraints
- Minimum 48px tap targets on all interactive elements (gym use with sweaty hands).
- Input font-size ≥ 16px to prevent iOS zoom on focus.
- Active session is full-screen (`position: fixed, inset: 0`) — no nav bar.
- Rest timer auto-starts after logging a set; plays 3 beeps + vibration on completion.

## Database

Schema: `lib/db/schema.ts`
Client: `lib/db/client.ts`

Local dev uses `file:local.db` (gitignored). Run `pnpm db:migrate` after schema changes.

## Environment variables

See `.env.example`. In local dev, `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN` are optional — falls back to local SQLite file.
