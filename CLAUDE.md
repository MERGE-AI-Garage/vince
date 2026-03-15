# Vince — Project Context for Claude

## What this is
Vince is a voice-driven AI creative director. Three surfaces share the same React codebase:
1. **Web app** — main Creative Studio at `src/`
2. **Chrome Extension** — side panel at `extension/`
3. **Mobile app** — Capacitor iOS/Android at `mobile/`

All three alias `@/` to `src/` and share components. The mobile and extension each override `@/integrations/supabase/client` with their own auth-aware client.

---

## Build commands

### Web app
```bash
npm run dev          # dev server at localhost:5173
npm run build        # production build → dist/
```

### Chrome extension
```bash
cd extension && npx vite build    # → extension/dist/
# Reload in chrome://extensions after each build
```

### Mobile (iOS + Android)
```bash
cd mobile && npx vite build       # build web bundle → mobile/dist/
npx cap sync                      # copy to both native projects
npx cap sync ios                  # iOS only
npx cap sync android              # Android only
npx cap open ios                  # open Xcode
npx cap open android              # open Android Studio
```

> **Always run `vite build && cap sync` before opening the native IDE.** Xcode/Android Studio serve the compiled web bundle from `mobile/dist/` — opening without syncing loads stale assets.

### Edge functions
```bash
npm run deploy:functions          # deploy all Supabase edge functions
supabase functions deploy <name>  # deploy one function
```

---

## Key files

| File | Purpose |
|------|---------|
| `src/components/creative-studio/BrandAgentApp.tsx` | Core chat/voice interface (web + mobile) |
| `src/components/shared-chat/InputArea.tsx` | Reusable chat input |
| `mobile/src/MobileApp.tsx` | Mobile root — brand picker, bottom tab bar, brand theming |
| `extension/src/BrandApp.tsx` | Extension root — tab layout, brand theming |
| `extension/src/chat/ChatTab.tsx` | Extension chat with voice, history, campaigns |

## Edge function deploy notes
All edge functions must be deployed with `--no-verify-jwt` (or `verify_jwt: false` in config). The default causes 401s. See `supabase/functions/*/index.ts` — each function handles its own auth.

## Mobile-specific behavior
- `source="mobile"` is passed to `BrandAgentApp` — used to suppress quick prompts on mobile
- Brand-adaptive dark theme is computed in `deriveMobileBrandTheme()` in `MobileApp.tsx`
- CSS variable `--background` is injected on the root div so Tailwind's `bg-background` inherits the brand color throughout BrandAgentApp
