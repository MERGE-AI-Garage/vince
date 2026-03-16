# Vince Mobile App

Vince for iOS and Android — a Capacitor hybrid app wrapping the same React codebase as the web app. Full voice + text creative director in your pocket, with five purpose-built mobile tabs.

---

## App Identity

| Field | Value |
|-------|-------|
| App name | Vince |
| Bundle ID (iOS) | `io.vince.app` |
| Package ID (Android) | `io.vince.app` |
| URL scheme | `vince://` |

---

## Tab Structure

### Chat
Full AI creative director conversation — same Gemini Live voice agent as the web app. Supports voice input (tap mic), text input, and inline display of generated images, campaign packages, and generation history. The `source="mobile"` prop suppresses the quick-prompt bar and URL reference row to maximize chat space on smaller screens.

### Brand
Collapsible brand DNA viewer pulled live from the brand profile in Supabase. Sections:

- **Brand Identity** — tagline, positioning, aesthetic, target audience, brand values, key messages
- **Tone of Voice** — formality, personality, energy; do's and don'ts lists
- **Writing Principles** — from brand standards, with Try/Not side-by-side examples and a litmus test
- **Color Palette** — swatches with hex codes, PMS, and role labels; prefers `brand_standards.color_system` groups when available
- **Typography** — primary/secondary fonts with usage notes, style rules
- **Social Media Voice** — persona, voice traits, hashtags
- **Brand Story** — narrative summary, mission, vision
- **Logos** — logo grid from the brand logo library

Sections are accordion-collapsible. Only sections with data render — sparse brand profiles show only what exists.

**Data source:** `useBrandGuidelines` hook → `creative_studio_brands`, `creative_studio_brand_profiles`, `creative_studio_brand_logos`

### Prompts
Brand prompt library pulled from Director mode. Organized by category with a horizontal filter strip (Social, Hero, Product, Campaign, etc.).

**Flow:**
1. Tap a prompt card
2. If the template has variable fields → **Variables sheet** slides up
3. Fill in fields (text, select, number); required fields gate the Generate button
4. Tap **Generate with Gemini** → variables substituted into template → sent to `generate-brand-prompt` edge function
5. **Result sheet** displays the full Gemini-crafted prompt
6. **Copy Prompt** copies to clipboard (one tap); **↺** regenerates a variation

**Variable syntax:** `{{variable_name}}` placeholders in `prompt_template`. Fields are defined in the `variable_fields` JSON column, or auto-detected from the template if not defined.

**Data source:** `creative_studio_brand_prompts` table, ordered by `usage_count` desc

### Campaigns
Generated image and campaign gallery. Two-column grid with filter chips (All / Images / Campaigns / Videos). Tap any card for a full-screen detail view showing:
- Full-size image or video player
- Thumbnail strip for multi-image campaigns
- Provenance panel — prompt text, model, generation time, cost, aspect ratio
- Per-deliverable list with download and copy-to-clipboard buttons

**Data source:** `useCreations` hook → `creative_studio_generations`

### Media
Brand media library — uploaded brand assets and reference images.

---

## Architecture

```
mobile/
├── src/
│   ├── main.tsx              # Entry point — mounts MobileApp
│   ├── MobileApp.tsx         # Root — brand picker, tab bar, brand theme, lazy tab mounting
│   ├── AuthGate.tsx          # Email/password auth gate
│   ├── MobileSplash.tsx      # Animated splash screen
│   ├── BrandDNATab.tsx       # Brand tab component
│   ├── PromptsTab.tsx        # Prompts tab component
│   └── supabaseMobileClient.ts  # Supabase client using Capacitor Preferences storage
├── capacitor.config.ts       # Capacitor config (app ID, plugins, iOS/Android settings)
├── vite.config.ts            # Vite build config — aliases @/ to ../src
└── dist/                     # Built web bundle (generated, not committed)
```

**Shared components** (from `src/`): `BrandAgentApp`, `CreationsTab`, `CompactMediaGrid`, and all `@/` aliased imports resolve to the root `src/` directory.

**Supabase client**: The mobile client (`supabaseMobileClient.ts`) swaps the default `localStorage` session storage for `@capacitor/preferences`, which persists correctly across app restarts on iOS and Android.

**Brand theming**: `deriveMobileBrandTheme()` in `MobileApp.tsx` computes a very dark brand-hued background and a lightened accent from the brand's primary color. The CSS variable `--background` is injected on the root div so `BrandAgentApp`'s Tailwind classes inherit the brand color throughout.

**Tab mounting**: Tabs are lazy-mounted — a tab's component is not rendered until first visited, then kept mounted (`display: none` when inactive) to preserve state.

---

## Build & Deploy

### Prerequisites

| Platform | Requirement |
|----------|-------------|
| iOS | Xcode 15+, valid Apple developer account or personal team |
| Android | Android Studio, SDK 33+ |
| Both | Node 18+, `npx` available |

### Standard workflow

Run these commands every time source code changes:

```bash
# From mobile/ directory:
npx vite build       # compile React → dist/
npx cap sync ios     # copy dist/ into iOS native project
npx cap sync android # copy dist/ into Android native project
```

Then rebuild and run in Xcode or Android Studio.

### One-liner

```bash
cd mobile && npx vite build && npx cap sync
```

### Open in native IDE

```bash
npx cap open ios      # Xcode
npx cap open android  # Android Studio
```

---

## iOS Notes

- **Safe area**: `contentInset: 'never'` in `capacitor.config.ts` — the webview is full-screen and CSS `env(safe-area-inset-top)` handles the status bar. Do not change to `'automatic'` (causes a double inset gap at the top).
- **Microphone**: `NSMicrophoneUsageDescription` is set in `Info.plist` for voice conversations.
- **URL scheme**: `vince://` registered for deep links.
- **Signing**: Uses automatic signing. If the bundle ID changes, accept Xcode's prompt to update the provisioning profile.

## Android Notes

- **Package**: `io.vince.app` in `build.gradle` and `strings.xml`.
- **Scheme**: `androidScheme: 'https'` in `capacitor.config.ts` — required for `getUserMedia` (microphone) to work in the WebView secure context.
- **Source directory**: `mobile/android/` is git-ignored. If missing, run `npx cap add android` from `mobile/`, then `npx cap sync android`.
- **Web debugging**: `webContentsDebuggingEnabled: true` is set — connect Chrome DevTools via `chrome://inspect` for debugging the WebView.

---

## Environment Variables

The mobile Vite build reads from the root `.env` file (via `envDir: path.resolve(__dirname, '..')`):

```
VITE_SUPABASE_URL=        # Supabase project URL
VITE_SUPABASE_ANON_KEY=   # Supabase anon key
VITE_GEMINI_API_KEY=      # Gemini API key
```

These must be present at build time — the values are baked into the compiled bundle.
