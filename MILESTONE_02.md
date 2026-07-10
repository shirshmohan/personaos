# MILESTONE_02.md — Studio Shell

**Status:** Code complete, verified locally. **Deploy gate is yours** (Rule 2).
Self-contained: this brief + the code. No other docs required.

---

## Ship it

```bash
pnpm install          # picks up dotenv, vitest
pnpm test             # 10 tests, all green
pnpm typecheck
pnpm dev              # http://localhost:3000/studio
```

Then commit, push, and let Vercel deploy. **No new environment variables.**

**On first `pnpm dev`, Next fetches Instrument Serif from Google Fonts once and
self-hosts it.** You need to be online for that first build. After that it is
cached and served from your own domain — no runtime request to Google, no
layout shift.

---

## What was built

| Piece | Where |
|---|---|
| Sidebar over the six entity types + Workbench | `components/studio/studio-sidebar.tsx` |
| Studio chrome, header, auth gate | `app/studio/(workbench)/layout.tsx` |
| Sign out (server action) | `lib/auth/actions.ts`, `components/studio/sign-out-button.tsx` |
| Workbench: drafts, recently edited, counts | `app/studio/(workbench)/page.tsx` |
| Per-type listing routes, 404 on unknown type | `app/studio/(workbench)/[type]/page.tsx` |
| Real queries against `entities` | `features/entities/queries.ts` |
| Entity labels + icons, one source of truth | `features/entities/types.ts` |
| Shared components (Rule 5) | `components/shared/` |
| Instrument Serif (D15) | `app/layout.tsx`, `app/globals.css` |
| Allowlist regression test | `tests/auth-allowlist.test.ts` |

**Design notes.** The sidebar lists *entity types*, not features (D16) — Rule 6
says the entity model is the spine, so it should be the navigation too. Empty
states state what isn't there and what to do about it; they never apologise.
Instrument Serif appears only in display slots (page titles, "Studio", the
entity counts) — never in body copy, where the system sans does the work.

**The Workbench queries the real database even though it is empty.** Slower to
build than hardcoded zeros, but it means M3's editor writes into a UI that
already reads. No throwaway scaffolding.

---

## Verification (what I actually ran)

- ✅ `vitest run` — **10/10 pass**.
- ✅ **Mutation-tested the allowlist.** Deleted the owner check from
  `lib/auth/config.ts`; 2 tests failed as they should. Restored; 10/10 green.
  A test that never fails is decoration.
- ✅ `tsc --noEmit` — clean, strict, zero `any`.
- ✅ `next build` — all 6 entity routes prerender (`/studio/career`,
  `/studio/writing`, …). Middleware intact at 85 kB.
- ✅ **Workbench queries executed against real PostgreSQL 16**, seeded with 4
  rows across 3 types. `getEntityCounts` returns integers (not strings —
  `count(*)::int` matters), `getDrafts` filters correctly, `listEntitiesByType`
  orders by `updatedAt`.
- ⚠️ **The Google Fonts fetch is unverified.** My sandbox blocks
  `fonts.googleapis.com` (403), so `next build` fails there at the font step and
  *only* the font step. I confirmed this by stubbing the font and rebuilding —
  everything else compiles. It will fetch on your machine and on Vercel. If
  `pnpm dev` fails with `Failed to fetch font`, you are offline.
- ⬜ **Not verified: the live deploy.** Yours.

**Applied the M1 method fix:** I built against a real `.env.local` this time,
not exported shell variables. That is what would have caught both M1 bugs.

---

## Self-review (Rule 10)

**Against the Ten Rules.** Architecture unchanged (R1). Deploy gate honest, not
faked (R2). Stopping here (R3). No `any`; the sidebar is the only client
component, everything else is a Server Component (R4). `EntityList`,
`EmptyState`, `PageHeader`, `EntityTypeIcon` all exist precisely so M3 cannot
duplicate them (R5). Navigation *is* the entity model (R6). Studio remains the
only write surface (R7). No metrics anywhere (R9).

**Honest gaps:**

- **`components/ui/button.tsx` is still the only shadcn primitive.** M3 will
  need `input`, `textarea`, `select`, `dialog`. Add them with
  `pnpm dlx shadcn@latest add input textarea` rather than hand-rolling.
- **`EntityList` links to `/studio/{type}/{slug}`, which 404s.** Deliberate —
  the detail route is M3. But it means clicking a row today does nothing good.
  There is nothing to click yet, so it doesn't bite.
- **Mobile sidebar stacks above the content** rather than collapsing into a
  drawer. Honest and functional; not elegant. A drawer is maybe 30 lines.
- **`updatedAt` still doesn't auto-update.** It will matter the moment the
  editor writes, because "Recently edited" sorts on it. **Fix this in M3, first
  thing**, or the Workbench will silently lie.
- **Only the allowlist is tested.** The queries have no test — I verified them
  by hand against Postgres, which doesn't protect against regression.

---

## What I'd improve next

**Recommended: Milestone 3 — Universal Editor.** It should open by fixing
`updatedAt`, then expanding `entities` with the fields the editor needs
(`body`, `occurredAt` already exists, `coverMediaId`), then one editor that
renders type-specific fields from the schema.

**I am stopping here and waiting for your approval** (Rule 3).

Before M3, one taste call worth making: when you look at the Studio with
Instrument Serif live, decide whether the display face earns its place at these
sizes. It's easier to change now than after fifty screens exist.
