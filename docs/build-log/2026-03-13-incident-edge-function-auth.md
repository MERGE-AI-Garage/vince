# Incident: All Vince Tools Silently Broken
**Date:** March 13, 2026
**Severity:** Critical — complete loss of tool functionality
**Duration:** ~18 hours (Mar 12 ~9:30 PM → Mar 13 ~3:15 PM)
**Resolved:** Yes

---

## What Broke

Vince responded verbally to every request but executed zero tools. No brand creation, no creative packages, no competitor analysis, no image generation. Purple thinking bubbles stopped appearing. The History panel received nothing.

Vince was hallucinating responses based on system prompt instructions without actually calling any tools.

---

## Root Cause

Supabase edge functions are deployed with `verify_jwt: true` by default. This setting causes the **Supabase platform infrastructure** to authenticate every request before function code runs.

At some point on March 12 (after the last successful generation at 9:28 PM), one or more functions were redeployed without the `--no-verify-jwt` flag. From that point forward, every POST to `brand-prompt-agent` returned 401 before the function code ever executed.

The critical path:

1. `brandAgentLiveService.ts` calls `fetchToolDeclarations()` at session startup — this request has no user auth token (called before session context is established)
2. Platform-level JWT check rejects it → returns 401
3. `fetchToolDeclarations()` silently returns `[]`
4. Gemini Live session starts with **zero function declarations**
5. Gemini cannot call any tools — it hallucinates responses instead

The code had a `get_tools` bypass (returns tool list without auth) but it was unreachable because the platform blocked the request before the code ran.

---

## What Was Observed in Logs

Supabase edge function logs showed 100% 401 responses for all POST requests to `brand-prompt-agent` starting from version 49, through versions 50 and 51. Version 47 (the last working session) had normal 200 responses.

Functions also affected via fire-and-forget chaining:
- `analyze-brand-website` — 401
- `synthesize-brand-profile` — 401

---

## Fix Applied

Redeployed all affected functions with `--no-verify-jwt`:

```bash
npx supabase functions deploy brand-prompt-agent --no-verify-jwt
npx supabase functions deploy analyze-brand-website --no-verify-jwt
npx supabase functions deploy synthesize-brand-profile --no-verify-jwt
npx supabase functions deploy generate-creative-package --no-verify-jwt
npx supabase functions deploy analyze-competitor-video --no-verify-jwt
npx supabase functions deploy generate-creative-video --no-verify-jwt
npx supabase functions deploy analyze-brand-documents --no-verify-jwt
npx supabase functions deploy generate-brand-guardrails --no-verify-jwt
```

With `--no-verify-jwt`, requests reach function code regardless of auth header. The function code handles authentication internally — `get_tools` returns without auth, all other endpoints require a valid user JWT.

Also committed:
- `supabase/functions/brand-prompt-agent/index.ts` — moved `get_tools` mode check before auth in function code (belt-and-suspenders)
- `src/services/brand-agent/brandAgentLiveService.ts` — wrapped `executeRemoteTool` callers with try-catch so a single tool failure returns an error to Gemini instead of crashing the message handler

---

## Prevention

**This will happen again if any function is deployed without `--no-verify-jwt`.**

All functions in this project rely on internal auth logic, not platform JWT verification. The `--no-verify-jwt` flag must be included in every deployment command.

### Deployment command template:
```bash
npx supabase functions deploy <function-name> --no-verify-jwt
```

### Functions that require `--no-verify-jwt`:
All 18 functions in `supabase/functions/`:
- `brand-prompt-agent`
- `analyze-brand-website`
- `synthesize-brand-profile`
- `generate-creative-package`
- `analyze-competitor-video`
- `generate-creative-video`
- `analyze-brand-documents`
- `generate-brand-guardrails`
- `analyze-brand-images`
- `enhance-director-prompt`
- `analyze-expansion-direction`
- `generate-brand-prompt`
- `generate-creative-image`
- `generate-brand-starters`
- `synthesize-generation-prompt`
- `generate-brand-card-images`
- `generate-header-image`
- `generate-studio-welcome-images`

### Deploy script (implemented):
`scripts/deploy-functions.sh` deploys all 18 functions with the correct flag. Run via:
```bash
npm run deploy:functions
```
Never deploy individual functions manually — always use this script.

---

## Timeline

| Time | Event |
|------|-------|
| Mar 12, 9:28 PM | Last successful generation (Google creative package) |
| Mar 12, ~9:30 PM | One or more functions redeployed without `--no-verify-jwt` |
| Mar 12–13 | All Vince sessions appear to work verbally but execute no tools |
| Mar 13, ~2:57 PM | Issue identified via edge function log analysis |
| Mar 13, ~3:05 PM | `brand-prompt-agent` redeployed with `--no-verify-jwt` — brand creation restored |
| Mar 13, ~3:15 PM | Remaining functions redeployed — full pipeline restored |
