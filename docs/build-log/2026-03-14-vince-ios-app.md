# Vince iOS App — Technical Architecture & Build Guide

**Date:** March 14, 2026
**Author:** Kurt Miller, Director of AI Enablement
**Status:** Internal Distribution

---

## Executive Summary

The Vince iOS app is a native iOS wrapper around MERGE's Vince Creative Director agent, built using Capacitor 8. It reuses 100% of the existing web application code through a build-time Vite alias strategy, requiring only ~400 lines of mobile-specific code. This is the same architectural pattern used by the Ivy and Axel iOS apps — all three platform clients share a single canonical codebase with zero duplication.

Vince is MERGE's AI creative director: brand voice and visual identity management, creative brief generation, campaign ideation, and multi-format content production. The iOS app brings this full capability set to mobile, including file upload, YouTube URL import, and real-time brand agent conversations.

---

## 1. Architecture

### 1.1 The Vite Alias Strategy

The mobile build reuses the entire main `src/` directory by aliasing `@/` to the parent:

```typescript
// mobile/vite.config.ts
resolve: {
  alias: {
    '@': path.resolve(__dirname, '../src'),  // Reuse entire web app
    '@/integrations/supabase/client':        // Swap only the Supabase client
      path.resolve(__dirname, 'src/supabaseMobileClient.ts'),
  }
}
```

The `supabaseMobileClient.ts` swap replaces `localStorage` with Capacitor Preferences for persistent session storage on iOS.

### 1.2 Environment Variables

**Critical:** The `.env` file lives in the project root (`/vince/`), not in `mobile/`. Vite's `envDir` must point up one level:

```typescript
// mobile/vite.config.ts
envDir: path.resolve(__dirname, '..'),  // ← required or build fails silently
```

Without this, `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are undefined and the app crashes at startup with `Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY environment variables`.

### 1.3 Security

| Credential | Location | Notes |
|---|---|---|
| `VITE_SUPABASE_URL` | Baked into binary | Designed to be public |
| `VITE_SUPABASE_ANON_KEY` | Baked into binary | Protected by RLS, designed to be public |
| `GEMINI_API_KEY` | Supabase Vault, fetched at runtime via `get_secret` RPC | Never in binary |

The Gemini key is safe for TestFlight/App Store distribution — it is never compiled into the binary.

### 1.4 Component Tree

```
MobileApp
├── useEffect → SplashScreen.hide()  ← must live here, not in MobileSplash
├── MobileSplash (animated 2.5s intro, hides when done)
└── AuthGate (email/password auth)
    └── AuthProvider
        └── MemoryRouter  ← required: BrandAgentApp uses React Router hooks
            └── VinceHome → BrandAgentApp
```

**Why `SplashScreen.hide()` is in `MobileApp`:** The Capacitor native splash overlay (`launchAutoHide: false`) must be dismissed from JavaScript. If it lives in `MobileSplash` and any provider above it crashes, the overlay never hides and the user sees a stuck splash forever. Placing it in `MobileApp`'s `useEffect` guarantees it fires even if children fail.

**Why `MemoryRouter`:** `BrandAgentApp` uses React Router hooks (`useNavigate`, etc.). Capacitor WebView apps don't have a browser history stack — `MemoryRouter` provides one.

---

## 2. Splash Screen Architecture

There are three distinct splash layers:

| Layer | What it shows | When it hides |
|---|---|---|
| iOS `LaunchScreen.storyboard` | Native iOS launch image (static) | Automatically when app's first frame renders |
| Capacitor SplashScreen plugin | `Assets.xcassets/Splash.imageset` PNG | When `SplashScreen.hide()` is called from JS |
| `MobileSplash.tsx` (React) | Animated V mark, particles, letter reveal | After 2.5s, fades out |

The animated splash (`MobileSplash.tsx`) is a React component — fully customizable with CSS animations, SVG, anything. The Capacitor plugin layer is static PNG only.

For a seamless experience, the `Splash.imageset` PNG background should match the React splash background (`#0f0a1e`).

---

## 3. Authentication

Vince uses **email/password authentication** via Supabase `signInWithPassword`. There is no Google OAuth. The `AuthGate` component handles the full auth flow including sign-in form and session persistence via Capacitor Preferences.

---

## 4. Build & Deploy

### 4.1 Standard Build

```bash
cd mobile
npx vite build          # compiles web assets to dist/
npx cap sync ios        # copies dist/ to ios/App/App/public/
# Then Cmd+R in Xcode to run on device/simulator
```

### 4.2 Build Script

```bash
cd mobile && npx vite build && npx cap sync ios
```

### 4.3 Distribution (TestFlight)

1. Xcode → Product → Archive
2. Distribute App → App Store Connect → Upload
3. App Store Connect → TestFlight → create external group → get public link
4. Paste link on the Vince homepage next to the Chrome extension button

---

## 5. App Icon

The icon is a faceted purple crystal cube with a V mark in negative space on a near-black background (`#0c0814`).

**Source file:** `mobile/scripts/vince-icon-source.png`

**Install script:** `mobile/scripts/install-icon.py`

```bash
# Requires: pip install pillow numpy
python3 mobile/scripts/install-icon.py "/path/to/new-icon.png"
```

The script:
1. Detects the background color from corner pixels
2. Crops dark padding to isolate the icon subject
3. Scales content to fill 88% of a 1024×1024 canvas
4. Writes `AppIcon.png` + `Contents.json` in the Xcode asset catalog (modern single-file format, Xcode 14+)

**Icon generation prompt** (for regenerating or iterating):

> A square iOS app icon, 1024×1024 pixels, no rounded corners. Edge-to-edge dark background (#0c0814) with subtle purple radial glow. Centered: a geometric faceted crystal cube rendered in luminous violet-purple (#a855f7). The cube faces are clean angular polygons with slight 3D depth — brighter purple-white highlights on upper-left faces, deep violet-indigo in shadow. A bold geometric "V" shape is formed in the negative space of the cube's front face — implied by the crystal geometry, not drawn as a letter. The cube has a soft bioluminescent glow emanating from its edges. Faint circuit-trace hairlines on the cube surfaces. Style: premium, minimal, dark-mode native app. CRITICAL: Background must be solid #0c0814 touching all four edges. No white space, no border, no rounded corners baked in.

---

## 6. Known Issues & Lessons Learned

### Missing `envDir` causes silent env var failure
The Vite `root` defaults to `mobile/` but `.env` is in the project root. Without `envDir: path.resolve(__dirname, '..')`, the build succeeds but the app crashes on launch with a missing env var error that's hidden under the splash screen.

### `SplashScreen.hide()` must be called from a high-level component
Calling it at module evaluation time in `main.tsx` (before `createRoot`) silently drops the call because the Capacitor bridge isn't initialized yet. Calling it from `MobileSplash`'s `useEffect` works but fails if any ancestor crashes. `MobileApp`'s `useEffect` is the correct location.

### `launchAutoHide: false` + stuck splash = invisible errors
With `launchAutoHide: false`, any JavaScript error that prevents `SplashScreen.hide()` from running leaves the native overlay on top of the WebView indefinitely. The user sees the splash forever with no indication of the real error. For debugging, temporarily set `launchAutoHide: true` + `launchShowDuration: 2000` to reveal what's happening under the splash.

### `MemoryRouter` required for React Router inside Capacitor
Capacitor WebView has no browser history. Any component that uses `useNavigate`, `useLocation`, or other React Router hooks will crash without a router context. Wrap in `<MemoryRouter>` at the `MobileApp` level.
