# Vince Android App — Technical Architecture & Build Guide

**Date:** March 15, 2026
**Author:** Kurt Miller, Director of AI Enablement
**Status:** Internal Distribution

---

## Executive Summary

The Vince Android app extends the same web-to-native Capacitor strategy we used for the iOS app. Rather than maintaining a separate Android codebase, the Android shell runs the exact same compiled React bundle — zero duplication of application logic. The approach follows naturally from what we learned building the iOS app and the Chrome extension: the cleanest path to cross-platform distribution is a single authoritative web application with thin platform-specific wrappers.

The Android wrapper adds roughly 50 lines of configuration. Everything else — the animated splash, brand picker, agent conversations, voice input, image generation — is shared 1:1 with the iOS app and the web app.

---

## 1. Architecture

### 1.1 How It Fits Together

The same Vite alias strategy used for iOS applies unchanged:

```typescript
// mobile/vite.config.ts
resolve: {
  alias: {
    '@': path.resolve(__dirname, '../src'),  // Reuse entire web app
    '@/integrations/supabase/client':        // Swap for mobile storage
      path.resolve(__dirname, 'src/supabaseMobileClient.ts'),
  }
}
```

Capacitor copies the compiled `dist/` bundle into `android/app/src/main/assets/public/`, where the Android WebView loads it as if it were a local web app. All the Capacitor plugin calls (preferences, haptics, status bar, splash screen) work identically on Android and iOS — same JavaScript API, different native implementations underneath.

### 1.2 Component Tree

```
MobileApp
├── useEffect → SplashScreen.hide()
├── MobileSplash (animated 2.5s intro)
└── AuthGate (email/password)
    └── AuthProvider
        └── MemoryRouter
            └── VinceHome → BrandAgentApp
```

No Android-specific branches in the React tree. The `source="mobile"` prop on `BrandAgentApp` signals that we're running in a native container.

### 1.3 Storage

Supabase sessions are stored in Capacitor Preferences, which maps to Android `SharedPreferences` under the hood. This is the same swap used on iOS (which maps to `UserDefaults`). Without this, the Android WebView's localStorage can be cleared by the OS under memory pressure, logging the user out unexpectedly.

---

## 2. Splash Screen

Android has the same three-layer splash structure as iOS:

| Layer | What it shows | When it hides |
|---|---|---|
| Android `windowBackground` drawable | Native static splash (dark `#0f0a1e`) | When the Activity's first frame renders |
| Capacitor SplashScreen plugin | `splash.png` in `res/drawable` | When `SplashScreen.hide()` is called from JS |
| `MobileSplash.tsx` (React) | Animated V mark, particles, letter reveal | After 2.5s, fades out |

The animated React splash (`MobileSplash.tsx`) is shared with iOS — same orb pulse, letter-by-letter VINCE reveal, and loading dots. The native `splash.png` background matches at `#0f0a1e` so there's no color flash between layers.

---

## 3. Authentication

Vince uses **email/password** via Supabase `signInWithPassword`. No OAuth, no deep links, no intent filters. This makes the Android setup simpler than apps that rely on Google OAuth — there's no custom URL scheme to register for auth callbacks.

The `AuthGate` component and session storage are shared with iOS unchanged.

---

## 4. Android Configuration

### 4.1 Key Files

| File | Purpose |
|---|---|
| `android/app/src/main/AndroidManifest.xml` | Permissions, launch mode |
| `android/app/src/main/res/values/colors.xml` | Brand colors (`#a855f7`, `#0f0a1e`) |
| `android/app/src/main/res/values/styles.xml` | Dark status bar, dark navigation bar |
| `android/variables.gradle` | SDK versions (minSdk 24, compile/target 36) |
| `android/gradle.properties` | JVM args, JDK path (Android Studio bundled JDK) |
| `capacitor.config.ts` | Android background color, shared plugin config |

### 4.2 Permissions

```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.RECORD_AUDIO" />
```

`RECORD_AUDIO` is required for voice input. Android will show a runtime permission prompt the first time the user activates voice.

### 4.3 SDK Targets

```gradle
minSdkVersion = 24   // Android 7.0 — covers ~98% of active devices
compileSdkVersion = 36
targetSdkVersion = 36
```

### 4.4 JDK Requirement

Android Gradle plugin 8.x requires JDK 17. The machine's system Java (11) is too old. We point Gradle directly at Android Studio's bundled JDK in `gradle.properties`:

```properties
org.gradle.java.home=/Applications/Android Studio.app/Contents/jbr/Contents/Home
```

This avoids needing to install a separate JDK and stays in sync with whatever Android Studio ships.

---

## 5. Build & Deploy

### 5.1 Standard Build

```bash
cd mobile
npx vite build              # compiles web assets → dist/
npx cap sync android        # copies dist/ + syncs plugins
npx cap open android        # opens Android Studio
# Run → select device or emulator
```

### 5.2 Gradle Build (CLI)

```bash
cd mobile/android
./gradlew assembleDebug     # builds debug APK
# Output: app/build/outputs/apk/debug/app-debug.apk
```

### 5.3 Release APK / Play Store

1. Android Studio → Build → Generate Signed Bundle/APK
2. Create or use existing keystore (`mobile/android/release.keystore`)
3. Choose **Android App Bundle (.aab)** for Play Store submission
4. Upload to Google Play Console → Internal Testing → promote to production

---

## 6. App Icon

The Android launcher icon reuses the same source asset as iOS: a faceted purple crystal cube with a V mark in negative space on `#0c0814`.

Android icons live in `mipmap-*` directories and are managed by Capacitor's asset pipeline. The existing iOS icon generation script at `mobile/scripts/install-icon.py` handles iOS only — a separate Android icon generation step will be needed for production submission.

**Icon generation prompt** (same as iOS):

> A square app icon, 1024×1024 pixels, no rounded corners. Edge-to-edge dark background (#0c0814) with subtle purple radial glow. Centered: a geometric faceted crystal cube rendered in luminous violet-purple (#a855f7). The cube faces are clean angular polygons with slight 3D depth — brighter purple-white highlights on upper-left faces, deep violet-indigo in shadow. A bold geometric "V" shape is formed in the negative space of the cube's front face — implied by the crystal geometry, not drawn as a letter. The cube has a soft bioluminescent glow emanating from its edges. Faint circuit-trace hairlines on the cube surfaces. Style: premium, minimal, dark-mode native app. CRITICAL: Background must be solid #0c0814 touching all four edges.

---

## 7. Known Issues & Lessons Learned

### Android Gradle plugin requires JDK 17
System Java 11 causes a hard build failure: `Android Gradle plugin requires Java 17 to run`. Solution: point `org.gradle.java.home` at Android Studio's bundled JDK rather than installing a separate JDK globally.

### Voice mode requires a WebChromeClient override in MainActivity
**This is the most non-obvious Android gotcha.** Vince's voice mode uses `navigator.mediaDevices.getUserMedia({ audio: true })` directly from JavaScript. On iOS this works without any native code — the WKWebView handles it. On Android, the WebView fires `onPermissionRequest` when any JavaScript asks for media access. If nothing handles that callback, the request is silently denied and voice mode fails with no visible error.

The fix is in `MainActivity.java`: override `BridgeWebChromeClient.onPermissionRequest` to bridge the WebView request to the Android runtime permission system:

```java
bridge.getWebView().setWebChromeClient(new BridgeWebChromeClient(bridge) {
    @Override
    public void onPermissionRequest(PermissionRequest request) {
        boolean needsAudio = false;
        for (String resource : request.getResources()) {
            if (PermissionRequest.RESOURCE_AUDIO_CAPTURE.equals(resource)) {
                needsAudio = true;
                break;
            }
        }
        if (needsAudio) {
            if (ContextCompat.checkSelfPermission(MainActivity.this,
                    Manifest.permission.RECORD_AUDIO) == PackageManager.PERMISSION_GRANTED) {
                request.grant(request.getResources());
            } else {
                ActivityCompat.requestPermissions(MainActivity.this,
                        new String[]{Manifest.permission.RECORD_AUDIO}, 100);
                request.deny();
            }
        } else {
            super.onPermissionRequest(request);
        }
    }
});
```

**First-time flow:** User taps voice → Android permission dialog appears → user grants → taps voice again → works. All subsequent uses are seamless.

**Without this:** `getUserMedia()` throws `NotAllowedError`, `connectVinceLiveSession()` throws before the WebSocket opens, and voice mode is silently broken. The error is swallowed by the catch block and the user sees nothing happen.

### `MemoryRouter` is still required
Same as iOS: the Android WebView has no browser history, so any component using React Router hooks needs a `MemoryRouter` context.

### `SplashScreen.hide()` must be called from `MobileApp`
Same as iOS: if it's called anywhere lower in the tree and a component crashes, the native splash overlay stays up permanently. Keep it in `MobileApp`'s `useEffect`.

### SharedPreferences vs localStorage
The `supabaseMobileClient.ts` Capacitor Preferences swap is essential on Android for the same reason as iOS — the WebView treats `android/app` as an isolated origin and the OS can evict localStorage under memory pressure. Sessions stored in Capacitor Preferences survive this because they go to native `SharedPreferences`.
