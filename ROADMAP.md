# ROADMAP.md — Persona OS

Build order is **linear and gated.** Don't look ahead. Each milestone: Claude explains → you approve → Claude implements → self-reviews → reports next. Then **stop.** (See `CLAUDE.md` §3.)

Every milestone must **deploy to a live URL** to count as done.

---

## M1 — Foundation ✅ *shipped*
Scaffold the project and wire the stack end-to-end.
- Next.js (App Router) + TS strict, Tailwind, shadcn/ui, ESLint/Prettier
- Auth.js with **Google OAuth** + owner allowlist gating `/studio`
- Drizzle + Neon, migrations runnable; minimal schema (auth tables + stub `entities`)
- Cloudinary + Upstash config modules (plumbing only)
- App shell: root layout, design tokens, public route group + protected `/studio` placeholder
- **DoD:** clean build/typecheck, `dev` renders the shell, migrations run against real Postgres, `.env.example` documented, deploys to Vercel.

## M2 — Studio Shell ✅ *code complete, awaiting your deploy*
The protected CMS frame — no editing yet.
- `/studio` layout, navigation, auth gate, empty states, Workbench skeleton
- **Depends on:** M1. **DoD:** logged-in owner sees the shell live; nobody else can.

## M3 — Universal Editor
Author and edit entities of any type.
- One editor over the entity schema; type-specific fields; draft/publish; Cloudinary uploads inline
- **Depends on:** M2 + a real entity schema (expands M1 stub). **DoD:** create → edit → publish a `writing` entity, live.

## M4 — Entities + API
The full data layer.
- Complete entity model, `relationships`, `collections`, `tags`, `media`
- Endpoints / server actions for CRUD + querying
- **Depends on:** M3. **DoD:** every entity type creatable; relationships and collections persist.

## M5 — Experiences
The public surfaces, composed over entities.
- Home, Career, Writing, Travel, Train, Library, Studio Gallery, Connect
- **Depends on:** M4. **DoD:** each Experience renders real published entities; no duplicated UI.

## M6 — Atlas
Make the relationship graph visible and navigable.
- Depends on: M5. **DoD:** relationships are browsable from the public site.

## M7 — Timeline
Chronological view derived from entity dates.
- Depends on: M4+. **DoD:** a unified, filterable timeline across entity types.

## M8 — Universal Search
Search across all entities.
- Depends on: M4+. **DoD:** relevant results across types, fast.

## M9 — AI Layer *(future — not scoped)*
Deferred until the OS exists. Do not design it yet.

---

### Reminder
No milestone starts without approval. No milestone ends without a deploy and a self-review. Taste stays with Shirsh.
