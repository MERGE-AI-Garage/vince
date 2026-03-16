# Security & Compliance

> Generated: 2026-03-15
> Source: `src/contexts/AuthContext.tsx`, `src/App.tsx`, `supabase/migrations/`,
> `supabase/functions/*/index.ts`, `extension/manifest.json`

---

## Authentication

**Mechanism:** Supabase Auth — email + password (CONFIRMED: `src/contexts/AuthContext.tsx:112`)

**Session management:**
- Supabase returns a JWT on successful sign-in
- The JWT is stored and managed by the Supabase JS client (browser localStorage)
- `supabase.auth.onAuthStateChange()` monitors session validity and updates React context (`src/contexts/AuthContext.tsx:42`)
- Loading is unblocked via a safety timeout if `onAuthStateChange` never fires (`src/contexts/AuthContext.tsx:58-60`)

**Route protection:**
- `ProtectedRoute` component wraps all authenticated routes (`src/App.tsx:41-46`)
- Unauthenticated users are redirected to `/login`
- Exception: `/showcase` is a public route with no auth requirement (`src/App.tsx:62`)

**User roles** (CONFIRMED: `src/contexts/AuthContext.tsx:9`):
- `admin` — full system access, can manage all users' data
- `board_admin` — ⚠️ REQUIRES VERIFICATION — exact permissions not confirmed from available code
- `user` — standard access, owns own brands and generations

**Role-based access in RLS** (CONFIRMED: `supabase/migrations/20260315000001_allow_admin_delete_generations.sql`):
```sql
USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role))
```
A custom `has_role()` PostgreSQL function implements role checking against an `app_role` type. The function definition is in an earlier migration not present in the current file set.

---

## Authorization — Row Level Security (RLS)

RLS is enabled on application tables (CONFIRMED: `supabase/migrations/20260313211248_add_prompt_versions.sql:18`).

**Known RLS policies:**

| Table | Operation | Policy |
|-------|-----------|--------|
| `prompt_versions` | SELECT | Any authenticated user |
| `prompt_versions` | INSERT | Any authenticated user |
| `creative_studio_generations` | DELETE | Owner (`auth.uid() = user_id`) OR admin role |

⚠️ REQUIRES VERIFICATION — RLS policies for `creative_studio_brands`, `creative_studio_brand_profiles`, `creative_studio_agent_directives`, and `creative_studio_models` are defined in earlier migrations not included in the current migration file set.

---

## Edge Function Auth

All 19 edge functions deploy with `verify_jwt: false`. This means Supabase does not validate the JWT before the function runs. Each function handles its own auth by reading and validating the `Authorization` header. (CONFIRMED: `CLAUDE.md`, deployment pattern)

**Why:** Supabase's default JWT verification causes 401 errors in this project's configuration. See [ADR-005](06-decisions-adr.md#adr-005-edge-functions-deploy-with-verify_jwt-false) for decision context.

**Risk:** If an edge function fails to validate the Authorization header, it becomes an unauthenticated endpoint. Each function must be audited individually.

**CORS:** All edge functions emit `Access-Control-Allow-Origin: *` (CONFIRMED: `supabase/functions/generate-creative-image/index.ts:9-12`). This is appropriate for a client-side SPA but means any origin can call these endpoints if the auth check is bypassed.

---

## Secrets Management

### Server-Side Secrets (Supabase)

Stored as Supabase project secrets (environment variables available to Deno edge functions at runtime):

| Secret | Usage |
|--------|-------|
| `GEMINI_API_KEY` | Google Gemini API calls from edge functions |
| `VERTEX_AI_PROJECT` | Google Vertex AI project ID for specialized Imagen models |

These are never exposed to clients. Accessed via `Deno.env.get('GEMINI_API_KEY')` inside edge functions.

### Client-Side Environment Variables

| Variable | Exposure | Risk |
|----------|----------|------|
| `VITE_SUPABASE_URL` | Browser-visible (bundled) | Low — this is a public endpoint; RLS protects data |
| `VITE_SUPABASE_ANON_KEY` | Browser-visible (bundled) | Low — this is the public anon key by design in Supabase; RLS is the security boundary |

Note: `GEMINI_API_KEY` is **not** a VITE_ variable and is **not** compiled into the bundle. See below.

### Gemini API Key Exposure

**Finding:** The Gemini API key is stored in Supabase Vault and fetched at runtime via authenticated `get_secret` RPC (`BrandAgentApp.tsx:318-331`). It is held in React component state and passed to the Gemini Live WebSocket client. The key is NOT statically extractable from the JS bundle, but IS present in browser memory after the RPC call and visible in DevTools network traffic to any authenticated user.

**Reason it must reach the browser:** The Gemini Live API (real-time voice over WebSocket) requires the API key client-side. A server-side proxy would add unacceptable audio latency. See [ADR-006](06-decisions-adr.md#adr-006-client-side-gemini-api-key-for-voice).

**Mitigations in place:**
- Key stored in Supabase Vault — not in the bundle or `.env.example`
- Only delivered to authenticated users
- Key restricted to `https://vince-359575203061.us-central1.run.app` in Google Cloud Console (HTTP referrer restriction) — CONFIRMED applied 2026-03-16
- Key restricted to Generative Language API only (no other APIs) — CONFIRMED applied 2026-03-16
- ⚠️ localhost not in referrer allowlist — voice mode will fail in local dev

**Recommended additional mitigations:**
- Enable budget alerts in Google Cloud Console (Billing → Budgets & alerts)
- Rotate the key if abuse is detected (see Key Rotation below)

**Affected files:** `src/components/creative-studio/BrandAgentApp.tsx`, `extension/src/hooks/useVinceVoice.ts`, `src/services/brand-agent/brandAgentLiveService.ts`

---

## Key Rotation

To rotate the Gemini API key:

1. **Generate new key** — Google Cloud Console → APIs & Services → Credentials → select the key → Regenerate key
2. **Re-apply domain restriction** — Under "Website restrictions" for key `Vince-202603-15`, re-add:
   - `https://vince-359575203061.us-central1.run.app`
   - `http://localhost:5173` (if local dev voice is needed)
   - `http://localhost:5174` (if local dev voice is needed)
3. **Update Supabase Vault** — Supabase Dashboard → Project Settings → Vault → find `GEMINI_API_KEY` → update value
4. **No deploy required** — key is fetched at runtime; existing sessions will pick up the new key on next page load

---

## Input Validation

**Client-side:** React Hook Form + Zod used for form validation (`package.json` dependencies: `@hookform/resolvers`, `zod`)

**Edge function inputs:** ⚠️ REQUIRES VERIFICATION — systematic input validation in edge functions not confirmed from surface code review. Each function parses the JSON request body directly.

---

## Security Protocols

### SQL Injection Prevention
CONFIRMED safe: All database access goes through the Supabase JS client which uses parameterized queries. No raw SQL string concatenation found in frontend code.

### XSS Prevention
React's JSX rendering escapes HTML by default. Markdown rendering in `ChatMessage.tsx` uses `react-markdown` — ⚠️ REQUIRES VERIFICATION that `dangerouslySetInnerHTML` is not used in chat message rendering.

### Extension Permissions
CONFIRMED from `extension/manifest.json`:
- `sidePanel` — side panel UI
- `storage` — Chrome extension local storage
- `identity` — OAuth identity (extension auth)
- `activeTab` — current tab access (for site detection features)
- Host permissions: Supabase project URL only

No `tabs`, `history`, `bookmarks`, or broad host permissions.

---

## Compliance

### Data Residency
Supabase project location: ⚠️ REQUIRES VERIFICATION — region not determinable from code alone. Confirmable via Supabase dashboard.

### Data Retention
- Generated assets: soft-delete via `archived_at` column (`supabase/migrations/20260315000000_add_archived_at_to_generations.sql`)
- Hard deletion: available to owners and admins via DELETE policy
- No automated retention/purge policy found in codebase

### GDPR / Privacy
⚠️ REQUIRES VERIFICATION — no data processing agreements, privacy policy enforcement, or right-to-erasure workflows found in codebase. User data (brands, generations) is owned per `user_id` and deletable by the owner via RLS policies.

### Audit Logging
⚠️ REQUIRES VERIFICATION — no dedicated audit log table or event stream found. `prompt_versions` table provides history for prompt changes. Generation history in `creative_studio_generations` provides an implicit audit trail for AI-generated content.
