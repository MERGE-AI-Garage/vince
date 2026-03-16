<!-- ABOUTME: Complete environment variable and configuration reference for Vince. -->
<!-- ABOUTME: Covers all VITE_ frontend vars, Supabase edge function secrets, and optional Google Drive integration. -->

# Configuration Reference

## How Configuration Works

Vince uses two separate configuration mechanisms:

1. **Frontend (Web/Extension/Mobile):** Vite build-time environment variables prefixed with `VITE_`. Read via `import.meta.env`. Must be present at build time, not just at runtime. (✅ CONFIRMED — `src/integrations/supabase/client.ts`)

2. **Edge Functions (Server-side):** Deno runtime environment variables accessed via `Deno.env.get()`. Set as Supabase project secrets. Not exposed to the browser. (✅ CONFIRMED — multiple `supabase/functions/*/index.ts`)

3. **Gemini API Key (Frontend runtime):** Retrieved dynamically at runtime via `supabase.rpc('get_secret', { secret_name: 'GEMINI_API_KEY' })`. The key is stored as a Supabase secret, not a build-time variable. (✅ CONFIRMED — `src/components/creative-studio/BrandAgentApp.tsx:320`)

---

## Frontend Environment Variables

Set in `.env.local` (copy from `.env.example`). Required at **build time**.

---

### `VITE_SUPABASE_URL`
**Required:** Yes
**Default:** None
**Example:** `https://foolpmhiedplyftbiocb.supabase.co` (from `.env.example`)
**Used By:** `src/integrations/supabase/client.ts` — web app Supabase client
**Description:** The URL of your Supabase project. Find it in the Supabase dashboard under Settings → API.
**Troubleshooting:** Error `Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY environment variables`: The client throws this on startup if either variable is absent. Verify `.env.local` exists and contains the correct value.

---

### `VITE_SUPABASE_ANON_KEY`
**Required:** Yes
**Default:** None
**Example:** `eyJhbGci...` (redacted — use anon key from Supabase dashboard)
**Used By:** `src/integrations/supabase/client.ts` — web app Supabase client
**Description:** The public anon key for your Supabase project. Safe to expose to browsers. Find it under Settings → API → Project API keys → anon public.
**Troubleshooting:** Error `Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY environment variables`: Same as above — check `.env.local`.

---

### `VITE_GEMINI_API_KEY`
**Required:** Yes (for voice mode)
**Default:** None
**Example:** `AIza...` (redacted)
**Used By:** Frontend scripts (`scripts/backfill-media-tags.mjs`); also stored as a Supabase secret under the same name for runtime retrieval
**Description:** Google Gemini API key. The frontend retrieves this at runtime via `supabase.rpc('get_secret')` to enable voice mode. If the secret is absent from Supabase, voice mode is silently disabled with a console warning. Edge functions also read this as a Deno secret (see below).
**Troubleshooting:** Console warning `[Vince] API key unavailable, voice mode disabled`: The key is not stored as a Supabase secret. Run: `supabase secrets set GEMINI_API_KEY=YOUR_KEY`.

---

### `VITE_GOOGLE_CLIENT_ID`
**Required:** No
**Default:** `''` (empty string — feature disabled)
**Example:** `123456789-abc.apps.googleusercontent.com` (redacted)
**Used By:** `src/hooks/useGoogleDrivePicker.ts` — Google Drive document import
**Description:** Google OAuth client ID for the Drive picker. If absent, the Google Drive import feature is unavailable but the app continues to function.

---

### `VITE_GOOGLE_APP_ID`
**Required:** No
**Default:** `''` (empty string — feature disabled)
**Example:** `123456789` (redacted)
**Used By:** `src/hooks/useGoogleDrivePicker.ts` — Google Drive document import
**Description:** Google Cloud project number (not project ID). Required alongside `VITE_GOOGLE_CLIENT_ID` for Drive picker functionality.

---

## Supabase Edge Function Secrets

Set these with the Supabase CLI:

```bash
supabase secrets set SECRET_NAME=value
supabase secrets set SECRET_NAME=value --project-ref YOUR_PROJECT_REF
```

List current secrets:

```bash
supabase secrets list
```

---

### `GEMINI_API_KEY`
**Required:** Yes
**Default:** None
**Example:** `AIza...` (redacted)
**Used By:** All 17 edge functions — image generation, video generation, brand analysis, document processing
**Description:** Google Gemini API key used by Deno edge functions via `Deno.env.get('GEMINI_API_KEY')`. Also retrieved at runtime by the frontend via `supabase.rpc('get_secret')` to enable voice mode. This is the single most critical secret in the system — without it, no AI generation works.
**Troubleshooting:** Error `GEMINI_API_KEY not configured` from edge functions: The secret has not been set. Run `supabase secrets set GEMINI_API_KEY=YOUR_KEY`.

---

### `SUPABASE_URL`
**Required:** Yes (auto-provisioned)
**Default:** Auto-provisioned by Supabase
**Example:** `https://foolpmhiedplyftbiocb.supabase.co` (redacted)
**Used By:** All edge functions — creates Supabase service-role clients
**Description:** Automatically available to all Supabase edge functions as a built-in secret. Do not set manually.

---

### `SUPABASE_SERVICE_ROLE_KEY`
**Required:** Yes (auto-provisioned)
**Default:** Auto-provisioned by Supabase
**Example:** `eyJhbGci...` (redacted — never expose publicly)
**Used By:** All 17 edge functions — used to bypass RLS for writes (image storage, generation records)
**Description:** Automatically available to all Supabase edge functions. Grants full database access bypassing row-level security. Never expose this key to the browser or commit it to source control.

---

### `SUPABASE_ANON_KEY`
**Required:** Yes (auto-provisioned)
**Default:** Auto-provisioned by Supabase
**Used By:** `generate-header-image` (uses anon key for one specific storage operation)
**Description:** Automatically available to all Supabase edge functions.

---

## Storage Buckets

Two storage buckets are used. (✅ CONFIRMED — code references in `src/` and `supabase/functions/`)

| Bucket | Used By | Purpose |
|--------|---------|---------|
| `media` | Brand image analyzer, document import, brand card generation, media library | Brand reference images, uploaded documents, generated brand card images |
| `creative-studio` | Brand agent, `generate-creative-image`, web app upload | Generated creative images, uploaded reference photos |

⚠️ REQUIRES VERIFICATION: Bucket creation and public/private settings are not in the included migration files. Verify bucket configuration in the Supabase dashboard under Storage.

---

## Mobile Environment Variables

The mobile app (`mobile/`) has its own `.env` separate from root. (✅ CONFIRMED — `mobile/README.md`)

```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_GEMINI_API_KEY=
```

Set these in `mobile/.env.local` before running `npx vite build` from the `mobile/` directory.

---

## Database Roles

Three user roles are enforced via the `user_roles` table: (✅ CONFIRMED — `src/contexts/AuthContext.tsx`, `src/hooks/useUserRole.ts`)

| Role | Value | Access |
|------|-------|--------|
| Admin | `admin` | Full access: all brands, all generations, admin routes, delete any generation |
| Board Admin | `board_admin` | Can edit board content (text fields, status) |
| User | `user` | Own content only |

Role is assigned in the `user_roles` table. Default role when no row exists: `user`.

The `app_role` type and `has_role()` function are referenced in migrations. (✅ CONFIRMED — `20260315000001_allow_admin_delete_generations.sql`)
⚠️ REQUIRES VERIFICATION: The `app_role` type definition and `has_role()` function definition were not found in the included migration files — they likely exist in an earlier migration not included in this repo snapshot.
