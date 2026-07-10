# DECISIONS.md — Persona OS

Two jobs: (1) record what's **frozen** and why, so we don't re-argue it, and (2) hold the **context map** so each milestone loads only what it needs — not all fourteen docs.

---

## Frozen Decisions

These are settled. Changing one requires a new dated entry in the log below with an explicit rationale.

| # | Decision | Why |
|---|---|---|
| D1 | Architecture & stack are frozen (see `CLAUDE.md` §4) | Stop re-litigating; ship instead |
| D2 | Everything is an Entity | One model, one editor, infinite reuse |
| D3 | Studio is the single source of truth | No content authored outside it |
| D4 | Relationships (Atlas) are a first-class feature | The connections *are* the product |
| D5 | No public social metrics — ever | This isn't measured by vanity numbers |
| D6 | Every milestone must deploy | "Works on my machine" isn't done |
| D7 | Never continue past a milestone without approval | Human stays in the loop |
| D8 | Readable code > clever code; no duplicated UI | Maintainability over cleverness |
| D9 | Review before merge | Quality gate, always |
| D10 | **Auth: Google OAuth only** (Auth.js), owner allowlist gates `/studio`; public site open. No GitHub provider. | Single owner; Google is the account Shirsh actually uses |
| D11 | **"Train" Experience = the DSA / practice log** | Confirmed |
| D12 | **Single `entities` table** with `type` discriminator + JSONB `metadata` | One model, one editor (D2); avoids per-type table sprawl |
| D13 | **`pnpm`** as package manager | Fast, disk-efficient, reversible |
| D14 | **M1 includes a minimal schema**: auth tables + stub `entities`; expanded at M4 | Proves migrations run end-to-end before building on them |
| D15 | **Display typeface: Instrument Serif** (one weight, display only, never body copy) | Typography-first per §9; a voice, not a workhorse |
| D16 | **Studio is a sidebar over entity types**, not a menu of features | Rule 6 — the entity model *is* the navigation |
| D17 | **Runs entirely on free tiers.** Vercel Hobby is non-commercial only; ads, affiliate links, or client work trigger Pro ($20/mo) | Verified July 2026; free tiers pause rather than bill, so no surprise charges |

---

## Context Map — what each milestone actually needs

So Claude never has to re-read the whole doc set. Load `CLAUDE.md` always; add only the rows below.

| Milestone | Also load |
|---|---|
| M1 Foundation | `CLAUDE.md` §4–5, `05_DESIGN_SYSTEM`, `11_DEPLOYMENT` |
| M2 Studio Shell | `07_STUDIO_SPECIFICATION`, `08_COMPONENT_LIBRARY`, `05_DESIGN_SYSTEM` |
| M3 Universal Editor | `07`, `08`, `04_DATABASE_DESIGN`, `09_API_SPECIFICATION` |
| M4 Entities + API | `04`, `09`, `02_INFORMATION_ARCHITECTURE` |
| M5 Experiences | `02`, `08`, `05`, `09` |
| M6 Atlas | `04`, `09`, `02` |
| M7 Timeline | `04`, `09`, `02` |
| M8 Search | `09`, `02` |
| M9 AI (future) | `13_ROADMAP` |

Once a milestone ships, its `MILESTONE_XX.md` build brief replaces even those — that brief is self-contained.

---

## Open Decisions (need an answer)

_None. O1–O5 resolved on 2026-07-10 → see D10–D14 above._

New questions get added here as they surface, with a proposed default.

---

## Decision Log

Append new entries here. Format: date · decision · rationale · status.

- _2026-07-04 · Consolidated 14 skeletal docs into 4 working files (README, CLAUDE, DECISIONS, ROADMAP) · one strong handbook beats many stubs; solves the context-window problem · **Adopted**._
- _2026-07-10 · Resolved O1–O5 → D10–D14: Google-only OAuth (no GitHub); Train = DSA log; single-table entities; pnpm; minimal schema in M1 · **Adopted**._
- _2026-07-10 · M1 corrections: `dotenv` added so `drizzle.config.ts` loads `.env.local`; optional env vars accept `""`; unused Cloudinary/Upstash vars omitted rather than blanked · both bugs surfaced only on a real machine, not in the sandbox · **Adopted**._
- _2026-07-10 · M1 shipped and verified in production: owner admitted, non-owner refused, session survives refresh · **Done**._
- _2026-07-10 · D15–D17 adopted. Instrument Serif chosen by Shirsh; sidebar-over-entity-types approved · **Adopted**._
- _(next entry…)_
