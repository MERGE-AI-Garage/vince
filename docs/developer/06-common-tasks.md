# Common Development Tasks

## How to Add a New Edge Function

Edge functions are the AI orchestration layer. All 19 existing functions follow the same structure.

**1. Create the function directory and entry point**
```bash
mkdir supabase/functions/your-function-name
touch supabase/functions/your-function-name/index.ts
```

**2. Implement the function**

Start from this structure (matches every existing function):
```typescript
// ABOUTME: What this function does
// ABOUTME: Second line of context

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    );

    const { brand_id, user_id, ...params } = await req.json();

    // Load brand context if brand_id provided
    let brandProfile = null;
    if (brand_id) {
      const { data } = await supabaseClient
        .from('brand_profiles')
        .select('*')
        .eq('brand_id', brand_id)
        .single();
      brandProfile = data;
    }

    // ... your implementation ...

    return new Response(
      JSON.stringify({ success: true, result: '...' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
```

**3. Add to the deploy script**

Edit `scripts/deploy-functions.sh` and add:
```bash
supabase functions deploy your-function-name --no-verify-jwt
```

> The `--no-verify-jwt` flag is required on every function. Omitting it causes 401 errors.

**4. Deploy and test**
```bash
supabase functions deploy your-function-name --no-verify-jwt

curl -X POST https://<project-ref>.supabase.co/functions/v1/your-function-name \
  -H "Authorization: Bearer <anon-key>" \
  -H "Content-Type: application/json" \
  -d '{"brand_id": "<uuid>"}'
```

**5. Document the API**

Add a new section to [03-api-reference.md](03-api-reference.md) with the request/response shape.

---

## How to Add a New Shared Component

Shared components live in `src/components/` and are used by all three surfaces (web, extension, mobile).

**1. Create the component file**
```
src/components/your-feature/YourComponent.tsx
```

**2. Add the required file header**
```typescript
// ABOUTME: What this component does
// ABOUTME: Which surfaces use it and under what conditions
```

**3. Follow the shadcn/ui composition pattern**

Use components from `src/components/ui/` as building blocks:
```typescript
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader } from '@/components/ui/dialog';
```

**4. Handle the multi-surface context**

If behavior differs between surfaces, use the `source` prop pattern:
```typescript
interface YourComponentProps {
  source?: 'web' | 'mobile' | 'ios';
  // ... other props
}

export function YourComponent({ source }: YourComponentProps) {
  const isMobile = source === 'mobile' || source === 'ios';
  // ...
}
```

**5. Use Tailwind for all styles**

Use `bg-background`, `text-foreground`, `border-border` etc. for colors that adapt to the brand-adaptive dark theme in extension/mobile. Avoid hardcoded color classes (`bg-zinc-900`) in shared components.

---

## How to Add a Brand Intelligence Feature

Brand intelligence features typically involve: a new analysis type, a new edge function, and a new UI section in the Brand DNA tab.

**1. Define the data shape**

Add types to `src/types/creative-studio.ts`:
```typescript
interface YourAnalysisResult {
  // ...fields
}
```

**2. Add a Supabase migration** (if storing in DB)
```bash
supabase migration new add_your_analysis_column
```
Edit the generated file in `supabase/migrations/`. Add a column to the relevant table (likely `brand_profiles`).

**3. Create the edge function**

See "How to Add a New Edge Function" above. Load brand data, call Gemini, return structured results, optionally update `brand_profiles`.

**4. Add the service call**

Add a function to the appropriate service file in `src/services/`:
```typescript
// In src/services/brand-agent/brandAgentGeminiService.ts or a new service file

export async function analyzeYourThing(brandId: string, params: YourParams) {
  const { data, error } = await supabase.functions.invoke('your-function-name', {
    body: { brand_id: brandId, ...params }
  });
  if (error) throw error;
  return data;
}
```

**5. Wire up the UI**

The Brand DNA UI is in `src/components/creative-studio/`. Find the appropriate tab and add your section.

---

## How to Add a New Page (Web Only)

**1. Create the page component**
```
src/pages/YourPage.tsx
```

**2. Add ABOUTME header and implement the page**

**3. Add the route**

Routes are configured in `src/App.tsx` (or similar router file). Add:
```typescript
<Route path="/your-path" element={<YourPage />} />
```

**4. Add navigation link** if the page should appear in the nav.

---

## How to Debug Production Issues Locally

**1. Reproduce against the dev Supabase project**

Set `.env.local` to point at the dev project (same credentials as production if you share a project). Most issues are reproducible this way.

**2. Check edge function logs**

In the Supabase dashboard, go to **Edge Functions** → select the function → **Logs**. Production logs show the actual error.

**3. Test the edge function in isolation**

Use `curl` to call the function directly with a minimal payload:
```bash
curl -X POST https://<project-ref>.supabase.co/functions/v1/<function-name> \
  -H "Authorization: Bearer <anon-key>" \
  -H "Content-Type: application/json" \
  -d '{"brand_id": "<known-good-uuid>", "user_id": "<uuid>"}' | jq .
```

**4. Check Gemini API quota**

If AI calls are failing silently, check the Gemini API console for quota exhaustion. The `GEMINI_API_KEY` is in Supabase Vault — verify it's correct there.

**5. Check Supabase RLS policies**

If DB reads/writes are failing, Row Level Security policies may be blocking the request. The edge function uses the service role key, so RLS shouldn't apply to edge function DB calls — but verify the function is actually using the service role key and not the anon key for sensitive operations.

---

## How to Add a Mobile Tab

Mobile tabs are defined in `mobile/src/MobileApp.tsx`.

**1. Create the tab component**
```
mobile/src/YourTab.tsx
```

**2. Add it to the tabs array in `MobileApp.tsx`**
```typescript
{ id: 'your-tab', label: 'Label', icon: SomeIcon, component: YourTab }
```

**3. Handle brand theming**

The mobile root injects `--background` as a CSS variable based on the active brand's color. Your tab will automatically inherit `bg-background` if you use Tailwind's semantic color classes.

**4. Build and sync**
```bash
cd mobile && npx vite build && npx cap sync
```

---

## How to Deploy All Edge Functions

```bash
npm run deploy:functions
```

This runs `scripts/deploy-functions.sh`, which deploys every function with `--no-verify-jwt`. Deployment takes 1–3 minutes per function.

To deploy a single function:
```bash
supabase functions deploy <function-name> --no-verify-jwt
```
