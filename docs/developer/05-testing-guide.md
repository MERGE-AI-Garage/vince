# Testing Guide

## Current State

**CONFIRMED: There is no automated test suite in this codebase.**

No test files exist in `src/`, `extension/`, or `mobile/`. No test framework (Jest, Vitest, Playwright, etc.) is configured in any `package.json`. There is no `test` script in the root `package.json`.

This means:
- There is no `npm test` to run
- There are no test coverage reports
- All quality gates are manual

This is a known gap. The build (`npm run build`) is the only automated check — it runs TypeScript compilation and will catch type errors and syntax problems, but not behavioral regressions.

---

## Current Quality Gates

### 1. TypeScript compilation
```bash
npm run build
```
This is the primary automated gate. It runs `tsc` + Vite build. Zero TypeScript errors is required before merging.

> ⚠️ The project uses `noImplicitAny: false` and `strictNullChecks: false` (`tsconfig.json`), so TypeScript is not running in strict mode. Many runtime errors won't be caught at compile time.

### 2. Manual functional testing

Since there are no automated tests, verify your changes manually before submitting a PR:

**Web:**
1. Run `npm run dev`
2. Open http://localhost:5173
3. Sign in
4. Exercise the specific flow you changed end-to-end

**Extension:**
1. Run `cd extension && npx vite build`
2. Reload at `chrome://extensions`
3. Open the side panel on a page
4. Exercise the changed functionality

**Mobile:**
1. Run `cd mobile && npx vite build && npx cap sync`
2. Open in Xcode or Android Studio
3. Run on simulator or device

### 3. Edge function testing

Test changed edge functions against the dev Supabase project. There is no local emulation setup documented.

The quickest way to test an edge function in isolation:
```bash
curl -X POST https://<project-ref>.supabase.co/functions/v1/<function-name> \
  -H "Authorization: Bearer <anon-key>" \
  -H "Content-Type: application/json" \
  -d '{"brand_id": "<uuid>", ...}'
```

---

## Recommended Testing Approach for New Features

When adding a new feature, manually test these scenarios before submitting a PR:

### For new UI components
- [ ] Component renders without errors in the browser
- [ ] Handles empty/null data gracefully (brand_id is null on first load, for example)
- [ ] Works on all three surfaces if the component is in `src/components/` (web, extension, mobile)
- [ ] Dark theme renders correctly (extension and mobile use brand-adaptive dark themes)
- [ ] No console errors during normal interaction

### For new edge functions
- [ ] Function deploys successfully (`supabase functions deploy <name>`)
- [ ] `OPTIONS` preflight returns 200 with correct CORS headers
- [ ] Happy path returns expected JSON structure
- [ ] Missing required fields return a clear error (not a 500 crash)
- [ ] With a valid `brand_id`, brand context is injected into the AI prompt

### For brand analysis changes
- [ ] Run analysis on at least one test brand
- [ ] Verify output JSON structure matches what downstream consumers expect
- [ ] Test with a brand that has minimal data (partial profiles should not crash)

---

## Adding Automated Tests (When the Time Comes)

If/when automated testing is added to this project, the recommended approach:

**Framework:** Vitest (already in the Vite ecosystem, minimal config)

**Priority order for initial coverage:**
1. Service functions in `src/services/` — pure TypeScript logic, easy to unit test
2. Edge function request/response contracts — integration tests against the Supabase dev project
3. Critical UI flows — E2E with Playwright

**What not to mock:**
- Supabase calls — test against the real dev project. Mock Supabase tests historically mask migration failures and schema drift.
- Gemini responses — for integration tests, use real API calls with test prompts that have deterministic outputs.

---

## Common Issues During Manual Testing

### "Unauthorized" / 401 from edge functions
- **Cause:** Function was deployed without `--no-verify-jwt`, or Supabase anon key is wrong.
- **Fix:** Redeploy with `npm run deploy:functions`. Confirm env vars match the Supabase project you're testing against.

### Blank screen in extension after rebuild
- **Cause:** Chrome is caching the old bundle.
- **Fix:** Go to `chrome://extensions`, click the reload icon on the Vince extension, then re-open the side panel.

### Mobile shows stale UI after code change
- **Cause:** `cap sync` was not run after `vite build`.
- **Fix:** Always run both: `cd mobile && npx vite build && npx cap sync`.

### Gemini Live voice session fails to start
- **Cause:** `GEMINI_API_KEY` not set in Supabase Vault, or API key has no quota.
- **Fix:** Check Supabase dashboard → Settings → Vault. Confirm the key is present and has available quota.
