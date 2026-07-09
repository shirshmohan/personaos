# CLAUDE.md — Persona OS Handbook

> The single source of truth for this project. If something conflicts with this file, this file wins — until we deliberately change it together.

---

## 1. What Persona OS Is

Persona OS is **a personal operating system that happens to have a public face.**

It is not a portfolio. It is not "a personal website." Those are the shallow versions of it. Underneath the public pages sits a private CMS (the **Studio**) where every piece of a life — work, writing, travel, practice, reading, projects — is stored as a structured **Entity**, connected to other entities through **relationships**, and surfaced through curated **Experiences**.

The public site is a *rendering* of that system. The system is the point.

The homepage should eventually read:

> **Designed, engineered, and continuously evolving — like Shirsh Mohan.**

### What that means in practice
- Content is authored once, in the Studio, and reused everywhere. **One source of truth.**
- Pages are not hand-built HTML — they are **Experiences** that query and compose Entities.
- The value is in the **connections between things**, not in isolated pages.
- There are **no likes, no view counts, no follower numbers.** Ever. Success is not measured by public metrics here.

---

## 2. The Ten Rules (Frozen)

These are the constitution. They are worth more than any amount of extra documentation. Do not violate them without an explicit, logged decision in `DECISIONS.md`.

1. **Architecture is frozen.** The stack and core patterns are settled. Don't re-litigate them mid-build.
2. **Every milestone must deploy.** If it can't ship to a live URL, the milestone isn't done.
3. **Never continue automatically.** Stop at every milestone gate and wait for explicit approval.
4. **Readable code > clever code.** Optimize for the human reading it in six months.
5. **No duplicated UI.** One component, reused. If you're copy-pasting a card, stop.
6. **Everything is an Entity.** All content flows through the entity model.
7. **Studio is the source of truth.** Content is created and edited in the Studio, nowhere else.
8. **Relationships power the site.** The Atlas graph is a first-class feature, not decoration.
9. **No public social metrics.** No likes, views, or follower counts, anywhere, at any time.
10. **Review before merge.** Nothing lands without a self-review and human sign-off.

---

## 3. How We Work Together

Claude is a **teammate**, not an autopilot. Speed comes from Claude; taste, vision, and final calls stay with the human.

### The per-milestone loop
For **every** milestone, Claude follows this loop and does not skip steps:

1. **Explain the plan** — what will be built, the key decisions, what's explicitly out of scope.
2. **Wait for approval** — full stop. No code until "go."
3. **Implement** — build only the approved scope.
4. **Self-review** — Claude critiques its own work against the Definition of Done and the Ten Rules.
5. **Report what it would improve next** — honest gaps, tech debt, and the recommended next step.

Then **stop again** and wait. Rule 3 is absolute.

### Claude's standing responsibilities
- **Say what's undecided.** Never paper over a gap with a confident guess. Mark open questions as OPEN and propose a default to confirm.
- **Protect the human's taste.** Claude won't decide whether an animation "feels right," whether a page breathes, whether a sentence sounds like Shirsh, or whether a feature belongs. Those are surfaced, not settled.
- **Keep scope disciplined.** No building ahead. No "while I was in here I also added…". If it wasn't approved, it doesn't ship.

---

## 4. Architecture & Stack (Decided)

| Layer | Choice |
|---|---|
| Framework | Next.js (App Router) |
| Language | TypeScript (strict) |
| UI runtime | React (Server Components by default) |
| Styling | Tailwind CSS |
| Components | shadcn/ui |
| Auth | Auth.js — **Google OAuth only** |
| Database | PostgreSQL (Neon) |
| ORM | Drizzle ORM + drizzle-kit |
| Media | Cloudinary |
| Cache / rate-limit | Upstash Redis |
| Hosting | Vercel |

**Rendering strategy:** hybrid. Static where content is stable, dynamic where it's personalized or freshly edited, with route-level code splitting and lazy loading for heavy Experiences (Atlas, Gallery).

**Conventions (locked):** `pnpm` as package manager; server actions for mutations; Zod for input validation; `DATABASE_URL` for the Neon connection; a public route group plus a protected `/studio`.

---

## 5. Folder Structure (Proposed — confirm at M1)

Feature-based, per `10_FRONTEND_ARCHITECTURE`.

```
persona-os/
  app/
    (public)/          # public Experiences (home, career, writing, travel, …)
    studio/            # the CMS — protected
    api/               # route handlers where server actions aren't enough
  components/
    ui/                # shadcn primitives, unmodified
    shared/            # the one-and-only reusable components (cards, gallery, timeline)
  features/            # feature logic, colocated
    entities/
    atlas/
    timeline/
    collections/
    search/
    studio/
  lib/
    db/                # drizzle schema, client, migrations
    auth/              # Auth.js config
    cloudinary/
    redis/
    validation/        # zod schemas
  db/                  # generated migrations
```

Rule 5 lives here: reusable UI goes in `components/shared/` and is imported, never re-implemented.

---

## 6. The Entity Model (Core Concept)

**Everything is an Entity.** A career role, an essay, a trip, a place, a DSA problem, a book, a gallery piece — all the same underlying shape, differentiated by `type`.

### Base model (locked — stubbed at M1, expanded at M4)

**`entities`** — the spine
- `id`, `type` (discriminator), `slug` (unique), `title`, `summary`
- `body` (rich content / structured JSON)
- `status` (`draft` | `published`), `visibility`
- `occurred_at` / `start_date` / `end_date` (drives the Timeline)
- `cover_media_id`, `metadata` (JSONB for type-specific fields)
- `created_at`, `updated_at`

**`relationships`** — powers the **Atlas**
- `from_entity`, `to_entity`, `type` (e.g. `related_to`, `part_of`, `inspired_by`, `located_at`)

**`collections`** + **`collection_entities`** — curated groupings, order-aware.

**`media`** — Cloudinary references (public_id, dimensions, alt text).

**`tags`** + join table.

**Auth tables** — users / accounts / sessions / verification, via the Auth.js Drizzle adapter.

Derived, not stored: the **Timeline** is a query over entity dates; the **Atlas** is a query over `relationships`.

---

## 7. The Experiences

Public surfaces, each one a composition over Entities (per `02_INFORMATION_ARCHITECTURE`).

- **Home** — the identity surface; the tagline; entry points into everything else.
- **Career** — professional history as a timeline of `career` entities (this is where the résumé becomes content).
- **Writing** — essays / notes as `writing` entities.
- **Travel** — places and trips; ties directly into the Atlas map layer.
- **Train** — the **DSA / practice log**: problems solved, patterns, progress over time.
- **Library** — books / references / things consumed.
- **Studio Gallery** — visual and design work.
- **Connect** — contact surface (no social vanity metrics).

Cross-cutting: **Universal Search**, **Timeline**, **Atlas** (relationship graph), **Collections**.

---

## 8. The Studio (CMS)

The Studio is the private control plane and **the source of truth** (Rule 7).

- **Universal Editor** — one editor for all entity types; type-specific fields render from the entity's schema.
- **Workbench** — the authoring dashboard: drafts, recent edits, what needs attention.
- **Gallery integration** — Cloudinary uploads managed inline.
- **Timeline suggestions** — surfaces likely dates/placements as you author.
- **Atlas** — create and inspect relationships between entities.
- **Publishing workflow** — `draft → published`, explicit, reversible.

---

## 9. Design System

Inspiration: **Apple × Linear × Notion.** Keywords: *quiet confidence, typography-first, restrained motion, premium spacing* (per `05_DESIGN_SYSTEM`).

- Typography carries the design; color is restrained.
- Motion is subtle and purposeful — never decorative noise.
- Generous whitespace; let pages breathe.
- **No social metrics rendered anywhere** (Rule 9).
- Accessibility-first and performance-first are non-negotiable, not polish.

Design *taste* — the exact spacing, the specific animation curve, whether a layout feels right — is a **human decision**, surfaced by Claude, decided by Shirsh.

---

## 10. Coding Conventions

- TypeScript strict; **no `any`.**
- Server Components by default; client components only when interactivity demands it.
- Mutations via **server actions**, validated with **Zod** at the boundary.
- **No duplicated UI** — reuse from `components/shared/` (Rule 5).
- shadcn/ui primitives stay in `components/ui/` and are composed, not forked.
- Named exports; colocate feature code; small, single-purpose modules.
- Readable over clever (Rule 4). Comments explain *why*, not *what*.
- Every entity mutation goes through the entity layer — never write raw content elsewhere (Rule 6/7).

---

## 11. Milestones (summary — full detail in `ROADMAP.md`)

1. **Foundation** — scaffold, stack wired, auth, Drizzle + Neon, Cloudinary plumbing, app shell.
2. **Studio Shell** — the protected `/studio` frame, navigation, empty states.
3. **Universal Editor** — author/edit entities of any type.
4. **Entities + API** — full entity model, relationships, collections, endpoints.
5. **Experiences** — the public surfaces, composed over entities.
6. **Atlas** — the relationship graph, made visible and navigable.
7. **Timeline** — chronological view derived from entity dates.
8. **Universal Search** — search across all entities.
9. **AI layer** — *future; not scoped yet.*

Each milestone is gated (Rule 3) and must deploy (Rule 2).

---

## 12. Definition of Done & Review

A milestone is **Done** only when all of the following are true:

- ✅ It **deploys** to a live Vercel URL (Rule 2).
- ✅ `build` and `typecheck` pass clean; no `any`, no dead code.
- ✅ Matches the approved plan — no undocumented scope creep.
- ✅ No duplicated UI introduced (Rule 5).
- ✅ Accessible and performant to the standard for that surface.
- ✅ Claude has **self-reviewed** against this list and the Ten Rules.
- ✅ Human has **reviewed and approved** (Rule 10).
- ✅ Any new decisions are logged in `DECISIONS.md`.

---

## 13. Resolved Decisions

All five founding questions are settled (logged as D10–D14 in `DECISIONS.md`):

- **Auth:** **Google OAuth only** via Auth.js. An owner allowlist gates `/studio`. The public site requires no login. **No GitHub provider.**
- **"Train" Experience:** the **DSA / practice log**.
- **Entity storage:** a **single `entities` table**, `type` discriminator + JSONB `metadata`.
- **Package manager:** **`pnpm`**.
- **M1 schema:** auth tables + a stub `entities` table; expanded fully at M4.

New questions get logged in `DECISIONS.md` with a proposed default — never silently assumed.
