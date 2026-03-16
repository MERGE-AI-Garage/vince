# Getting Started

Vince is a voice-driven AI creative director. The codebase is a monorepo with three surfaces — **web**, **Chrome extension**, and **mobile (iOS/Android)** — that all share `src/` and a single set of Supabase edge functions.

---

## Prerequisites

| Tool | Version | Notes |
|------|---------|-------|
| Node.js | 18+ | Tested with v20 |
| npm | 9+ | Ships with Node |
| Git | Any | |
| Supabase account | — | For local testing against the dev project |
| Google Chrome | Any | For extension development |
| Xcode | 15+ | iOS only |
| Android Studio | Latest | Android only |

---

## Step-by-Step Setup

### Step 1: Clone the Repository

```bash
git clone <repo-url>
cd vince
```

### Step 2: Install Dependencies

**Root (web + shared code):**
```bash
npm install
```

**Extension:**
```bash
cd extension && npm install && cd ..
```

**Mobile:**
```bash
cd mobile && npm install && cd ..
```

### Step 3: Configure Environment

```bash
cp .env.example .env.local
```

Edit `.env.local` and set:

**Required variables:**
- `VITE_SUPABASE_URL` — The Supabase project URL (e.g. `https://foolpmhiedplyftbiocb.supabase.co`). Get it from the Supabase dashboard → Project Settings → API.
- `VITE_SUPABASE_ANON_KEY` — The public anon key. Same location in the Supabase dashboard.

**Variables NOT in .env:**
- `GEMINI_API_KEY` — Stored in Supabase Vault (Settings → Vault in the Supabase dashboard). Edge functions read it at runtime. You do not set this locally.

**❌ Common Issue: "Missing Supabase URL/key" errors on startup**
- **Cause:** `.env.local` was not created or variables are blank.
- **Fix:** Confirm both variables are set in `.env.local` and that the file is in the project root (not `src/`).

### Step 4: Start the Web Dev Server

```bash
npm run dev
```

**Expected output:**
```
  VITE v5.4.19  ready in XXXms

  ➜  Local:   http://localhost:5173/
  ➜  Network: ...
```

**Application is running at:** http://localhost:5173

**❌ Common Issues:**
- `Port 5173 already in use` → Kill the process on that port or run `npm run dev -- --port 5174`
- Blank screen with console auth errors → Supabase env vars are wrong or missing

### Step 5: Verify Setup

1. Open http://localhost:5173
2. You should see the Vince login screen
3. Sign in with a Supabase user account

---

## Surface-Specific Setup

### Chrome Extension

```bash
cd extension
npx vite build
```

**To load in Chrome:**
1. Go to `chrome://extensions`
2. Enable **Developer mode** (top right)
3. Click **Load unpacked**
4. Select `extension/dist/`

**For development (rebuilding on changes):**
```bash
cd extension && npx vite build --watch
```
Reload the extension in `chrome://extensions` after each build — Chrome does not hot-reload extensions.

**❌ Common Issue: Extension shows blank panel**
- **Cause:** Stale build or env vars not baked in.
- **Fix:** Re-run `npx vite build` and reload the extension.

### Mobile (iOS + Android)

**Build web bundle and sync to native projects:**
```bash
cd mobile
npx vite build
npx cap sync          # syncs to both iOS and Android
```

**Open in Xcode (iOS):**
```bash
npx cap open ios
```

**Open in Android Studio:**
```bash
npx cap open android
```

> ⚠️ **REQUIRED**: Always run `npx vite build && npx cap sync` before opening Xcode or Android Studio. The native IDEs serve the compiled bundle from `mobile/dist/` — opening without syncing loads stale assets.

---

## Edge Functions (Optional for Local Dev)

Edge functions run on Supabase infrastructure. For most feature work you can point at the deployed dev project and don't need to run functions locally.

**Deploy all functions:**
```bash
npm run deploy:functions
```

**Deploy a single function:**
```bash
supabase functions deploy <function-name>
```

> ⚠️ All functions must deploy with `verify_jwt: false` (see `scripts/deploy-functions.sh`). Deploying without this flag causes 401 errors on all requests.

---

## Build Commands Reference

| Command | Output | Notes |
|---------|--------|-------|
| `npm run dev` | Dev server at localhost:5173 | Web only |
| `npm run build` | `dist/` | TypeScript check + Vite build |
| `npm run preview` | Local preview of `dist/` | |
| `npm run deploy:functions` | Deploys all edge functions | Runs `scripts/deploy-functions.sh` |
| `cd extension && npx vite build` | `extension/dist/` | Chrome extension |
| `cd mobile && npx vite build` | `mobile/dist/` | Mobile web bundle |
| `npx cap sync` | Syncs to iOS + Android | Run from `mobile/` after mobile build |
| `npx cap open ios` | Opens Xcode | Run from `mobile/` |
| `npx cap open android` | Opens Android Studio | Run from `mobile/` |

---

## First Contribution

```bash
git checkout -b feat/your-feature
# make changes
npm run build          # verify TypeScript compiles
git add <specific files>
git commit -m "feat: description"
```

See [04-contributing.md](04-contributing.md) for the full workflow.
