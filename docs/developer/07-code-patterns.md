# Code Patterns

Real patterns extracted from this codebase. Every example below is grounded in actual code.

---

## File Header Pattern (Required)

Every file must start with two ABOUTME comment lines. This is a project-wide convention.

✅ **CORRECT** (`src/integrations/supabase/client.ts:1-2`):
```typescript
// ABOUTME: Supabase client singleton.
// ABOUTME: Reads URL and anon key from VITE_ environment variables.
```

✅ **CORRECT** (`mobile/src/supabaseMobileClient.ts:1-2`):
```typescript
// ABOUTME: Mobile-compatible Supabase client using Capacitor Preferences for session persistence
// ABOUTME: Drop-in replacement for the main app's client — aliased in vite.config.ts
```

❌ **WRONG:**
```typescript
// This file handles Supabase auth
// Created 2024-01-15

import { createClient } from '@supabase/supabase-js';
```

Use `ABOUTME:` as the prefix so these headers are easily searchable with `grep ABOUTME`.

---

## Supabase Client Singleton Pattern

The web app exports a single `supabase` instance. All components and services import from `@/integrations/supabase/client`.

✅ **CORRECT** (`src/integrations/supabase/client.ts`):
```typescript
// ABOUTME: Supabase client singleton.
// ABOUTME: Reads URL and anon key from VITE_ environment variables.

import { createClient } from '@supabase/supabase-js';

export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY environment variables');
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
```

❌ **WRONG:** Creating a new `createClient()` in each file that needs Supabase.

**Why:** Multiple client instances cause auth state divergence. `vite.config.ts` in each surface aliases this import to a surface-specific implementation — so the single import point is load-bearing for the three-surface architecture.

---

## Surface Client Override Pattern

Mobile and extension override the Supabase client via Vite aliases while keeping the same import path. This is how both surfaces share all of `src/` without modification.

✅ **Mobile client** (`mobile/src/supabaseMobileClient.ts`):
```typescript
// ABOUTME: Mobile-compatible Supabase client using Capacitor Preferences for session persistence
// ABOUTME: Drop-in replacement for the main app's client — aliased in vite.config.ts

import { createClient } from '@supabase/supabase-js';
import { Preferences } from '@capacitor/preferences';

// Stores auth tokens in native UserDefaults (iOS) / SharedPreferences (Android)
// instead of localStorage, which iOS clears under storage pressure
const capacitorStorageAdapter = {
  getItem: async (key: string): Promise<string | null> => {
    const { value } = await Preferences.get({ key });
    return value;
  },
  setItem: async (key: string, value: string): Promise<void> => {
    await Preferences.set({ key, value });
  },
  removeItem: async (key: string): Promise<void> => {
    await Preferences.remove({ key });
  },
};

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: capacitorStorageAdapter,
    persistSession: true,
    autoRefreshToken: true,
  },
});
```

The `mobile/vite.config.ts` then aliases `@/integrations/supabase/client` → `./src/supabaseMobileClient.ts`. All shared components import from `@/integrations/supabase/client` — they never know which implementation they get.

---

## Parallel Data Fetching Pattern

When loading brand context (or any set of independent queries), use `Promise.all` — not sequential awaits.

✅ **CORRECT** (`src/services/brand-agent/brandAgentGeminiService.ts:67-95`):
```typescript
export async function fetchBrandContext(brandId: string): Promise<BrandContext> {
  const [
    { data: brand },
    { data: profile },
    { data: directives },
    { data: prompts, count: totalPrompts },
  ] = await Promise.all([
    supabase
      .from('creative_studio_brands')
      .select('id, name, description, brand_voice, visual_identity, quick_prompts')
      .eq('id', brandId)
      .single(),
    supabase
      .from('creative_studio_brand_profiles')
      .select('visual_dna, photography_style, color_profile, ...')
      .eq('brand_id', brandId)
      .single(),
    supabase
      .from('creative_studio_agent_directives')
      .select('name, persona, rules, ...')
      .eq('brand_id', brandId)
      .eq('is_active', true),
    // ...
  ]);
  // ...
}
```

❌ **WRONG:**
```typescript
const { data: brand } = await supabase.from('creative_studio_brands')...
const { data: profile } = await supabase.from('creative_studio_brand_profiles')...
const { data: directives } = await supabase.from('creative_studio_agent_directives')...
```

**Why:** Sequential awaits stack the latency of each query. With 4 queries at ~50ms each, `Promise.all` takes ~50ms total vs ~200ms sequential.

---

## Edge Function Structure Pattern

All 19 edge functions follow this structure exactly (`supabase/functions/analyze-expansion-direction/index.ts` is the clearest example):

✅ **CORRECT:**
```typescript
// ABOUTME: [what it does]
// ABOUTME: [second line]

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // 1. Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // 2. Parse request
    const { required_param, optional_param } = await req.json();

    // 3. Validate required params
    if (!required_param) {
      return new Response(
        JSON.stringify({ error: 'required_param is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // 4. Get API key from Vault
    const apiKey = Deno.env.get('GEMINI_API_KEY');
    if (!apiKey) throw new Error('Missing GEMINI_API_KEY');

    // 5. Call external API
    const response = await fetch(`${BASE_URL}/...`, { ... });
    if (!response.ok) throw new Error(`API error: ${response.status}`);

    // 6. Return structured result
    return new Response(
      JSON.stringify({ success: true, result: '...' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
```

❌ **WRONG:** Missing CORS headers on all response paths (causes silent failures in browsers). Missing OPTIONS handler (causes preflight failures).

---

## Brand Context Injection Pattern

Any edge function that generates content should inject brand DNA into the prompt when `brand_id` is present.

✅ **CORRECT:**
```typescript
// Load brand profile if brand_id provided
let brandContext = '';
if (brand_id) {
  const { data: profile } = await supabaseClient
    .from('brand_profiles')
    .select('visual_dna, photography_style, color_profile, tone_of_voice')
    .eq('brand_id', brand_id)
    .single();

  if (profile) {
    brandContext = `
BRAND CONTEXT:
Visual DNA: ${JSON.stringify(profile.visual_dna)}
Photography style: ${JSON.stringify(profile.photography_style)}
Color profile: ${JSON.stringify(profile.color_profile)}
Tone of voice: ${JSON.stringify(profile.tone_of_voice)}
    `.trim();
  }
}

// Inject into Gemini prompt
const prompt = `${brandContext}\n\nUser request: ${userInput}`;
```

❌ **WRONG:** Calling Gemini with only the user's prompt and no brand context — generates generic output that doesn't match the brand.

---

## Brand-Adaptive Theming Pattern

Components that need to render in the extension or mobile should use Tailwind's semantic color classes, not hardcoded color classes. The root component injects CSS variables from the brand color.

✅ **CORRECT:**
```tsx
// Uses semantic colors — adapts to brand theme automatically
<div className="bg-background text-foreground border-border">
  <span className="text-muted-foreground">Secondary text</span>
  <Button className="bg-accent text-accent-foreground">Action</Button>
</div>
```

❌ **WRONG:**
```tsx
// Hardcoded — breaks in extension/mobile where background is brand-colored
<div className="bg-zinc-950 text-white border-zinc-800">
  <span className="text-zinc-400">Secondary text</span>
</div>
```

**Why:** `mobile/src/MobileApp.tsx` injects `--background` as a CSS custom property on the root div, derived from the brand's primary color. Tailwind's `bg-background` picks this up. `bg-zinc-950` ignores it.

---

## Service Function Pattern

Services are plain TypeScript modules with named exported async functions. No classes.

✅ **CORRECT** (pattern from `src/services/brand-agent/brandAgentGeminiService.ts`):
```typescript
// ABOUTME: Brand Agent chat service with brand library context integration
// ABOUTME: Loads brand visual DNA, prompt library, and directives into Gemini system instruction

import { supabase } from '@/integrations/supabase/client';

export async function sendMessageToBrandAgent(
  message: string,
  conversationId: string | null,
  brandId: string | null,
  imageUrls?: string[]
) {
  const { data, error } = await supabase.functions.invoke('brand-prompt-agent', {
    body: {
      message,
      conversation_id: conversationId,
      brand_id: brandId,
      image_urls: imageUrls,
    },
  });
  if (error) throw error;
  return data;
}
```

❌ **WRONG:** Creating a service class with constructor dependency injection for something this straightforward.

**Why:** The codebase uses module-level singletons (the exported `supabase` client). Class-based services add boilerplate without benefit here.

---

## Error Handling Pattern

Edge functions return structured error responses — never let unhandled exceptions propagate to the client as HTML error pages.

✅ **CORRECT** (from `supabase/functions/analyze-expansion-direction/index.ts:89-94`):
```typescript
} catch (error) {
  return new Response(
    JSON.stringify({ error: error.message }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
  );
}
```

In the frontend, check the `success` field before using results:
```typescript
const result = await supabase.functions.invoke('generate-creative-image', { body: params });
if (!result.data?.success) {
  throw new Error(result.data?.error ?? 'Generation failed');
}
const imageUrls = result.data.image_urls;
```

❌ **WRONG:** Assuming `result.data.image_urls` exists without checking `result.data.success`.

---

## Known Technical Debt

**Location:** `tsconfig.json`
**Issue:** `noImplicitAny: false` and `strictNullChecks: false` — TypeScript runs in non-strict mode.
**Impact:** Null pointer errors, unexpected `undefined` values, and type mismatches won't be caught at compile time. They surface as runtime errors.
**Warning:** Do not add new code that relies on this permissiveness. Handle nulls explicitly.

**Location:** No test files exist (CONFIRMED — 0 test files in codebase).
**Issue:** No automated test coverage of any kind.
**Impact:** Regressions are only caught in manual testing or production.
**Warning:** Do not add features to untested paths without at minimum a manual test plan.
