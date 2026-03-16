<!-- ABOUTME: Operations runbooks for routine and emergency Vince platform tasks. -->
<!-- ABOUTME: Covers function deployment, secret rotation, user role management, and database maintenance. -->

# Operations Runbooks

---

# Runbook-001: Deploy All Edge Functions
**Frequency:** Every code change to `supabase/functions/`
**Duration:** ~3 min
**Downtime:** None (functions update atomically)
**Risk Level:** Low
**Requires:** Supabase CLI authenticated, project linked

## Prerequisites
- `supabase` CLI installed and authenticated (`supabase login`)
- Project linked (`supabase link --project-ref YOUR_PROJECT_REF`)

## Procedure
```bash
npm run deploy:functions
```

## Expected Output
```
Deploying brand-prompt-agent...
Deploying analyze-brand-website...
[... 15 more functions ...]
All 17 functions deployed.
```

## Failure modes
1. `Cannot find supabase` — install CLI: `npm install -g supabase`
2. `Error: Project not linked` — run `supabase link --project-ref YOUR_REF`
3. Individual function fails — deploy it alone: `supabase functions deploy FUNCTION_NAME --no-verify-jwt`

## Rollback
Redeploy the previous git SHA:
```bash
git checkout PREVIOUS_SHA -- supabase/functions/FUNCTION_NAME/
supabase functions deploy FUNCTION_NAME --no-verify-jwt
git checkout HEAD -- supabase/functions/FUNCTION_NAME/
```

## Validation
Test one function endpoint returns non-401:
```bash
curl -s -o /dev/null -w "%{http_code}" \
  -X POST https://YOUR_PROJECT.supabase.co/functions/v1/generate-brand-starters \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"brand_id":"test"}'
# Expected: 400 or 200, NOT 401
```

---

# Runbook-002: Rotate the Gemini API Key
**Frequency:** As needed (security rotation or key compromise)
**Duration:** ~5 min
**Downtime:** ~2 min (functions unavailable during redeployment)
**Risk Level:** Medium
**Requires:** Supabase CLI authenticated, new Gemini API key from Google AI Studio

## Prerequisites
- Obtain new API key from https://aistudio.google.com/apikey
- Have Supabase CLI authenticated

## Procedure

**Step 1:** Set the new secret
```bash
supabase secrets set GEMINI_API_KEY=YOUR_NEW_KEY --project-ref YOUR_PROJECT_REF
```

**Step 2:** Redeploy all functions to pick up the new secret
```bash
npm run deploy:functions
```

**Step 3:** Verify voice mode still works
- Navigate to the web app
- Open a brand's chat interface
- Check that the mic button is enabled (not grayed out)
- Or check browser console — no `[Vince] API key unavailable` warning

## Rollback
If the new key does not work, revert to the previous key:
```bash
supabase secrets set GEMINI_API_KEY=YOUR_OLD_KEY --project-ref YOUR_PROJECT_REF
npm run deploy:functions
```

## Validation
Trigger a test image generation from the Creative Studio — it completes without error.

---

# Runbook-003: Grant or Revoke Admin Role
**Frequency:** As needed (new team members, offboarding)
**Duration:** ~2 min
**Downtime:** None
**Risk Level:** Medium (admin role grants full data access)
**Requires:** Supabase SQL editor access or psql

## Prerequisites
- Know the user's UUID (find in Supabase dashboard → Authentication → Users)

## Procedure: Grant admin

```sql
INSERT INTO user_roles (user_id, role)
VALUES ('USER_UUID_HERE', 'admin')
ON CONFLICT (user_id) DO UPDATE SET role = 'admin';
```

## Procedure: Revoke admin (downgrade to user)

```sql
UPDATE user_roles SET role = 'user' WHERE user_id = 'USER_UUID_HERE';
```

## Procedure: Grant board_admin

```sql
INSERT INTO user_roles (user_id, role)
VALUES ('USER_UUID_HERE', 'board_admin')
ON CONFLICT (user_id) DO UPDATE SET role = 'board_admin';
```

## Notes
- Role changes take effect on next sign-in. The user must sign out and sign back in.
- Admin role grants: access to `/admin` and `/vince` routes, ability to delete any user's generations, view all generations in History panel. (✅ CONFIRMED — `src/pages/VinceControlPanel.tsx`, `src/components/creative-studio/HistoryPanel.tsx`)

## Rollback
Revert the role to `user`:
```sql
UPDATE user_roles SET role = 'user' WHERE user_id = 'USER_UUID_HERE';
```

## Validation
Have the affected user sign out and back in. They should see (or not see) the admin navigation link and `/admin` route access.

---

# Runbook-004: Apply Database Migrations
**Frequency:** After pulling new code that includes migrations
**Duration:** ~2 min
**Downtime:** None (migrations are additive)
**Risk Level:** Medium (irreversible without manual rollback)
**Requires:** Supabase CLI authenticated, project linked

## Prerequisites
- Review each new migration file in `supabase/migrations/` before applying
- Confirm the migration is additive (no DROP without a safety net)

## Procedure
```bash
supabase db push --project-ref YOUR_PROJECT_REF
```

## Failure modes
1. `column already exists` — migration partially applied. Inspect `supabase_migrations` schema table to see applied state.
2. `function has_role does not exist` — migration references a DB function from a prior migration that hasn't been applied. Apply migrations in order.
3. Permission error — ensure your Supabase account has database admin access.

## Rollback
No automated rollback scripts exist. Manual rollback:
1. Identify the inverse SQL for the migration
2. Run it in the Supabase SQL editor
3. Remove the migration's entry from the `supabase_migrations` tracking table if needed

## Validation
Run a test query against the new table or column:
```sql
-- Example: verify archived_at column exists
SELECT archived_at FROM creative_studio_generations LIMIT 1;
```

---

# Runbook-005: Deploy Web App to Cloud Run
**Frequency:** On each production release
**Duration:** ~10 min
**Downtime:** None (Cloud Run traffic-shifting is instantaneous)
**Risk Level:** Low
**Requires:** Docker, gcloud CLI authenticated, Artifact Registry push access

## Prerequisites
- All environment variables available (see `02-configuration-reference.md`)
- gcloud project configured: `gcloud config set project YOUR_PROJECT_ID`

## Procedure

**Step 1:** Build the container
```bash
docker build -t gcr.io/YOUR_PROJECT_ID/vince-web:$(git rev-parse --short HEAD) .
```

**Step 2:** Push to Artifact Registry
```bash
docker push gcr.io/YOUR_PROJECT_ID/vince-web:$(git rev-parse --short HEAD)
```

**Step 3:** Deploy to Cloud Run
```bash
gcloud run deploy vince-web \
  --image gcr.io/YOUR_PROJECT_ID/vince-web:$(git rev-parse --short HEAD) \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --port 8080 \
  --set-env-vars VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co,VITE_SUPABASE_ANON_KEY=YOUR_ANON_KEY,VITE_GEMINI_API_KEY=YOUR_GEMINI_KEY
```

## Rollback
```bash
# List recent revisions
gcloud run revisions list --service vince-web --region us-central1

# Roll back to a previous revision
gcloud run services update-traffic vince-web \
  --to-revisions PREVIOUS_REVISION_NAME=100 \
  --region us-central1
```

## Validation
```bash
curl -s -o /dev/null -w "%{http_code}" https://YOUR_CLOUD_RUN_URL/
# Expected: 200
```

---

# Runbook-006: Archive / Soft-Delete Generations (Admin)
**Frequency:** As needed (content moderation)
**Duration:** ~1 min
**Downtime:** None
**Risk Level:** Low
**Requires:** Admin role or database access

## Procedure: Via Admin UI

1. Navigate to `/admin`
2. Open the **Generations** tab
3. Find the generation to archive
4. Use the archive action (sets `archived_at` timestamp)

## Procedure: Via SQL

```sql
-- Archive a specific generation
UPDATE creative_studio_generations
SET archived_at = NOW()
WHERE id = 'GENERATION_UUID_HERE';

-- Restore an archived generation
UPDATE creative_studio_generations
SET archived_at = NULL
WHERE id = 'GENERATION_UUID_HERE';

-- Hard delete (irreversible) — admin only
DELETE FROM creative_studio_generations
WHERE id = 'GENERATION_UUID_HERE';
```

(✅ CONFIRMED — `supabase/migrations/20260315000000_add_archived_at_to_generations.sql`, `20260315000001_allow_admin_delete_generations.sql`)

## Notes
- `archived_at = NULL` = active (visible in main view)
- `archived_at` populated = archived (hidden from main view, not deleted)
- Only admins can hard-delete via the `has_role(auth.uid(), 'admin'::app_role)` RLS policy

## Validation
Verify the generation is hidden from the main view and visible (or absent) in the admin Generations tab.

---

# Runbook-007: Backfill Media Tags
**Frequency:** One-time or after bulk media imports
**Duration:** Variable (depends on media count)
**Downtime:** None
**Risk Level:** Low
**Requires:** `GEMINI_API_KEY` in environment, Supabase credentials

## Procedure
```bash
# From repo root
node scripts/backfill-media-tags.mjs
```

This script reads `VITE_GEMINI_API_KEY` from the environment (or `.env.local`) and processes untagged media records.

## Validation
Query the `media` table in Supabase — records should have populated tag fields after the run.
