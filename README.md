# Persona OS

**A personal operating system that happens to have a public face.**

Not a portfolio and not just a personal website — Persona OS stores a life (work, writing, travel, practice, reading, projects) as connected **Entities**, authored in a private **Studio**, and surfaced through public **Experiences**. The connections between things are the point.

> Designed, engineered, and continuously evolving — like Shirsh Mohan.

## Stack

Next.js (App Router) · TypeScript · Tailwind CSS · shadcn/ui · Auth.js · PostgreSQL (Neon) · Drizzle ORM · Cloudinary · Upstash Redis · Vercel

## Core ideas

- **Everything is an Entity** — one model, one editor, reused everywhere.
- **Studio is the source of truth** — content is created and edited in one place.
- **Relationships power the site** — the Atlas graph is a first-class feature.
- **No public social metrics** — no likes, views, or follower counts, anywhere.

## Getting started

```bash
pnpm install
cp .env.example .env.local   # fill in Neon, Auth.js, Cloudinary, Upstash
pnpm db:migrate
pnpm dev
```

## Documentation

- [`CLAUDE.md`](./CLAUDE.md) — the handbook and single source of truth
- [`DECISIONS.md`](./DECISIONS.md) — frozen decisions, context map, decision log
- [`ROADMAP.md`](./ROADMAP.md) — gated, milestone-by-milestone build plan

## Status

Pre-Milestone-1. Foundation next.
