# MILESTONE_01.md — Foundation

**Status:** Code complete, verified locally. **Deploy gate is yours** (Rule 2).
Self-contained: this brief + the code is all you need. No other docs required.

---

## Setup, in order

### Step 1 — Get the code running
```bash
cd persona-os
pnpm install
```

### Step 2 — Create the database (Neon)
1. Go to **neon.tech** → sign up → **Create project**, name it `persona-os`.
2. Copy the **pooled connection string** (it looks like `postgresql://…@ep-xxx.aws.neon.tech/…?sslmode=require`).

### Step 3 — Create the Google OAuth client
1. **console.cloud.google.com** → create a project (`persona-os`).
2. **APIs & Services → OAuth consent screen** → User type **External** → fill app name + your email → Save.
3. **APIs & Services → Credentials → Create credentials → OAuth client ID** → type **Web application**.
4. Add **Authorized redirect URIs** — you need both:
   - `http://localhost:3000/api/auth/callback/google`
   - `https://YOUR-DOMAIN.vercel.app/api/auth/callback/google` *(add after Step 6)*
5. Copy the **Client ID** and **Client secret**.

### Step 4 — Fill in the environment
```bash
cp .env.example .env.local
npx auth secret        # generates AUTH_SECRET
```
Fill `DATABASE_URL`, `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`, and set
`OWNER_EMAIL` to the Google account that owns the Studio.

**Delete the Cloudinary and Upstash lines entirely.** They aren't used until
M3. An *empty* value (`UPSTASH_REDIS_REST_URL=""`) is worse than an absent one:
Node sets the key to `""`, so Zod's `.optional()` never fires and `.url()`
rejects the empty string. Absent keys pass cleanly. Same rule applies to the
Vercel environment variables in Step 6 — set exactly five, no blanks.

### Step 5 — Create the tables and run it
```bash
pnpm db:migrate        # creates 5 tables in Neon
pnpm dev               # http://localhost:3000
```
Check: `/` shows the home shell. `/studio` bounces you to `/studio/sign-in`.
Sign in with your owner Google account → you land on the Workbench. Sign in
with **any other** Google account → access denied.

### Step 6 — Deploy (Rule 2: every milestone must deploy)
1. `git init && git add . && git commit -m "M1: foundation"`
2. Create the **persona-os** repo on GitHub, push to it.
3. **vercel.com** → New Project → import the repo.
4. Paste every variable from `.env.local` into **Settings → Environment Variables**.
5. Deploy. Then go back to **Step 3.4** and add your real `https://…vercel.app` callback URL.

---

## What was built

| Piece | Where |
|---|---|
| Next.js 15 App Router, TS strict, Tailwind v4 | `app/`, `tsconfig.json` |
| Design tokens (§9: quiet, typographic, restrained) | `app/globals.css` |
| Auth.js + Google OAuth, owner allowlist | `lib/auth/`, `middleware.ts` |
| Drizzle + Neon, migration SQL | `lib/db/`, `db/0000_*.sql` |
| Stub `entities` table (D12/D14) | `lib/db/schema.ts` |
| Cloudinary + Upstash plumbing | `lib/cloudinary/`, `lib/redis/` |
| shadcn/ui configured + `Button` | `components.json`, `components/ui/` |
| Fail-fast env validation (Zod) | `lib/env.ts` |

**Auth design:** two locks. `middleware.ts` gates `/studio` at the edge using an
adapter-free, edge-safe config; `app/studio/(workbench)/layout.tsx` re-checks the
session server-side before rendering. The `signIn` callback rejects any email that
isn't `OWNER_EMAIL` *and* verified — so a stranger never gets a session at all.

---

## Verification (what I actually ran)

- ✅ `tsc --noEmit` — passes, strict, zero `any`.
- ✅ `next build` — compiles; `/` static, `/studio` dynamic, middleware 85 kB.
- ✅ `drizzle-kit generate` → 5 tables.
- ✅ `drizzle-kit migrate` **against a real PostgreSQL 16** — applied successfully.
- ✅ Verified `entity` defaults (`status='draft'`, `metadata='{}'`) and that the
  unique slug index **rejects duplicate slugs**.
- ✅ **Live on Vercel.** Google OAuth completes, the Workbench renders, the Neon
  session survives a serverless round-trip, and the session survives a refresh
  (confirms `AUTH_SECRET` is set in production).
- ⬜ **Non-owner rejection, verified in incognito.** Until a *second* Google
  account is refused at `/studio`, the allowlist is unproven. The owner getting
  in proves nothing about anyone else being kept out.

---

## Self-review (Rule 10)

**Bug caught during the build.** My first structure put the auth check in
`app/studio/layout.tsx`, which would have wrapped the sign-in page too:
unauthenticated visitor → redirect to sign-in → layout redirects to sign-in →
infinite loop. Fixed with a `(workbench)` route group so the gate wraps the
Workbench but not sign-in.

**Two bugs my verification missed — found only when a human ran the steps.**
Both are corrected above, and both are the same failure of method: I exported
env vars directly into my shell rather than creating a real `.env.local`, so
neither path was ever exercised.

1. **`drizzle.config.ts` never loaded `.env.local`.** `drizzle-kit` runs as a
   standalone Node script, outside Next.js, and Node does not auto-load that
   file — Next.js does. `pnpm db:migrate` failed with `url: undefined` while
   `pnpm dev` worked fine. Fix: `pnpm add -D dotenv`, then
   `config({ path: ".env.local" })` before `defineConfig`.
2. **Empty optional env vars crashed the app.** `.env.example` shipped
   `UPSTASH_REDIS_REST_URL=""`. Copied to `.env.local`, that key *exists* with
   an empty value, so `.optional()` is bypassed and `.url()` throws. My
   self-review claimed "the code tolerates them being blank." It did not.
   Fix: `.or(z.literal(""))` on each optional in `lib/env.ts`, and delete the
   unused lines from `.env.local` and Vercel.

**Lesson for M2:** verify against a real `.env.local`, not an exported shell
environment. A green build in a sandbox is not a green build.

**Two deviations from the original plan, both deliberate:**
1. Added `pg` as a dev dependency. `drizzle-kit` auto-detected the Neon serverless
   driver and tried to migrate over HTTPS, which fails. Migrations now run over the
   standard Postgres protocol (works against Neon too); the app runtime still uses
   `neon-http`.
2. Added `pnpm-workspace.yaml` with `onlyBuiltDependencies` — pnpm 11 refuses to
   run until native build scripts (`sharp`, `esbuild`) are explicitly approved.

**Against the Ten Rules:** Architecture unchanged (R1). Deploy gate is honest, not
faked (R2). Stopping here (R3). No `any`, no cleverness (R4). One `Button`, no
duplicated UI (R5). Entity table is the spine (R6). Studio is the only write
surface (R7). No metrics anywhere (R9).

---

## What I'd improve next

- **The typeface is a placeholder.** `--font-display` currently points at the system
  stack. The design system says typography-first, and picking the actual face is a
  taste call — **yours, not mine.** Worth deciding before M5, when Experiences make
  type visible.
- **No tests yet.** `12_TESTING` promises unit/E2E/a11y. The natural first test is the
  auth gate: "a non-owner cannot reach `/studio`." Cheap now, expensive to retrofit.
- **`updatedAt` doesn't auto-update.** Needs `$onUpdate` or a trigger before the
  editor writes to it (M3).
- **No ESLint config shipped.** `pnpm lint` will prompt on first run. Worth pinning.
- **The public nav is decorative** — it lists three Experiences and links to none.
  It should either link or not exist. It exists so the shell reads as real; kill it
  if that bothers you.

**Recommended next:** Milestone 2 — Studio Shell.
**I am stopping here and waiting for your approval** (Rule 3).
