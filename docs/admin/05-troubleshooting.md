<!-- ABOUTME: Troubleshooting guide for common Vince platform issues. -->
<!-- ABOUTME: Covers auth failures, generation errors, voice mode problems, and admin access issues. -->

# Troubleshooting

## Quick Diagnostic Checklist

Before investigating specific symptoms, verify:

1. Supabase project is active (not paused) — check https://supabase.com/dashboard
2. All 17 edge functions are deployed — `supabase functions list`
3. `GEMINI_API_KEY` secret is set — `supabase secrets list`
4. Frontend env vars are set — check `.env.local` contains all three `VITE_` variables
5. Cloud Run service is running — `gcloud run services describe vince-web`

---

## Authentication Issues

### Problem: App shows blank screen or spinner indefinitely

**Root cause pattern:** Auth state not resolving.

**Diagnosis:**
- Open browser DevTools → Console
- Look for `[Auth] Safety timeout — unblocking app` (fires after 3 seconds)
- Look for `[Auth] event:` messages — should show `INITIAL_SESSION` or `SIGNED_OUT`

**Fix:**
- If no `[Auth] event` messages appear: `VITE_SUPABASE_URL` or `VITE_SUPABASE_ANON_KEY` is wrong. The client cannot connect to Supabase at all.
- If `[Auth] Safety timeout` fires repeatedly: Supabase project may be paused or unreachable. Check network tab for failed requests to the Supabase URL.

---

### Problem: Login fails silently or shows "Email not confirmed"

**Root cause:** Supabase email confirmation is enabled for the project.

**Fix:**
- Disable email confirmation in Supabase dashboard → Authentication → Settings → Email Auth → Confirm email: OFF (for development)
- Or confirm the user's email manually: Supabase dashboard → Authentication → Users → find user → click the 3-dot menu → Confirm email

---

### Problem: User cannot access admin routes (`/admin`, `/vince`)

**Root cause:** User does not have `admin` role in the `user_roles` table.

**Diagnosis:** The app renders an "Access Denied" screen at `/vince` for non-admins. (✅ CONFIRMED — `src/pages/VinceControlPanel.tsx:90`)

**Fix:**
```sql
-- Grant admin role to a user (run in Supabase SQL editor)
INSERT INTO user_roles (user_id, role)
VALUES ('USER_UUID_HERE', 'admin')
ON CONFLICT (user_id) DO UPDATE SET role = 'admin';
```

The user must sign out and sign back in for the role change to take effect (role is fetched at login).

---

## Edge Function / AI Generation Issues

### Problem: All AI generation fails with 401

**Root cause:** Edge functions deployed without `--no-verify-jwt`. (✅ CONFIRMED — `CLAUDE.md`, `scripts/deploy-functions.sh`)

**Fix:**
```bash
npm run deploy:functions
```

This always deploys with `--no-verify-jwt`.

---

### Problem: Image generation fails — "GEMINI_API_KEY not configured"

**Root cause:** `GEMINI_API_KEY` not set as a Supabase secret.

**Fix:**
```bash
supabase secrets set GEMINI_API_KEY=YOUR_KEY --project-ref YOUR_PROJECT_REF
# Redeploy so functions reload secrets
npm run deploy:functions
```

---

### Problem: Voice mode is disabled — mic button grayed out or absent

**Root cause:** The Gemini API key could not be retrieved from Supabase at runtime.

**Diagnosis:** Browser console shows `[Vince] API key unavailable, voice mode disabled` or `[Vince] Failed to fetch GEMINI_API_KEY`.

**Fix:** The key is fetched via `supabase.rpc('get_secret', { secret_name: 'GEMINI_API_KEY' })`. Ensure:
1. `GEMINI_API_KEY` is set as a Supabase secret: `supabase secrets set GEMINI_API_KEY=YOUR_KEY`
2. The `get_secret` RPC function exists in your database — ⚠️ REQUIRES VERIFICATION: the source of this RPC function was not found in the included migration files.

---

### Problem: Video generation times out or never completes

**Root cause:** Veo 3 video generation is a long-running operation. Videos can take 60-180 seconds.

**Diagnosis:** Check edge function logs for `generate-creative-video`:
```bash
supabase functions logs generate-creative-video --limit 50
```

**Fix:**
- If the function exits with a timeout error: Supabase edge functions have a maximum execution time. ⚠️ REQUIRES VERIFICATION: the exact timeout limit for this Supabase plan was not confirmed.
- If the API returns an error: Check `GEMINI_API_KEY` has access to the Veo 3 model (may require allowlisting by Google).

---

### Problem: Brand analysis or document processing fails

**Root cause candidates:**
1. `GEMINI_API_KEY` not set or expired
2. Document too large for processing
3. Website blocked scraping

**Diagnosis:** Check logs:
```bash
supabase functions logs analyze-brand-website --limit 20
supabase functions logs analyze-brand-documents --limit 20
```

---

## Build Issues

### Problem: `npm run build` fails with TypeScript errors

**Root cause:** TypeScript compilation error (`tsc -b` runs before `vite build`).

**Fix:** Run `npx tsc --noEmit` to see all errors, resolve each, then rebuild.

---

### Problem: Chrome extension loads but shows blank panel

**Root cause:** Extension was not rebuilt after code changes, OR extension `dist/` is stale.

**Fix:**
```bash
cd extension && npx vite build
```
Then go to `chrome://extensions`, find Vince, and click the reload icon.

---

### Problem: Mobile app shows stale content after code change

**Root cause:** `cap sync` was not run after `vite build`. Native IDE serves the previous bundle. (✅ CONFIRMED — `CLAUDE.md`)

**Fix:**
```bash
cd mobile && npx vite build && npx cap sync
```
Then rebuild in Xcode or Android Studio.

---

## Database Issues

### Problem: Queries fail with "permission denied" or RLS violations

**Root cause:** Row-level security policies are blocking the query. Most likely cause: user is not authenticated, or user is trying to access another user's data without admin role.

**Diagnosis:** Enable Supabase database logs → look for `permission denied for table` messages.

**Fix for admin bypass:**
The `creative_studio_generations` DELETE policy allows `has_role(auth.uid(), 'admin'::app_role)`. (✅ CONFIRMED — `supabase/migrations/20260315000001_allow_admin_delete_generations.sql`)
Grant admin role as described in the Authentication section above.

---

### Problem: `prompt_versions` table not found

**Root cause:** Migration `20260313211248_add_prompt_versions.sql` has not been applied.

**Fix:**
```bash
supabase db push --project-ref YOUR_PROJECT_REF
```

---

## Extension-Specific Issues

### Problem: Extension cannot authenticate with Supabase

**Root cause:** The extension uses its own `@/integrations/supabase/client` override. (✅ CONFIRMED — `CLAUDE.md`)

**Fix:** Verify the extension is built with correct `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` environment variables. These must be set in the root `.env.local` (the extension build reads from the root `node_modules` and root env).

---

## Getting Help

- Supabase status: https://status.supabase.com/
- Google AI/Gemini API status: https://status.cloud.google.com/
- Edge function logs: `supabase functions logs FUNCTION_NAME`
- Cloud Run logs: `gcloud logging read "resource.type=cloud_run_revision"`
