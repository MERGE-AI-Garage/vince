<!-- ABOUTME: Monitoring and alerting reference for the Vince platform. -->
<!-- ABOUTME: Covers available observability tools, logging patterns, and recommended alert thresholds. -->

# Monitoring & Alerting

## Observability Summary

**No third-party monitoring tools are integrated** (❓ CONFIRMED — searched for Sentry, Datadog, CloudWatch, New Relic, LogRocket, Mixpanel, Amplitude, PostHog — none found in `src/`).

Observability relies on:
1. **Supabase Edge Function logs** — structured `console.log` output in each function
2. **Browser console** — `[Auth]`, `[Vince]` prefixed logs in the frontend
3. **Google Cloud Run logs** — nginx access/error logs plus any Cloud Run platform logs
4. **Supabase Dashboard** — query performance, auth events, storage metrics

---

## Edge Function Logging

Several edge functions implement structured logging. (✅ CONFIRMED — `generate-creative-image/index.ts`, `generate-creative-video/index.ts`)

```typescript
// Pattern used in generate-creative-image and generate-creative-video:
const log = (step: string, message: string, data?: unknown) => {
  console.log(JSON.stringify({ step, message, data, ts: Date.now() }));
};
```

**Access logs:**

```bash
# View recent logs for a specific function
supabase functions logs FUNCTION_NAME --limit 100

# Stream live logs
supabase functions logs FUNCTION_NAME --follow
```

**Key log steps to monitor:**

| Function | Step | Meaning |
|----------|------|---------|
| `generate-creative-image` | `API_KEY` | GEMINI_API_KEY missing — voice/generation broken |
| `generate-creative-image` | `SUPABASE_INIT` | Supabase client initialization |
| `generate-creative-video` | `API_KEY` | GEMINI_API_KEY missing |
| `generate-creative-video` | `SUPABASE_INIT` | Supabase client initialization |

---

## Frontend Logging

Frontend logs use structured prefixes. (✅ CONFIRMED — `src/contexts/AuthContext.tsx`)

| Prefix | Component | Events logged |
|--------|-----------|---------------|
| `[Auth]` | `AuthContext` | Auth state changes, session events, safety timeout |
| `[Vince]` | `BrandAgentApp` | API key fetch, settings load, voice mode status |

**Auth safety timeout:** If `onAuthStateChange` does not fire within 3 seconds, the app logs `[Auth] Safety timeout — unblocking app` and proceeds. This is expected behavior on slow connections.

---

## Key Metrics to Monitor

### Availability

| Check | Method | Acceptable |
|-------|--------|-----------|
| Web app responding | HTTP GET to Cloud Run URL | 200 OK |
| Edge functions deployed | `supabase functions list` | All 17 present |
| Supabase project active | Supabase dashboard | Green status |

### Performance

| Metric | Location | Notes |
|--------|----------|-------|
| Image generation latency | Edge function logs: `generation_time_ms` | ⚠️ INFERRED from response shapes in `BrandAgentApp.tsx` |
| Video generation latency | Edge function logs: `generation_time_ms` | Veo 3 jobs can take 60-180s |
| Edge function cold starts | Supabase logs | Functions may cold-start after inactivity |

### AI API Health

All generation depends on the Google Gemini API. Monitor:

- **Gemini API status:** https://status.cloud.google.com/
- **Quota exhaustion:** Watch for `429 Too Many Requests` in edge function logs
- **Model availability:** `generate-creative-package` uses `gemini-3.1-flash-image-preview` — this is a preview model and may have availability windows

---

## Supabase Dashboard Monitoring

Navigate to your Supabase project dashboard for:

| Section | Path | What to check |
|---------|------|---------------|
| Database health | Database → Reports | Query performance, slow queries |
| Auth events | Authentication → Logs | Failed sign-ins, unusual activity |
| Storage usage | Storage | Bucket sizes, `media` and `creative-studio` growth |
| Edge function invocations | Edge Functions → Logs | Error rates, timeout patterns |
| RLS policy errors | Database → Logs | Policy violations indicate auth/role issues |

---

## Recommended Alerts

No automated alerting is currently configured. The following alerts are recommended:

### Critical (immediate response required)

| Condition | Detection method |
|-----------|-----------------|
| Supabase project paused | Check dashboard; project pauses after inactivity on free tier |
| `GEMINI_API_KEY` secret missing | Edge function logs showing `GEMINI_API_KEY not configured` |
| Cloud Run service down | HTTP health check returning non-200 |

### Warning (investigate within 24 hours)

| Condition | Detection method |
|-----------|-----------------|
| Video generation failures > 20% | Edge function error logs for `generate-creative-video` |
| Auth safety timeout firing repeatedly | Browser console `[Auth] Safety timeout` — indicates slow Supabase responses |
| Storage bucket approaching quota | Supabase Storage dashboard |

---

## AI Usage Tracking

A shared utility exists for tracking AI usage. (✅ CONFIRMED — `supabase/functions/_shared/ai-usage-tracker.ts`)

⚠️ REQUIRES VERIFICATION: The specific tables and columns written by `ai-usage-tracker.ts` were not fully inspected. Usage data is likely stored in a Supabase table. Query the database directly to review AI cost accumulation.

```sql
-- Example query to check generation counts (adapt table name as needed)
SELECT COUNT(*), model_used, DATE(created_at)
FROM creative_studio_generations
GROUP BY model_used, DATE(created_at)
ORDER BY DATE(created_at) DESC;
```
